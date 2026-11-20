/**
 * Fonctions « réelles » liées au téléphone : appel, SMS, partage, vibration.
 * Tout passe par des liens standards (tel:, sms:) ou des API web natives, sans serveur.
 */

/** Retire espaces, points, tirets et parenthèses d'un numéro. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s.\-()]/g, '');
}

/** Vrai sur les appareils tactiles (téléphones, tablettes) capables de passer un appel. */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
}

export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export const telHref = (phone: string) => `tel:${normalizePhone(phone)}`;

/** Lien SMS pré-rempli, compatible iOS et Android. */
export function smsHref(phones: string | string[], body = ''): string {
  const list = (Array.isArray(phones) ? phones : [phones]).map(normalizePhone).filter(Boolean);
  // iOS accepte plusieurs destinataires via /open?addresses=, Android via des virgules.
  const recipients = isIOS() && list.length > 1 ? `/open?addresses=${list.join(',')}` : list.join(',');
  if (!body) return `sms:${recipients}`;
  const sep = recipients.includes('?') ? '&' : isIOS() ? '?&' : '?';
  return `sms:${recipients}${sep}body=${encodeURIComponent(body)}`;
}

/** Ouvre le composeur du téléphone sur ce numéro. */
export function dial(phone: string) {
  window.location.href = telHref(phone);
}

/** Petite vibration de confirmation, si l'appareil le permet. */
export function vibrate(pattern: number | number[] = 30) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // non supporté
  }
}

/** Partage natif (feuille de partage du téléphone). Renvoie false si indisponible ou annulé. */
export async function shareText(text: string, title = 'MBT'): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Géolocalisation                                                    */
/* ------------------------------------------------------------------ */

export interface GeoPoint {
  lat: number;
  lon: number;
  accuracy?: number;
}

export type GeoErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GeoError extends Error {
  constructor(public kind: GeoErrorKind) {
    super(kind);
  }
}

export function getCurrentPosition(timeoutMs = 12000): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoError('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) =>
        reject(
          new GeoError(
            err.code === err.PERMISSION_DENIED
              ? 'denied'
              : err.code === err.TIMEOUT
                ? 'timeout'
                : 'unavailable'
          )
        ),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

export const GEO_ERROR_MESSAGES: Record<GeoErrorKind, string> = {
  unsupported: 'Votre appareil ne permet pas la localisation.',
  denied:
    'Localisation refusée. Autorisez-la dans les réglages du navigateur, ou cherchez une ville.',
  unavailable: 'Position introuvable pour le moment. Réessayez à l’extérieur ou cherchez une ville.',
  timeout: 'La localisation prend trop de temps. Réessayez ou cherchez une ville.',
};

/** Distance en mètres entre deux points (formule de haversine). */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** « 180 m · 2 min » à pied (≈ 80 m/min). */
export function formatWalk(meters: number): string {
  const dist = meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
  const minutes = Math.max(1, Math.round(meters / 80));
  return `${dist} · ${minutes} min à pied`;
}

export const googleMapsPointUrl = (p: GeoPoint) =>
  `https://maps.google.com/?q=${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;

/** Itinéraire piéton dans l'appli de cartes du téléphone. */
export function directionsUrl(dest: GeoPoint, origin?: GeoPoint | null): string {
  if (isIOS()) {
    const from = origin ? `&saddr=${origin.lat},${origin.lon}` : '';
    return `https://maps.apple.com/?daddr=${dest.lat},${dest.lon}${from}&dirflg=w`;
  }
  const from = origin ? `&origin=${origin.lat},${origin.lon}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lon}${from}&travelmode=walking`;
}
