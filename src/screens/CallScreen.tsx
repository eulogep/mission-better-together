import React, { useState } from 'react';
import { ChevronLeft, ExternalLink, Loader2, MapPin, MessageSquareText, Phone } from 'lucide-react';
import { EMERGENCY_SERVICES, EmergencyServiceInfo } from '../data/content';
import {
  GEO_ERROR_MESSAGES,
  GeoError,
  GeoPoint,
  getCurrentPosition,
  googleMapsPointUrl,
  isTouchDevice,
  smsHref,
  telHref,
} from '../lib/device';

interface CallScreenProps {
  serviceKey: string;
  customName?: string;
  customPhone?: string;
  onBack: () => void;
}

/** Services pour lesquels proposer le SMS au 114 quand on ne peut pas parler. */
const SMS_114_FOR = new Set(['urgence', '17', '15', '3919']);

function sms114Body(position: GeoPoint | null): string {
  const where = position
    ? `Ma position : ${googleMapsPointUrl(position)} (précision ~${Math.round(position.accuracy ?? 0)} m).`
    : 'Je suis à : [adresse]';
  return `URGENCE. Je ne peux pas parler. J'ai besoin d'aide : [ce qui se passe]. ${where}`;
}

/**
 * Écran d'appel réel : sur téléphone, le composeur s'ouvre dès l'appui (voir App.callService) ;
 * cet écran sert de relais (rappeler, écrire plutôt qu'appeler, SMS au 114, infos du service).
 */
export const CallScreen: React.FC<CallScreenProps> = ({ serviceKey, customName, customPhone, onBack }) => {
  const service: EmergencyServiceInfo = EMERGENCY_SERVICES[serviceKey] || {
    code: serviceKey,
    displayName: customName || customPhone || serviceKey,
    dialNumber: customPhone || serviceKey,
    subtitle: 'Contact de confiance',
    availability: 'Appel direct',
    description: 'Contact que vous avez enregistré dans Mission Better Together.',
  };

  const touch = isTouchDevice();
  const offer114 = !service.smsOnly && SMS_114_FOR.has(serviceKey);
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const addPosition = async () => {
    setLocating(true);
    setGeoError(null);
    try {
      setPosition(await getCurrentPosition());
    } catch (err) {
      setGeoError(GEO_ERROR_MESSAGES[(err as GeoError).kind] ?? GEO_ERROR_MESSAGES.unavailable);
    } finally {
      setLocating(false);
    }
  };

  const primaryHref = service.smsOnly
    ? smsHref(service.dialNumber, sms114Body(position))
    : telHref(service.dialNumber);

  return (
    <div
      className="relative w-full h-full flex flex-col text-white font-ios overflow-hidden animate-screen-in"
      style={{ background: 'radial-gradient(circle at 50% 38%, #6c564c 0%, #50434e 42%, #3a394b 100%)' }}
    >
      <div className="px-4 pt-4 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:scale-90 transition cursor-pointer"
        >
          <ChevronLeft className="w-8 h-8" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10 flex flex-col items-center text-center">
        <div className="mt-2 w-[86px] h-[86px] rounded-full bg-white/12 border border-white/20 flex items-center justify-center">
          {service.smsOnly ? (
            <MessageSquareText className="w-10 h-10" strokeWidth={1.8} />
          ) : (
            <Phone className="w-10 h-10" strokeWidth={1.8} />
          )}
        </div>

        <h1 className="mt-5 font-ubuntu font-medium text-[34px] leading-tight tracking-[-0.34px]">
          {service.displayName}
        </h1>
        <p className="mt-1 text-[15px] text-white/75">{service.subtitle}</p>
        {service.displayName !== service.dialNumber && (
          <p className="mt-1 text-[22px] font-semibold tracking-wider">{service.dialNumber}</p>
        )}
        <span className="mt-3 inline-block px-3 py-1 rounded-full bg-emerald-400/15 text-emerald-200 text-[12px] font-semibold">
          {service.availability}
        </span>

        {/* Action principale : vrai appel (ou vrai SMS pour le 114) */}
        <a
          href={primaryHref}
          className="mt-7 w-full max-w-[310px] flex items-center justify-center gap-3 px-5 py-4 rounded-[22px] bg-[#34C759] hover:bg-[#2fb350] active:scale-[0.97] shadow-[0_12px_28px_rgba(52,199,89,0.45)] text-[18px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        >
          {service.smsOnly ? <MessageSquareText className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
          {service.smsOnly ? `Écrire au ${service.dialNumber}` : `Appeler le ${service.dialNumber}`}
        </a>
        <p className="mt-2.5 text-[12.5px] leading-snug text-white/65 max-w-[290px]">
          {service.smsOnly
            ? 'Votre application SMS s’ouvre avec un message prêt à compléter.'
            : touch
              ? 'Votre téléphone a ouvert l’appel. Rien ne s’est passé ? Touchez le bouton vert.'
              : 'Composez ce numéro depuis votre téléphone, ou touchez le bouton si votre ordinateur peut appeler.'}
        </p>

        {service.smsOnly && (
          <div className="mt-4 w-full max-w-[310px]">
            <button
              type="button"
              onClick={addPosition}
              disabled={locating || !!position}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/12 border border-white/20 text-[14px] font-medium hover:bg-white/20 disabled:opacity-80 transition cursor-pointer"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {position ? 'Position ajoutée au message ✓' : 'Ajouter ma position au message'}
            </button>
            {geoError && <p className="mt-2 text-[12px] text-[#ffb4b4]">{geoError}</p>}
          </div>
        )}

        {/* Alternatives écrites */}
        {(service.chatUrl || offer114) && (
          <div className="mt-6 w-full max-w-[310px] flex flex-col gap-2.5">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-white/55">
              Impossible de parler ?
            </p>
            {offer114 && (
              <a
                href={smsHref('114', sms114Body(null))}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/12 border border-white/20 text-left hover:bg-white/20 active:scale-[0.98] transition"
              >
                <MessageSquareText className="w-5 h-5 shrink-0" />
                <span className="text-[14px] leading-snug">
                  <strong>SMS au 114</strong>
                  <span className="block text-white/65 text-[12px]">Alerte les secours par écrit</span>
                </span>
              </a>
            )}
            {service.chatUrl && (
              <a
                href={service.chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/12 border border-white/20 text-left hover:bg-white/20 active:scale-[0.98] transition"
              >
                <ExternalLink className="w-5 h-5 shrink-0" />
                <span className="text-[14px] leading-snug">
                  <strong>Écrire plutôt</strong>
                  <span className="block text-white/65 text-[12px]">{service.chatLabel}</span>
                </span>
              </a>
            )}
          </div>
        )}

        <p className="mt-7 max-w-[310px] text-[13px] leading-[1.5] text-white/75 text-left rounded-2xl bg-black/25 border border-white/10 px-4 py-3.5">
          {service.description}
        </p>
      </div>
    </div>
  );
};
