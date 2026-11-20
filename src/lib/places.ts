import { GeoPoint, distanceMeters } from './device';

/**
 * Lieux réels autour de l'utilisateur, issus d'OpenStreetMap (API Overpass, gratuite,
 * sans clé). Plusieurs serveurs sont essayés car ils sont parfois saturés.
 */

export type PlaceCategory = 'police' | 'pharmacie' | 'sante';

export interface RealPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lon: number;
  distance: number; // mètres
  address?: string;
  phone?: string;
  openingHours?: string;
}

export const PLACE_CATEGORY_INFO: Record<
  PlaceCategory,
  { label: string; plural: string; color: string; hint: string }
> = {
  police: {
    label: 'Police / Gendarmerie',
    plural: 'Police',
    color: '#2663FF',
    hint: 'Protection immédiate, plainte ou main courante. Souvent ouvert 24h/24.',
  },
  pharmacie: {
    label: 'Pharmacie',
    plural: 'Pharmacies',
    color: '#00A884',
    hint: 'Lieu ouvert et fréquenté : vous pouvez y entrer pour vous mettre à l’abri et demander de l’aide.',
  },
  sante: {
    label: 'Hôpital / Clinique',
    plural: 'Santé',
    color: '#E5484D',
    hint: 'Soins en cas de blessure. Les urgences sont ouvertes 24h/24.',
  },
};

// Secours uniquement : ces serveurs sont souvent lents (10 à 50 s) ou saturés
const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildQuery({ lat, lon }: GeoPoint): string {
  const at = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  return `[out:json][timeout:20];
(
  nwr["amenity"="police"](around:6000,${at});
  nwr["amenity"="pharmacy"](around:1500,${at});
  nwr["amenity"~"^(hospital|clinic)$"](around:6000,${at});
);
out center tags 150;`;
}

function categorize(tags: Record<string, string>): PlaceCategory | null {
  switch (tags.amenity) {
    case 'police':
      return 'police';
    case 'pharmacy':
      return 'pharmacie';
    case 'hospital':
    case 'clinic':
      return 'sante';
    default:
      return null;
  }
}

function formatAddress(tags: Record<string, string>): string | undefined {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const city = tags['addr:city'];
  const out = [street, city].filter(Boolean).join(', ');
  return out || undefined;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

const CACHE_PREFIX = 'mbt_places_v2_';
const inFlight = new Map<string, Promise<RealPlace[]>>();

/**
 * Lieux sûrs réels triés du plus proche au plus loin.
 * Source principale : Nominatim (rapide, < 1 s par catégorie), avec affichage progressif.
 * Secours : Overpass si Nominatim est indisponible.
 */
export function fetchNearbyPlaces(
  origin: GeoPoint,
  onProgress?: (partial: RealPlace[]) => void
): Promise<RealPlace[]> {
  const key = `${origin.lat.toFixed(3)}_${origin.lon.toFixed(3)}`;
  const cacheKey = CACHE_PREFIX + key;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return Promise.resolve(JSON.parse(cached) as RealPlace[]);
  } catch {
    // cache indisponible
  }

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    let places: RealPlace[];
    try {
      places = await fetchFromNominatim(origin, onProgress);
      if (places.length === 0) throw new Error('Aucun résultat');
    } catch {
      places = await fetchFromOverpass(origin);
    }
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(places));
    } catch {
      // ignore
    }
    return places;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/* ---------------------------- Nominatim ---------------------------- */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Rayon de recherche (m) : élargi si trop peu de résultats à proximité
const NOMINATIM_QUERIES: { category: PlaceCategory; amenity: string; radii: number[] }[] = [
  { category: 'police', amenity: 'police', radii: [3000, 10000] },
  { category: 'pharmacie', amenity: 'pharmacy', radii: [900, 3000] },
  { category: 'sante', amenity: 'hospital', radii: [4000, 15000] },
];

interface NominatimItem {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string>;
}

// Politique d'usage de Nominatim : au plus une requête par seconde
let lastNominatimCall = 0;
async function throttleNominatim() {
  const wait = lastNominatimCall + 1050 - Date.now();
  if (wait > 0) await new Promise((r) => window.setTimeout(r, wait));
  lastNominatimCall = Date.now();
}

function viewbox({ lat, lon }: GeoPoint, radius: number): string {
  const dLat = radius / 111320;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lon - dLon, lat + dLat, lon + dLon, lat - dLat].map((v) => v.toFixed(5)).join(',');
}

async function nominatimSearch(origin: GeoPoint, amenity: string, radius: number): Promise<NominatimItem[]> {
  await throttleNominatim();
  const params = new URLSearchParams({
    amenity,
    format: 'jsonv2',
    limit: '30',
    bounded: '1',
    viewbox: viewbox(origin, radius),
    extratags: '1',
    addressdetails: '1',
    'accept-language': 'fr',
  });
  const res = await fetchWithTimeout(`${NOMINATIM_URL}?${params}`, {}, 10000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as NominatimItem[];
}

async function fetchFromNominatim(
  origin: GeoPoint,
  onProgress?: (partial: RealPlace[]) => void
): Promise<RealPlace[]> {
  const byId = new Map<string, RealPlace>();
  let failures = 0;

  for (const q of NOMINATIM_QUERIES) {
    try {
      let items: NominatimItem[] = [];
      for (const radius of q.radii) {
        items = await nominatimSearch(origin, q.amenity, radius);
        if (items.length >= 3) break;
      }
      for (const it of items) {
        const lat = Number(it.lat);
        const lon = Number(it.lon);
        const tags = it.extratags ?? {};
        const a = it.address ?? {};
        const street = [a.house_number, a.road].filter(Boolean).join(' ');
        const city = a.city || a.town || a.village || a.suburb;
        const id = `${it.osm_type}/${it.osm_id}`;
        byId.set(id, {
          id,
          name: it.name || defaultName(q.category),
          category: q.category,
          lat,
          lon,
          distance: distanceMeters(origin, { lat, lon }),
          address: [street, city].filter(Boolean).join(', ') || undefined,
          phone: tags.phone || tags['contact:phone'] || undefined,
          openingHours: tags.opening_hours || undefined,
        });
      }
      onProgress?.(sortByDistance([...byId.values()]));
    } catch {
      failures++;
    }
  }
  if (failures === NOMINATIM_QUERIES.length) throw new Error('Nominatim indisponible');
  return sortByDistance([...byId.values()]);
}

const sortByDistance = (places: RealPlace[]) => places.sort((a, b) => a.distance - b.distance);

const defaultName = (category: PlaceCategory) =>
  category === 'police' ? 'Commissariat / Gendarmerie' : category === 'pharmacie' ? 'Pharmacie' : 'Centre de santé';

/* ----------------------------- Overpass ---------------------------- */

async function fetchFromOverpass(origin: GeoPoint): Promise<RealPlace[]> {
  const body = new URLSearchParams({ data: buildQuery(origin) });
  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(endpoint, { method: 'POST', body }, 25000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return parseElements(json.elements ?? [], origin);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Aucun serveur disponible');
}

function parseElements(elements: OverpassElement[], origin: GeoPoint): RealPlace[] {
  const seen = new Set<string>();
  const places: RealPlace[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const category = categorize(tags);
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!category || lat === undefined || lon === undefined) continue;

    const name = tags.name || defaultName(category);
    // Un même lieu peut exister en point + bâtiment : on dédoublonne par nom + position
    const dedupKey = `${name}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    places.push({
      id: `${el.type}/${el.id}`,
      name,
      category,
      lat,
      lon,
      distance: distanceMeters(origin, { lat, lon }),
      address: formatAddress(tags),
      phone: tags.phone || tags['contact:phone'] || undefined,
      openingHours: tags.opening_hours || undefined,
    });
  }

  return sortByDistance(places);
}

/* ------------------------------------------------------------------ */
/* Recherche de ville / adresse (Géoplateforme IGN — API Adresse)      */
/* ------------------------------------------------------------------ */

export interface GeocodeResult {
  label: string;
  point: GeoPoint;
}

const GEOCODE_ENDPOINTS = [
  'https://data.geopf.fr/geocodage/search',
  'https://api-adresse.data.gouv.fr/search/',
];

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  let lastError: unknown = null;
  for (const endpoint of GEOCODE_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(
        `${endpoint}?q=${encodeURIComponent(q)}&limit=5`,
        {},
        8000
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        features?: { geometry: { coordinates: [number, number] }; properties: { label: string } }[];
      };
      return (json.features ?? []).map((f) => ({
        label: f.properties.label,
        point: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] },
      }));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Recherche indisponible');
}

/* ------------------------------------------------------------------ */
/* Horaires OpenStreetMap → français lisible                          */
/* ------------------------------------------------------------------ */

const OSM_DAYS: Record<string, string> = {
  Mo: 'lun', Tu: 'mar', We: 'mer', Th: 'jeu', Fr: 'ven', Sa: 'sam', Su: 'dim', PH: 'fériés',
};

/** « Mo-Fr 08:30-19:30; Sa 09:00-12:00 » → « lun–ven 8h30–19h30 · sam 9h–12h » */
export function formatOpeningHours(raw: string): string {
  const value = raw.trim();
  if (value === '24/7') return 'Ouvert 24h/24, 7j/7';
  return value
    .split(';')
    .map((part) =>
      part
        .trim()
        .replace(/\b00:00-24:00\b/g, '24h/24')
        .replace(/(\d{2}):(\d{2})/g, (_, h: string, m: string) => `${Number(h)}h${m === '00' ? '' : m}`)
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => OSM_DAYS[d])
        .replace(/(\d+h\d*)-(\d+h\d*)/g, '$1–$2')
        .replace(/([a-zé]{3})-([a-zé]{3})/g, '$1–$2')
        .replace(/\boff\b/g, 'fermé')
        .replace(/,/g, ', ')
    )
    .filter(Boolean)
    .join(' · ');
}
