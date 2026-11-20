import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, ExternalLink, Info, Loader2, LocateFixed, MapPin, Navigation, Phone, RefreshCw, Search } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { MbtButton } from '../components/MbtButton';
import { PlacesMap } from '../components/PlacesMap';
import { THEMES, ThemeKey, findServiceKey } from '../data/content';
import { useSerenity } from '../context/SerenityContext';
import { GEO_ERROR_MESSAGES, GeoError, GeoPoint, directionsUrl, formatWalk, getCurrentPosition } from '../lib/device';
import {
  GeocodeResult,
  PLACE_CATEGORY_INFO,
  PlaceCategory,
  RealPlace,
  fetchNearbyPlaces,
  formatOpeningHours,
  geocode,
} from '../lib/places';

interface SafePlacesScreenProps {
  theme?: ThemeKey;
  onBack: () => void;
  onHome: () => void;
  onCall: (serviceKey: string, customLabel?: string, customPhone?: string) => void;
}

type Status = 'choose' | 'locating' | 'loading' | 'ready' | 'error';

const FILTERS: { key: 'all' | PlaceCategory; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'police', label: PLACE_CATEGORY_INFO.police.plural },
  { key: 'pharmacie', label: PLACE_CATEGORY_INFO.pharmacie.plural },
  { key: 'sante', label: PLACE_CATEGORY_INFO.sante.plural },
];

/**
 * Lieux d'aide à proximité (données OpenStreetMap).
 * - La position n'est demandée QUE si l'utilisateur appuie sur « Utiliser ma position » ; aucun suivi continu.
 * - « Lieu d'aide » = lieu public où trouver des adultes (police/gendarmerie, pharmacie, hôpital).
 *   MBT ne vérifie ni ces lieux ni leurs horaires : c'est indiqué à l'écran.
 */
export const SafePlacesScreen: React.FC<SafePlacesScreenProps> = ({ theme = 'default', onBack, onHome, onCall }) => {
  const { nightMode } = useSerenity();
  const palette = THEMES[theme];
  const accent = theme === 'default' ? '#FF8989' : palette.accent;
  const badgeColor = theme === 'default' ? '#E5BE1A' : palette.accent;
  const card = nightMode ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-white border-black/10 text-[#1d1b20]';
  const muted = nightMode ? 'text-white/60' : 'text-[#666]';

  const [status, setStatus] = useState<Status>('choose');
  const [message, setMessage] = useState<string | null>(null);
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [originLabel, setOriginLabel] = useState('');
  const [places, setPlaces] = useState<RealPlace[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | PlaceCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);

  const loadPlaces = useCallback(async (point: GeoPoint) => {
    setStatus('loading');
    setMessage(null);
    setLoadingMore(true);
    const show = (found: RealPlace[]) => {
      if (!found.length) return;
      setPlaces(found);
      setSelectedId((prev) => (prev && found.some((p) => p.id === prev) ? prev : found[0].id));
      setStatus('ready');
    };
    try {
      const found = await fetchNearbyPlaces(point, show);
      setPlaces(found);
      if (found.length) show(found);
      setStatus('ready');
    } catch {
      setStatus('error');
      setMessage('Les serveurs de cartes ne répondent pas pour le moment. Réessaie dans quelques secondes.');
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const locateMe = useCallback(async () => {
    setStatus('locating');
    setMessage(null);
    try {
      const point = await getCurrentPosition();
      setOrigin(point);
      setOriginLabel('Ma position');
      await loadPlaces(point);
    } catch (err) {
      setStatus(origin ? 'ready' : 'choose');
      setMessage(GEO_ERROR_MESSAGES[(err as GeoError).kind] ?? GEO_ERROR_MESSAGES.unavailable);
    }
  }, [loadPlaces, origin]);

  // Recherche de ville / adresse pendant la frappe
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await geocode(query));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const chooseResult = (r: GeocodeResult) => {
    setOrigin(r.point);
    setOriginLabel(r.label);
    setQuery('');
    setResults([]);
    void loadPlaces(r.point);
  };

  const visible = useMemo(() => (filter === 'all' ? places : places.filter((p) => p.category === filter)), [places, filter]);
  const selected = visible.find((p) => p.id === selectedId) ?? visible[0] ?? null;

  const callPlace = (place: RealPlace) => {
    if (!place.phone) return;
    const key = findServiceKey(place.phone);
    if (key) onCall(key);
    else onCall('custom', place.name, place.phone);
  };

  const searchBox = (
    <div className={`rounded-[20px] border-2 px-3 py-2.5 ${card}`}>
      <div className="flex items-center gap-2">
        <Search className={`w-4 h-4 shrink-0 ${muted}`} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher une ville ou une adresse"
          aria-label="Chercher une ville ou une adresse"
          className="flex-1 min-w-0 bg-transparent text-[16px] focus:outline-none"
        />
        {searching && <Loader2 className="w-4 h-4 animate-spin text-[#888]" />}
      </div>
      {results.length > 0 && (
        <ul className="mt-1.5">
          {results.map((r) => (
            <li key={`${r.label}_${r.point.lat}`}>
              <button type="button" onClick={() => chooseResult(r)} className="w-full text-left px-2 py-2 rounded-lg text-[14px] hover:bg-black/5 cursor-pointer">
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <ScreenShell theme={theme} showBack onBack={onBack} onBrandClick={onHome}>
      <div className="px-4 mt-3 flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <MbtButton color={badgeColor} size="badge" className="!h-[58px]" interactive={false}>
            OÙ ALLER ?
          </MbtButton>
          {status === 'ready' && (
            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border ${card}`}>
              {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              {visible.length} lieu{visible.length > 1 ? 'x' : ''}
            </span>
          )}
        </div>

        {/* Définition objective de ce qui est affiché */}
        <div className={`rounded-[20px] border px-4 py-3 text-[13px] leading-snug flex gap-2.5 ${card}`}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
          <p>
            <strong>Lieux d’aide à proximité</strong> : commissariats et gendarmeries, pharmacies, hôpitaux. Ce sont des lieux
            publics où trouver des adultes. <span className={muted}>Données OpenStreetMap, non vérifiées par MBT : horaires et
            accueil peuvent varier.</span>
          </p>
        </div>

        {status === 'choose' || (status === 'locating' && !origin) ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void locateMe()}
              disabled={status === 'locating'}
              className="h-[60px] rounded-[30px] text-white font-ubuntu font-medium text-[18px] inline-flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] transition cursor-pointer"
              style={{ backgroundColor: accent }}
            >
              {status === 'locating' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
              {status === 'locating' ? 'Localisation…' : 'Utiliser ma position'}
            </button>
            <p className={`-mt-1 px-2 text-[12px] leading-snug text-center ${muted}`}>
              Ta position sert uniquement à cette recherche (envoyée au service OpenStreetMap). Elle n’est ni suivie ni
              enregistrée.
            </p>
            {message && <p className="px-2 text-[13px] text-[#d4474c] text-center">{message}</p>}
            <p className={`text-center text-[12px] font-semibold uppercase tracking-wider ${muted}`}>ou</p>
            {searchBox}
          </div>
        ) : (
          <>
            <div className={`rounded-[20px] border-2 px-3.5 py-2.5 flex items-center gap-2 ${card}`}>
              <MapPin className="w-4 h-4 shrink-0" style={{ color: accent }} />
              <span className="flex-1 min-w-0 text-[13px] truncate">
                Autour de : <strong>{originLabel}</strong>
              </span>
              <button
                type="button"
                onClick={() => void locateMe()}
                aria-label="Utiliser ma position"
                title="Utiliser ma position"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 cursor-pointer"
              >
                {status === 'locating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              </button>
            </div>
            {searchBox}
            {message && <p className="px-2 text-[13px] text-[#d4474c]">{message}</p>}

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setFilter(f.key);
                      const first = f.key === 'all' ? places[0] : places.find((p) => p.category === f.key);
                      setSelectedId(first?.id ?? null);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-medium border cursor-pointer"
                    style={{ backgroundColor: active ? accent : 'transparent', borderColor: accent, color: active ? '#fff' : accent }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div
              className="relative w-full h-[280px] lg:h-[340px] rounded-[26px] overflow-hidden border-[4px] shadow-[0_10px_28px_rgba(0,0,0,0.08)] bg-[#eef3f7] isolate"
              style={{ borderColor: accent }}
            >
              {origin && <PlacesMap origin={origin} places={visible} selectedId={selected?.id ?? null} onSelect={setSelectedId} />}
              {status !== 'ready' && (
                <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 px-6 text-center bg-white/85">
                  {status === 'error' ? (
                    <>
                      <p className="text-[13px] text-[#3b3b3b]">{message}</p>
                      <button
                        type="button"
                        onClick={() => origin && void loadPlaces(origin)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[13px] font-semibold cursor-pointer"
                        style={{ backgroundColor: accent }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Réessayer
                      </button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-7 h-7 animate-spin" style={{ color: accent }} />
                      <p className="text-[13px] font-medium text-[#3b3b3b]">Recherche des lieux autour…</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {status === 'ready' && selected && (
              <div className={`rounded-[24px] p-4 border-2 ${card}`}>
                <span
                  className="inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full mb-1.5 text-white"
                  style={{ backgroundColor: PLACE_CATEGORY_INFO[selected.category].color }}
                >
                  {PLACE_CATEGORY_INFO[selected.category].label}
                </span>
                <h2 className="font-ubuntu font-bold text-[16.5px] leading-snug">{selected.name}</h2>
                <div className={`mt-2 flex flex-col gap-1 text-[13px] ${muted}`}>
                  <span className="inline-flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    {formatWalk(selected.distance)}
                    {selected.address ? ` · ${selected.address}` : ''}
                  </span>
                  <span className="inline-flex items-start gap-1.5">
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {selected.openingHours ? formatOpeningHours(selected.openingHours) : 'Horaires non renseignés'}
                  </span>
                </div>
                <p className="mt-2.5 text-[13px] leading-[1.45]">{PLACE_CATEGORY_INFO[selected.category].hint}</p>
                <div className={`mt-3.5 grid gap-2.5 ${selected.phone ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <a
                    href={directionsUrl(selected, origin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl text-white font-ubuntu font-medium text-[14.5px] active:scale-95 transition"
                    style={{ backgroundColor: accent }}
                  >
                    <Navigation className="w-4 h-4" />
                    Itinéraire à pied
                  </a>
                  {selected.phone && (
                    <button
                      type="button"
                      onClick={() => callPlace(selected)}
                      className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border-2 font-ubuntu font-medium text-[14.5px] active:scale-95 transition cursor-pointer"
                      style={{ borderColor: accent, color: accent }}
                    >
                      <Phone className="w-4 h-4" />
                      Appeler
                    </button>
                  )}
                </div>
                <p className={`mt-2 text-[11.5px] ${muted}`}>L’itinéraire s’ouvre dans ton application de cartes.</p>
              </div>
            )}

            {status === 'ready' && visible.length === 0 && (
              <p className={`text-center text-[13.5px] px-4 ${muted}`}>Aucun lieu de ce type trouvé à proximité.</p>
            )}

            {status === 'ready' && visible.length > 1 && (
              <div className={`rounded-[24px] border-2 overflow-hidden ${card}`}>
                <p className={`px-4 pt-3 pb-1.5 text-[11px] uppercase tracking-wider font-bold ${muted}`}>Les plus proches</p>
                <ul>
                  {visible.slice(0, 12).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        aria-current={p.id === selected?.id}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-black/5 cursor-pointer ${
                          p.id === selected?.id ? 'bg-black/[0.05]' : 'hover:bg-black/[0.03]'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PLACE_CATEGORY_INFO[p.category].color }} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] font-medium truncate">{p.name}</span>
                          <span className={`block text-[12px] ${muted}`}>{formatWalk(p.distance)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <a
          href="https://www.google.com/maps/search/?api=1&query=commissariat%20gendarmerie"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-1.5 text-[12.5px] underline underline-offset-2 ${muted}`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Chercher dans Google Maps
        </a>
      </div>
    </ScreenShell>
  );
};
