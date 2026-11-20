import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  LocateFixed,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { MbtButton } from '../components/MbtButton';
import { PlacesMap } from '../components/PlacesMap';
import { THEMES, ThemeKey } from '../data/content';
import { useSerenity } from '../context/SerenityContext';
import {
  GEO_ERROR_MESSAGES,
  GeoError,
  GeoPoint,
  getCurrentPosition,
} from '../lib/device';
import {
  fetchNearbyPlaces,
  formatOpeningHours,
  geocode,
  PLACE_CATEGORY_INFO,
  PlaceCategory,
  RealPlace,
} from '../lib/places';

interface SafePlacesScreenProps {
  theme: ThemeKey;
  onBack: () => void;
  onHome: () => void;
  onCall: (serviceKey: string, customLabel?: string, customPhone?: string) => void;
}

const DEFAULT_ORIGIN: GeoPoint = { lat: 48.8566, lon: 2.3522 }; // Paris fallback if GPS unavailable

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export const SafePlacesScreen: React.FC<SafePlacesScreenProps> = ({
  theme,
  onBack,
  onHome,
  onCall,
}) => {
  const { nightMode } = useSerenity();
  const palette = THEMES[theme];
  const accentColor = theme === 'default' ? '#FF8989' : palette.accent;
  const badgeColor = theme === 'default' ? '#E5BE1A' : palette.accent;

  const [origin, setOrigin] = useState<GeoPoint>(DEFAULT_ORIGIN);
  const [originLabel, setOriginLabel] = useState<string>('Paris (par défaut)');
  const [places, setPlaces] = useState<RealPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | PlaceCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);

  const loadForPoint = useCallback(async (pt: GeoPoint) => {
    setLoading(true);
    try {
      const results = await fetchNearbyPlaces(pt, (partial) => {
        if (partial.length > 0) {
          setPlaces(partial);
          setSelectedId((prev) => prev ?? partial[0].id);
        }
      });
      setPlaces(results);
      if (results.length > 0) {
        setSelectedId((prev) => (prev && results.some((r) => r.id === prev) ? prev : results[0].id));
      }
    } catch {
      setGeoNotice('Impossible de charger les lieux OpenStreetMap pour le moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  const locateMe = useCallback(async () => {
    setGeoNotice(null);
    setLoading(true);
    try {
      const pos = await getCurrentPosition(9000);
      setOrigin(pos);
      setOriginLabel('Autour de votre position');
      await loadForPoint(pos);
    } catch (err) {
      const msg = GEO_ERROR_MESSAGES[(err as GeoError).kind] ?? GEO_ERROR_MESSAGES.unavailable;
      setGeoNotice(msg);
      await loadForPoint(DEFAULT_ORIGIN);
    }
  }, [loadForPoint]);

  useEffect(() => {
    void locateMe();
  }, [locateMe]);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cityQuery.trim().length < 3) return;
    setSearchingCity(true);
    setGeoNotice(null);
    try {
      const hits = await geocode(cityQuery);
      if (hits.length === 0) {
        setGeoNotice('Aucune ville ou adresse trouvée.');
      } else {
        setOrigin(hits[0].point);
        setOriginLabel(hits[0].label);
        setSelectedId(null);
        await loadForPoint(hits[0].point);
      }
    } catch {
      setGeoNotice('Recherche d’adresse momentanément indisponible.');
    } finally {
      setSearchingCity(false);
    }
  };

  const visiblePlaces = filter === 'all' ? places : places.filter((p) => p.category === filter);
  const selected = visiblePlaces.find((p) => p.id === selectedId) || visiblePlaces[0] || null;

  const handleCallPlace = (place: RealPlace) => {
    if (place.phone) {
      onCall('custom', place.name, place.phone);
    } else if (place.category === 'police') {
      onCall('17');
    } else if (place.category === 'sante') {
      onCall('15');
    } else {
      onCall('urgence');
    }
  };

  return (
    <ScreenShell
      theme={theme}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={() => onCall('urgence')}
      scrollable
    >
      <div className="px-4 mt-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <MbtButton color={badgeColor} size="badge" className="!h-[58px]" interactive={false}>
            OÙ ALLER ?
          </MbtButton>
          <span
            className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-full border ${
              nightMode
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {loading ? 'Recherche…' : `${visiblePlaces.length} lieux réels`}
          </span>
        </div>

        {/* City / Address Search + GPS Button */}
        <form onSubmit={handleCitySearch} className="flex gap-1.5">
          <div
            className={`flex-1 flex items-center gap-2 rounded-2xl px-3 h-10 border ${
              nightMode
                ? 'bg-[#1c2033] border-white/12 text-white'
                : 'bg-white/90 border-black/10 text-[#1d1b20]'
            }`}
          >
            <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Chercher une ville ou adresse…"
              className="flex-1 bg-transparent text-[13px] focus:outline-none placeholder:text-[#8e8e93]"
            />
            {searchingCity && <Loader2 className="w-4 h-4 animate-spin text-[#7174AA]" />}
          </div>
          <button
            type="button"
            onClick={() => void locateMe()}
            title="Me localiser"
            aria-label="Me localiser"
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 cursor-pointer transition ${
              nightMode
                ? 'bg-[#1c2033] border-white/12 text-white hover:bg-white/10'
                : 'bg-white border-black/10 text-[#3b3b3b] hover:bg-black/5'
            }`}
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'police', 'pharmacie', 'sante'] as const).map((cat) => {
            const active = filter === cat;
            const label = cat === 'all' ? 'Tous' : PLACE_CATEGORY_INFO[cat].plural;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition cursor-pointer border"
                style={{
                  backgroundColor: active ? accentColor : nightMode ? '#1c2033' : '#ffffff',
                  borderColor: accentColor,
                  color: active ? '#ffffff' : nightMode ? '#e0e4f5' : accentColor,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Real OpenStreetMap Leaflet Map */}
        <div
          className="relative w-full h-[230px] rounded-[26px] overflow-hidden border-[4px] shadow-[0_10px_28px_rgba(0,0,0,0.08)] bg-[#eef4f8]"
          style={{ borderColor: accentColor }}
        >
          <PlacesMap
            origin={origin}
            places={visiblePlaces}
            selectedId={selected?.id ?? null}
            onSelect={(id) => setSelectedId(id)}
          />
          <div className="pointer-events-none absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10.5px] font-medium text-[#3b3b3b] shadow-xs max-w-[75%] truncate">
            {originLabel}
          </div>
        </div>

        {geoNotice && (
          <p className="text-[11.5px] text-amber-600 dark:text-amber-300 px-1">{geoNotice}</p>
        )}

        {/* Selected Real Safe Place Card */}
        {selected ? (
          <div
            className={`rounded-[24px] p-4 border-2 shadow-[0_8px_22px_rgba(0,0,0,0.06)] ${
              nightMode ? 'bg-[#1c2033]/92 border-white/10' : 'bg-white border-black/10'
            }`}
          >
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full mb-1.5 text-white"
              style={{ backgroundColor: PLACE_CATEGORY_INFO[selected.category].color }}
            >
              {PLACE_CATEGORY_INFO[selected.category].label}
            </span>
            <h2
              className={`font-ubuntu font-bold text-[16px] leading-snug ${
                nightMode ? 'text-[#f3f4fa]' : 'text-[#1d1b20]'
              }`}
            >
              {selected.name}
            </h2>

            <div
              className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] ${
                nightMode ? 'text-[#aeb4ce]' : 'text-[#555]'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#888]" />
                {selected.address ? `${selected.address} · ` : ''}
                {formatDistance(selected.distance)}
              </span>
              {selected.openingHours && (
                <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {formatOpeningHours(selected.openingHours)}
                </span>
              )}
            </div>

            <p
              className={`mt-2 text-[12.5px] leading-[1.45] ${
                nightMode ? 'text-[#d0d5ec]' : 'text-[#3b3b3b]'
              }`}
            >
              {PLACE_CATEGORY_INFO[selected.category].hint}
            </p>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lon}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-white font-ubuntu font-medium text-[14px] active:scale-95 transition"
                style={{ backgroundColor: accentColor }}
              >
                <Navigation className="w-4 h-4" />
                Y aller
              </a>
              <button
                type="button"
                onClick={() => handleCallPlace(selected)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border-2 font-ubuntu font-medium text-[14px] active:scale-95 transition cursor-pointer ${
                  nightMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-black/5'
                }`}
                style={{ borderColor: accentColor, color: nightMode ? '#eef0fa' : accentColor }}
              >
                <Phone className="w-4 h-4" />
                Appeler
              </button>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-6 text-[13px] text-[#8e8e93]">
              Aucun lieu trouvé dans cette catégorie. Essaie « Tous » ou cherche une autre ville.
            </div>
          )
        )}
      </div>
    </ScreenShell>
  );
};
