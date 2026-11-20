import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, MessageSquareText, Phone, RefreshCw, Share2, UserPlus } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { ContactItem } from '../data/content';
import { useUserContacts } from '../lib/contacts';
import { toast } from '../lib/toast';
import {
  GEO_ERROR_MESSAGES,
  GeoError,
  GeoPoint,
  getCurrentPosition,
  googleMapsPointUrl,
  shareText,
  smsHref,
  vibrate,
} from '../lib/device';

interface AlertScreenProps {
  onBack: () => void;
  onHome: () => void;
  onContacts: () => void;
  onCall: (serviceKey: string) => void;
  onCallContact: (contact: ContactItem) => void;
}

function buildMessage(position: GeoPoint | null): string {
  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const where = position
    ? ` Ma position (${time}) : ${googleMapsPointUrl(position)}`
    : '';
  return `J'ai besoin d'aide, je ne me sens pas en sécurité.${where} Appelle-moi ou viens me chercher s'il te plaît.`;
}

/**
 * « Alerter mes proches » : prépare un SMS avec la position GPS pour les personnes de confiance.
 * L'envoi passe par l'application SMS du téléphone (aucun serveur, rien n'est stocké).
 */
export const AlertScreen: React.FC<AlertScreenProps> = ({ onBack, onHome, onContacts, onCall, onCallContact }) => {
  const [contacts] = useUserContacts();
  const trusted = contacts.filter((c) => c.trusted);

  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  // « Préparé » ≠ « envoyé » : on ne sait jamais si l'utilisateur a réellement envoyé le SMS
  const [preparedFor, setPreparedFor] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [message, setMessage] = useState(() => buildMessage(null));
  const [edited, setEdited] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);

  const locate = useCallback(async () => {
    setLocating(true);
    setGeoError(null);
    try {
      setPosition(await getCurrentPosition());
    } catch (err) {
      setGeoError(GEO_ERROR_MESSAGES[(err as GeoError).kind] ?? GEO_ERROR_MESSAGES.unavailable);
    } finally {
      setLocating(false);
    }
  }, []);

  // La position n'est JAMAIS récupérée automatiquement : uniquement sur demande explicite.
  // Tant que l'utilisateur n'a pas modifié le texte, on y insère la position dès qu'elle arrive
  useEffect(() => {
    if (!edited) setMessage(buildMessage(position));
  }, [position, edited]);

  const share = async () => {
    setShareFailed(false);
    const ok = await shareText(message, 'Alerte MBT');
    if (!ok && !navigator.share) setShareFailed(true);
  };

  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={() => onCall('urgence')}
      scrollable
    >
      <div className="px-4 mt-3 flex flex-col gap-4">
        <h1 className="font-ubuntu font-bold text-[28px] leading-[1.2] text-black px-1">Alerter mes proches</h1>

        <p className="px-1 -mt-2 text-[13.5px] leading-snug text-[#555]">
          Prépare un message pour une personne de confiance. Rien n’est envoyé sans ton action dans ton appli SMS.
        </p>

        {/* Position : uniquement si l'utilisateur le décide */}
        <div className="rounded-[20px] bg-white border-2 border-black/10 px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            {locating ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#FF8989] shrink-0" />
            ) : (
              <MapPin className={`w-5 h-5 shrink-0 ${position ? 'text-emerald-600' : 'text-[#FF8989]'}`} />
            )}
            <p className="flex-1 text-[13px] leading-snug text-[#3b3b3b]">
              {locating
                ? 'Recherche de ta position…'
                : position
                  ? `Ta position est ajoutée au message (précision ~${Math.round(position.accuracy ?? 0)} m). Elle ne sera vue que par les personnes à qui tu envoies le SMS.`
                  : geoError ?? 'Ta position n’est pas incluse dans le message.'}
            </p>
          </div>
          <div className="flex gap-2">
            {!position ? (
              <button
                type="button"
                onClick={() => void locate()}
                disabled={locating}
                className="flex-1 h-10 rounded-full bg-[#FF8989] text-white text-[13.5px] font-semibold disabled:opacity-60 cursor-pointer"
              >
                Ajouter ma position
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void locate()}
                  aria-label="Actualiser ma position"
                  className="h-10 px-4 rounded-full border-2 border-black/10 text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </button>
                <button
                  type="button"
                  onClick={() => setPosition(null)}
                  className="h-10 px-4 rounded-full border-2 border-black/10 text-[13px] font-medium cursor-pointer"
                >
                  Retirer ma position
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message */}
        <label className="flex flex-col gap-1.5">
          <span className="px-1 text-[12px] font-bold uppercase tracking-wider text-[#8e8e93]">Message</span>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setEdited(true);
            }}
            rows={4}
            className="w-full rounded-[20px] border-[3px] border-[#FF8989] px-4 py-3 text-[14px] leading-[1.45] text-[#1d1b20] focus:outline-none focus:ring-4 focus:ring-[#FF8989]/20 resize-none"
          />
        </label>

        {/* Destinataires */}
        {trusted.length === 0 ? (
          <div className="rounded-[24px] border-[3px] border-dashed border-[#FF8989] px-5 py-5 text-center bg-white">
            <p className="text-[14px] leading-snug text-[#3b3b3b]">
              Tu n’as pas encore de personne de confiance. Ajoute-en une pour pouvoir la prévenir ici.
            </p>
            <button
              type="button"
              onClick={onContacts}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FF8989] text-white font-ubuntu font-medium text-[14px] cursor-pointer active:scale-95 transition"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter une personne de confiance
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {trusted.length > 1 && (
              <a
                href={smsHref(
                  trusted.map((c) => c.phone),
                  message
                )}
                onClick={() => {
                  vibrate();
                  setPreparedFor('tes proches');
                  toast('Message préparé : appuie sur « Envoyer » dans ton appli SMS.', { tone: 'warm' });
                }}
                className="flex items-center justify-center gap-2 py-4 rounded-[24px] bg-[#FF3B30] text-white font-ubuntu font-medium text-[18px] shadow-[0_10px_24px_rgba(255,59,48,0.35)] active:scale-[0.98] transition"
              >
                <MessageSquareText className="w-5 h-5" />
                Préparer un SMS pour tous ({trusted.length})
              </a>
            )}
            {trusted.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-[22px] bg-white border-[3px] border-[#FF8989] pl-4 pr-2 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-ubuntu font-medium text-[16px] text-[#1d1b20] truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-[12px] text-[#8e8e93]">{c.phone}</p>
                </div>
                <a
                  href={smsHref(c.phone, message)}
                  onClick={() => {
                  vibrate();
                  setPreparedFor(c.firstName);
                  toast('Message préparé : appuie sur « Envoyer » dans ton appli SMS.', { tone: 'warm' });
                }}
                  aria-label={`Préparer un SMS pour ${c.firstName}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#FF8989] text-white text-[13px] font-semibold active:scale-95 transition"
                >
                  <MessageSquareText className="w-4 h-4" />
                  SMS
                </a>
                <button
                  type="button"
                  onClick={() => onCallContact(c)}
                  aria-label={`Appeler ${c.firstName}`}
                  className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center active:scale-90 transition cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {preparedFor && (
          <div role="status" className="rounded-[20px] px-4 py-3 bg-[#FFF8D6] border border-[#E5BE1A]/50 text-[13.5px] leading-snug text-[#5c4a00]">
            <strong>Message préparé pour {preparedFor}.</strong> Il n’est envoyé que lorsque tu appuies sur « Envoyer » dans
            ton appli SMS. MBT ne peut pas savoir s’il est parti : vérifie dans tes messages.
          </div>
        )}

        <button
          type="button"
          onClick={share}
          className="flex items-center justify-center gap-2 py-3 rounded-[20px] border-2 border-black/15 bg-white text-[14px] font-medium text-[#3b3b3b] hover:bg-black/5 active:scale-[0.98] transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          Envoyer par WhatsApp, Messenger…
        </button>
        {shareFailed && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="-mt-2 text-center text-[13px] text-[#007AFF] underline"
          >
            Ouvrir WhatsApp
          </a>
        )}

        {/* Danger immédiat */}
        <div className="rounded-[24px] bg-[#FFF1F1] border border-[#FF8989]/40 px-4 py-3.5">
          <p className="text-[13px] font-semibold text-[#c2373c]">Danger immédiat ?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCall('17')}
              className="px-4 py-2 rounded-full bg-white border-2 border-[#FF8989] text-[#FF8989] font-ubuntu font-medium text-[14px] hover:bg-[#FF8989] hover:text-white active:scale-95 transition cursor-pointer"
            >
              17 · Police
            </button>
            <button
              type="button"
              onClick={() => onCall('114')}
              className="px-4 py-2 rounded-full bg-white border-2 border-[#FF8989] text-[#FF8989] font-ubuntu font-medium text-[14px] hover:bg-[#FF8989] hover:text-white active:scale-95 transition cursor-pointer"
            >
              SMS 114 (sans parler)
            </button>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
};
