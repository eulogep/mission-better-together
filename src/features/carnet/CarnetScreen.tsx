import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp,
  Check,
  Download,
  Feather,
  FileText,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { ScreenShell } from '../../components/ScreenShell';
import { useSerenity } from '../../context/SerenityContext';
import { isTouchDevice } from '../../lib/device';
import { toast } from '../../lib/toast';
import {
  MIN_PIN_LENGTH,
  changePin,
  createVault,
  destroyVault,
  disableVaultBiometrics,
  enableVaultBiometrics,
  unlockVault,
  unlockVaultWithBiometrics,
  validatePin,
  vaultBiometricStatus,
  vaultExists,
} from '../../lib/vault';
import {
  CarnetEntry,
  INCIDENT_KINDS,
  IncidentKind,
  SortOrder,
  addAttachment,
  allTags,
  buildReport,
  countLegacyEntries,
  deleteEntry,
  filterEntries,
  formatOccurredAt,
  isEntryEmpty,
  listEntries,
  migrateLegacy,
  newEntry,
  parseTags,
  readAttachment,
  removeAttachment,
  saveEntry,
  sortEntries,
} from './carnetStore';
import { getCarnetSession, lockCarnet, openCarnetSession, touchCarnetSession, useCarnetSession } from './session';

interface CarnetScreenProps {
  onBack: () => void;
  onHome: () => void;
}

const VIOLET = '#7174AA';

function useStyles() {
  const { nightMode } = useSerenity();
  return {
    nightMode,
    card: nightMode ? 'bg-white/[0.06] border-white/10' : 'bg-white/95 border-black/[0.08]',
    input: `w-full px-4 py-3 rounded-[16px] border-2 text-[16px] focus:outline-none focus:border-[#7174AA] transition ${
      nightMode ? 'bg-white/[0.06] border-white/10 text-white placeholder:text-white/40' : 'bg-white border-black/10 text-[#1d1b20]'
    }`,
    muted: nightMode ? 'text-white/60' : 'text-[#6b6d80]',
    strong: nightMode ? 'text-white' : 'text-[#1d1b20]',
  };
}

async function shareOrDownload(file: File) {
  if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ====================================================================== */
/* Création du code / déverrouillage                                       */
/* ====================================================================== */

const PinField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoFocus?: boolean;
  autoComplete: string;
}> = ({ value, onChange, label, autoFocus, autoComplete }) => {
  const s = useStyles();
  return (
    <label className="flex flex-col gap-1.5">
      <span className={`px-1 text-[13px] font-semibold ${s.strong}`}>{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className={`${s.input} tracking-[0.2em]`}
      />
    </label>
  );
};

const SetupView: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const s = useStyles();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [legacy, setLegacy] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    countLegacyEntries().then(setLegacy).catch(() => setLegacy(0));
  }, []);

  const problem = pin ? validatePin(pin) : null;
  const canSubmit = !problem && pin.length >= MIN_PIN_LENGTH && pin === confirm && understood && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const session = await createVault(pin);
      openCarnetSession(session);
      if (legacy > 0) {
        const n = await migrateLegacy(session);
        if (n) toast(`${n} ancienne(s) note(s) chiffrée(s) dans ton carnet.`, { tone: 'success' });
      }
      onReady();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="px-4 pt-2 flex flex-col gap-4">
      <div className="px-1">
        <h1 className="font-ubuntu font-bold text-[28px] leading-tight text-[#7174AA]">Ton carnet protégé</h1>
        <p className={`mt-2 text-[14.5px] leading-[1.5] ${s.muted}`}>
          Note ce que tu vis : dates, mots, témoins, captures. Tout est <strong className={s.strong}>chiffré sur ton
          appareil</strong> avec un code que toi seul·e connais. Rien n’est envoyé sur internet.
        </p>
      </div>

      {legacy > 0 && (
        <div className="rounded-[18px] px-4 py-3 bg-[#FFF8D6] border border-[#E5BE1A]/40 text-[13px] leading-snug text-[#5c4a00]">
          {legacy} note(s) déjà écrite(s) sur cet appareil seront chiffrées dans le carnet, puis leur copie non protégée
          sera supprimée.
        </div>
      )}

      <PinField label={`Choisis un code (${MIN_PIN_LENGTH} caractères minimum)`} value={pin} onChange={setPin} autoFocus autoComplete="new-password" />
      {problem && <p className="-mt-2 px-1 text-[12.5px] text-[#d4474c]">{problem}</p>}
      <PinField label="Confirme le code" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {confirm && confirm !== pin && <p className="-mt-2 px-1 text-[12.5px] text-[#d4474c]">Les deux codes sont différents.</p>}

      <label className={`flex items-start gap-3 rounded-[18px] border-2 px-4 py-3 cursor-pointer ${s.card}`}>
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-1 w-5 h-5 accent-[#7174AA] shrink-0"
        />
        <span className={`text-[13.5px] leading-snug ${s.strong}`}>
          J’ai compris : si j’oublie ce code, <strong>personne ne pourra récupérer mes notes</strong>, pas même MBT.
          (Astuce : une phrase courte que toi seul·e connais est plus sûre qu’un code à 6 chiffres.)
        </span>
      </label>

      {error && <p className="px-1 text-[13px] text-[#d4474c]">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-[64px] rounded-[30px] bg-white border-[5px] border-[#7174AA] text-[#7174AA] font-ubuntu font-medium text-[20px] inline-flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
        {busy ? 'Protection en cours…' : 'Protéger mon carnet'}
      </button>
    </form>
  );
};

const UnlockView: React.FC<{ onReady: () => void; onReset: () => void }> = ({ onReady, onReset }) => {
  const s = useStyles();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitUntil, setWaitUntil] = useState(0);
  const [, tick] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [resetText, setResetText] = useState('');
  const [biometric, setBiometric] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    vaultBiometricStatus()
      .then(({ available, enabled }) => {
        if (mounted.current) setBiometric(available && enabled);
      })
      .catch(() => {});
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (waitUntil <= Date.now()) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [waitUntil]);
  const remaining = Math.ceil(Math.max(0, waitUntil - Date.now()) / 1000);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || busy || remaining > 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await unlockVault(pin);
      if (res.session) {
        openCarnetSession(res.session);
        setPin('');
        onReady();
        return;
      }
      setPin('');
      if (res.retryInMs) {
        setWaitUntil(Date.now() + res.retryInMs);
        setError('Trop d’essais. Patiente avant de réessayer.');
      } else {
        setError('Code incorrect.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const unlockWithBiometrics = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const startedAt = Date.now();
    try {
      const session = await unlockVaultWithBiometrics();
      if (!mounted.current || document.hidden || Date.now() - startedAt > 30_000) return;
      openCarnetSession(session);
      onReady();
    } catch {
      setError('Biométrie interrompue ou indisponible. Tu peux utiliser ton code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      <div className="flex flex-col items-center text-center gap-2">
        <span className="w-16 h-16 rounded-full bg-[#7174AA]/15 text-[#7174AA] flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </span>
        <h1 className="font-ubuntu font-bold text-[26px] text-[#7174AA]">Carnet verrouillé</h1>
        <p className={`text-[14px] ${s.muted}`}>Entre ton code pour ouvrir tes notes.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <PinField label="Code" value={pin} onChange={setPin} autoFocus autoComplete="current-password" />
        {error && <p role="status" className="px-1 text-[13px] text-[#d4474c]">{error}{remaining > 0 ? ` (${remaining} s)` : ''}</p>}
        <button
          type="submit"
          disabled={!pin || busy || remaining > 0}
          className="h-[60px] rounded-[30px] bg-[#7174AA] text-white font-ubuntu font-medium text-[19px] inline-flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition cursor-pointer"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
          Ouvrir
        </button>
      </form>

      {biometric && (
        <button type="button" disabled={busy} onClick={unlockWithBiometrics}
          className="h-12 rounded-full border-2 border-[#7174AA]/50 text-[#7174AA] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
          <Fingerprint className="w-5 h-5" aria-hidden="true" />
          Ouvrir avec la biométrie
        </button>
      )}
      <button type="button" onClick={() => setShowReset((v) => !v)} className={`mt-2 text-[13px] underline ${s.muted} cursor-pointer`}>
        Code oublié ?
      </button>
      {showReset && (
        <div className="rounded-[20px] border-2 border-[#FF8989]/60 px-4 py-4 flex flex-col gap-2.5">
          <p className={`text-[13.5px] leading-snug ${s.strong}`}>
            Si tu n’as plus accès à ton carnet, tu peux <strong>effacer ses notes</strong> et en recommencer un nouveau.
            Tape <strong>EFFACER</strong> pour confirmer.
          </p>
          <input value={resetText} onChange={(e) => setResetText(e.target.value)} className={s.input} aria-label="Confirmation" />
          <button
            type="button"
            disabled={busy || resetText.trim().toUpperCase() !== 'EFFACER'}
            onClick={async () => {
              setBusy(true);
              try {
                await destroyVault();
                toast('Carnet effacé.', { tone: 'info' });
                onReset();
              } catch {
                toast('Impossible d’effacer le carnet. Réessaie.', { tone: 'info' });
              } finally {
                setBusy(false);
              }
            }}
            className="h-12 rounded-full bg-[#FF5B5B] text-white font-semibold disabled:opacity-40 cursor-pointer"
          >
            Effacer définitivement le carnet
          </button>
        </div>
      )}
    </div>
  );
};

/* ====================================================================== */
/* Éditeur (enregistrement automatique)                                     */
/* ====================================================================== */

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const Editor: React.FC<{ initial: CarnetEntry; isNew: boolean; onClose: (changed: boolean) => void }> = ({
  initial,
  isNew,
  onClose,
}) => {
  const s = useStyles();
  const session = useCarnetSession();
  const [entry, setEntry] = useState(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [persisted, setPersisted] = useState(!isNew);
  const [uploading, setUploading] = useState(false);
  const entryRef = useRef(entry);
  entryRef.current = entry;
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const persist = useCallback(async () => {
    const sess = getCarnetSession();
    const current = entryRef.current;
    if (!sess || !dirty.current) return;
    if (isEntryEmpty(current) && !persisted) return;
    dirty.current = false;
    setState('saving');
    try {
      await saveEntry(sess, current);
      setPersisted(true);
      setSavedAt(new Date());
      setState('saved');
    } catch {
      dirty.current = true;
      setState('error');
    }
  }, [persisted]);

  const update = (patch: Partial<CarnetEntry>) => {
    touchCarnetSession();
    dirty.current = true;
    setEntry((e) => ({ ...e, ...patch }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persist(), 700);
  };

  // Fermeture par la flèche retour / verrouillage : on enregistre ce qui reste
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (dirty.current) void persistRef.current();
    },
    []
  );

  const close = async () => {
    window.clearTimeout(timer.current);
    await persist();
    const current = entryRef.current;
    if (isEntryEmpty(current) && persistedRef.current) {
      await deleteEntry(current);
    }
    onClose(true);
  };
  const persistedRef = useRef(persisted);
  persistedRef.current = persisted;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length || !session) return;
    setUploading(true);
    try {
      const added = [];
      for (const f of Array.from(files)) added.push(await addAttachment(session, entry.id, f, f.name));
      update({ attachments: [...entryRef.current.attachments, ...added] });
    } catch (err) {
      toast((err as Error).message, { tone: 'info' });
    } finally {
      setUploading(false);
    }
  };

  const openAttachment = async (id: string) => {
    const att = entry.attachments.find((a) => a.id === id);
    if (!att || !session) return;
    const blob = await readAttachment(session, att);
    if (!blob) return toast('Pièce jointe introuvable.', { tone: 'info' });
    await shareOrDownload(new File([blob], att.name, { type: att.type }));
  };

  const remove = async () => {
    if (!window.confirm('Supprimer définitivement cette note et ses pièces jointes ?')) return;
    window.clearTimeout(timer.current);
    dirty.current = false;
    await deleteEntry(entryRef.current);
    toast('Note supprimée.', { tone: 'info' });
    onClose(true);
  };

  const label = (t: string) => <span className={`px-1 text-[13px] font-semibold ${s.strong}`}>{t}</span>;

  return (
    <div className="px-4 pt-1 flex flex-col gap-3.5" onPointerDown={touchCarnetSession}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void close()}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#7174AA] text-white text-[14px] font-semibold cursor-pointer active:scale-95"
        >
          <Check className="w-4 h-4" />
          Terminé
        </button>
        <span className={`text-[12.5px] ${s.muted}`} aria-live="polite">
          {state === 'saving'
            ? 'Enregistrement…'
            : state === 'error'
              ? 'Échec de l’enregistrement — réessaie'
              : state === 'saved' && savedAt
                ? `Enregistré et chiffré · ${savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : persisted
                  ? 'Enregistrement automatique'
                  : 'Commence à écrire : c’est enregistré automatiquement'}
        </span>
      </div>

      <label className="flex flex-col gap-1.5">
        {label('Titre (facultatif)')}
        <input value={entry.title} onChange={(e) => update({ title: e.target.value })} placeholder="Ex : À la cantine" className={s.input} />
      </label>

      <label className="flex flex-col gap-1.5">
        {label('Quand ?')}
        <input type="datetime-local" value={entry.occurredAt} onChange={(e) => update({ occurredAt: e.target.value })} className={s.input} />
      </label>

      <fieldset>
        <legend className="mb-1.5">{label('Quel type ?')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(INCIDENT_KINDS) as IncidentKind[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={entry.kind === k}
              onClick={() => update({ kind: k })}
              className="px-3 py-1.5 rounded-full text-[13px] font-medium border-2 cursor-pointer transition"
              style={{ borderColor: VIOLET, backgroundColor: entry.kind === k ? VIOLET : 'transparent', color: entry.kind === k ? '#fff' : VIOLET }}
            >
              {INCIDENT_KINDS[k]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        {label('Ce qui s’est passé')}
        <textarea
          value={entry.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={6}
          placeholder="Décris les faits, avec les mots exacts si tu t’en souviens."
          className={`${s.input} resize-y leading-[1.5]`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        {label('Où ?')}
        <input value={entry.place} onChange={(e) => update({ place: e.target.value })} placeholder="Cour, bus, Instagram…" className={s.input} />
      </label>
      <label className="flex flex-col gap-1.5">
        {label('Qui en est l’auteur ?')}
        <input value={entry.people} onChange={(e) => update({ people: e.target.value })} placeholder="Nom, pseudo, classe…" className={s.input} />
      </label>
      <label className="flex flex-col gap-1.5">
        {label('Témoins')}
        <input value={entry.witnesses} onChange={(e) => update({ witnesses: e.target.value })} placeholder="Qui a vu ou entendu ?" className={s.input} />
      </label>
      <label className="flex flex-col gap-1.5">
        {label('Étiquettes (séparées par des virgules)')}
        <input
          value={tagsText}
          onChange={(e) => {
            setTagsText(e.target.value);
            update({ tags: parseTags(e.target.value) });
          }}
          placeholder="école, snapchat, bus…"
          className={s.input}
        />
      </label>

      <div className="flex flex-col gap-2">
        {label('Pièces jointes (captures, photos, PDF) — chiffrées')}
        {entry.attachments.map((a) => (
          <div key={a.id} className={`flex items-center gap-2 rounded-[14px] border px-3 py-2 ${s.card}`}>
            <Paperclip className="w-4 h-4 text-[#7174AA] shrink-0" />
            <button type="button" onClick={() => void openAttachment(a.id)} className={`flex-1 min-w-0 text-left text-[13.5px] truncate underline ${s.strong} cursor-pointer`}>
              {a.name}
            </button>
            <span className={`text-[11px] ${s.muted}`}>{Math.max(1, Math.round(a.size / 1024))} Ko</span>
            <button
              type="button"
              aria-label={`Retirer ${a.name}`}
              onClick={async () => {
                await removeAttachment(a);
                update({ attachments: entryRef.current.attachments.filter((x) => x.id !== a.id) });
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#d4474c] hover:bg-red-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <label className={`inline-flex items-center justify-center gap-2 h-12 rounded-[16px] border-2 border-dashed border-[#7174AA] text-[#7174AA] text-[14px] font-medium cursor-pointer ${uploading ? 'opacity-60' : ''}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Ajouter un fichier
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {persisted && (
        <button type="button" onClick={() => void remove()} className="self-center mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#d4474c] cursor-pointer">
          <Trash2 className="w-4 h-4" />
          Supprimer cette note
        </button>
      )}
    </div>
  );
};

/* ====================================================================== */
/* Lâcher prise : écrire puis laisser partir (rien n'est enregistré)        */
/* ====================================================================== */

const ReleaseView: React.FC = () => {
  const s = useStyles();
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'write' | 'leaving' | 'done'>('write');
  return (
    <div className="px-4 pt-1 flex flex-col gap-3">
      <p className={`px-1 text-[14px] leading-[1.5] ${s.muted}`}>
        Écris ce qui pèse, sans filtre. Puis laisse-le partir : <strong className={s.strong}>rien n’est enregistré</strong>.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        disabled={phase === 'leaving'}
        className={`${s.input} resize-none transition-all duration-1000 ${phase === 'leaving' ? 'opacity-0 blur-sm -translate-y-6' : ''}`}
        placeholder="Ce que je ressens maintenant…"
      />
      <button
        type="button"
        disabled={!text.trim() || phase === 'leaving'}
        onClick={() => {
          setPhase('leaving');
          window.setTimeout(() => {
            setText('');
            setPhase('done');
          }, 1100);
        }}
        className="h-[56px] rounded-[28px] border-[4px] border-[#C691C9] text-[#a05aa5] font-ubuntu font-medium text-[18px] inline-flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
      >
        <Feather className="w-5 h-5" />
        Laisser partir
      </button>
      {phase === 'done' && (
        <p className="text-center font-ubuntu text-[15px] text-[#a05aa5] mbt-enter-none">C’est parti. Tu as le droit de te sentir plus léger·e.</p>
      )}
    </div>
  );
};

/* ====================================================================== */
/* Liste                                                                    */
/* ====================================================================== */

const BiometricSettings: React.FC = () => {
  const s = useStyles();
  const [status, setStatus] = useState({ available: false, enabled: false });
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { vaultBiometricStatus().then(setStatus).catch(() => {}); }, []);
  if (!status.available && !status.enabled) return null;

  const update = async (disable: boolean) => {
    setBusy(true);
    setMessage('');
    setPin('');
    try {
      if (disable) await disableVaultBiometrics();
      else await enableVaultBiometrics(pin);
      setStatus(await vaultBiometricStatus());
      setMessage(disable ? 'Biométrie désactivée.' : 'Biométrie activée.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Modification impossible. Réessaie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Biométrie du carnet" className="flex flex-col gap-2">
      <p className={`text-[14px] font-semibold ${s.strong}`}>Biométrie du carnet</p>
      <p className={`text-[13px] leading-snug ${s.muted}`}>
        Les empreintes ou visages enregistrés sur ce téléphone pourront ouvrir le carnet. Garde ton code pour pouvoir
        l’ouvrir si la biométrie change ou devient indisponible.
      </p>
      {status.available && (
        <>
          <PinField label="Code du carnet pour configurer la biométrie" value={pin} onChange={setPin} autoComplete="current-password" />
          <button type="button" disabled={busy || !pin} onClick={() => void update(false)}
            className="h-11 rounded-full bg-[#7174AA] text-white font-semibold disabled:opacity-40 cursor-pointer">
            {status.enabled ? 'Reconfigurer la biométrie' : 'Activer la biométrie'}
          </button>
        </>
      )}
      {status.enabled && (
        <button type="button" disabled={busy} onClick={() => void update(true)}
          className={`h-10 text-[13px] underline disabled:opacity-40 cursor-pointer ${s.muted}`}>
          Désactiver la biométrie
        </button>
      )}
      {message && <p role="status" className={`text-[13px] ${s.strong}`}>{message}</p>}
    </section>
  );
};

const ListView: React.FC<{ onEdit: (e: CarnetEntry, isNew: boolean) => void; refreshKey: number }> = ({ onEdit, refreshKey }) => {
  const s = useStyles();
  const session = useCarnetSession();
  const [entries, setEntries] = useState<CarnetEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<IncidentKind | 'all'>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [order, setOrder] = useState<SortOrder>('recent');
  const [exporting, setExporting] = useState(false);
  const [settings, setSettings] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [wipeText, setWipeText] = useState('');
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    if (!session) return;
    listEntries(session)
      .then(setEntries)
      .catch(() => setError('Impossible de lire le carnet.'));
  }, [session, refreshKey]);

  const visible = useMemo(
    () => sortEntries(filterEntries(entries ?? [], { query, kind, tag }), order),
    [entries, query, kind, tag, order]
  );
  const tags = useMemo(() => allTags(entries ?? []), [entries]);

  const doExport = async () => {
    if (!session || !entries?.length) return;
    if (!window.confirm('Le fichier exporté ne sera PAS chiffré. Le conserver en lieu sûr ou le remettre à une personne de confiance. Continuer ?'))
      return;
    setExporting(true);
    try {
      await shareOrDownload(await buildReport(session, visible.length ? visible : entries));
      toast('Rapport exporté.', { tone: 'success' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="px-4 pt-1 flex flex-col gap-3.5" onPointerDown={touchCarnetSession}>
      <button
        type="button"
        onClick={() => onEdit(newEntry(), true)}
        className="h-[64px] rounded-[30px] bg-white border-[5px] border-[#7174AA] text-[#7174AA] font-ubuntu font-medium text-[20px] inline-flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
        NOUVELLE NOTE
      </button>

      <div className={`flex items-center gap-2 rounded-[16px] border-2 px-3 h-12 ${s.card}`}>
        <Search className={`w-4 h-4 shrink-0 ${s.muted}`} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans mes notes"
          aria-label="Rechercher dans mes notes"
          className={`flex-1 min-w-0 bg-transparent text-[16px] focus:outline-none ${s.strong}`}
        />
        <button
          type="button"
          onClick={() => setOrder((o) => (o === 'recent' ? 'ancien' : 'recent'))}
          title={order === 'recent' ? 'Plus récentes d’abord' : 'Plus anciennes d’abord'}
          aria-label="Changer l’ordre"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7174AA] cursor-pointer"
        >
          <ArrowDownUp className="w-4 h-4" />
          {order === 'recent' ? 'Récentes' : 'Anciennes'}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {(['all', ...Object.keys(INCIDENT_KINDS)] as (IncidentKind | 'all')[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-medium border cursor-pointer"
            style={{ borderColor: VIOLET, backgroundColor: kind === k ? VIOLET : 'transparent', color: kind === k ? '#fff' : VIOLET }}
          >
            {k === 'all' ? 'Toutes' : INCIDENT_KINDS[k]}
          </button>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
              className={`px-2.5 py-1 rounded-full text-[12px] cursor-pointer ${tag === t ? 'bg-[#C691C9] text-white' : 'bg-[#C691C9]/15 text-[#8a4d8e]'}`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-[13px] text-[#d4474c]">{error}</p>}
      {entries === null ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#7174AA]" />
        </div>
      ) : visible.length === 0 ? (
        <p className={`text-center py-6 text-[14px] ${s.muted}`}>
          {entries.length === 0 ? 'Aucune note pour l’instant.' : 'Aucune note ne correspond à ta recherche.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onEdit(e, false)}
                className={`w-full text-left rounded-[20px] border-[3px] border-[#7174AA]/70 px-4 py-3 hover:shadow-md active:scale-[0.99] transition cursor-pointer ${s.card}`}
              >
                <span className="block text-[12px] font-semibold text-[#7174AA] first-letter:uppercase">{formatOccurredAt(e.occurredAt)}</span>
                <span className={`block mt-0.5 font-ubuntu font-medium text-[15.5px] ${s.strong}`}>
                  {e.title || INCIDENT_KINDS[e.kind]}
                  {e.place ? ` · ${e.place}` : ''}
                </span>
                <span className={`block mt-0.5 text-[13px] leading-snug line-clamp-2 ${s.muted}`}>{e.description || '—'}</span>
                <span className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] ${s.muted}`}>
                  {e.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      {e.attachments.length}
                    </span>
                  )}
                  {e.tags.map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!!entries?.length && (
        <button
          type="button"
          onClick={() => void doExport()}
          disabled={exporting}
          className="h-12 rounded-full bg-[#7174AA] text-white font-ubuntu font-medium text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exporter {visible.length !== entries.length ? `ces ${visible.length} notes` : 'mon carnet'} (rapport)
        </button>
      )}

      <button type="button" onClick={() => setSettings((v) => !v)} className={`self-center text-[13px] underline ${s.muted} cursor-pointer`}>
        Sécurité du carnet
      </button>
      {settings && (
        <div className={`rounded-[20px] border-2 px-4 py-4 flex flex-col gap-3 ${s.card}`}>
          <p className={`text-[13px] leading-snug ${s.muted}`}>
            <FileText className="inline w-4 h-4 mr-1 text-[#7174AA]" />
            Chiffrement AES-256 sur l’appareil. Verrouillage auto après 5 min d’inactivité ou 30 s en arrière-plan.
          </p>
          <BiometricSettings />
          <p className={`text-[14px] font-semibold ${s.strong}`}>Changer le code</p>
          <input type="password" placeholder="Code actuel" value={oldPin} onChange={(e) => setOldPin(e.target.value)} className={s.input} autoComplete="current-password" />
          <input type="password" placeholder="Nouveau code" value={newPin} onChange={(e) => setNewPin(e.target.value)} className={s.input} autoComplete="new-password" />
          {newPin && validatePin(newPin) && <p className="text-[12.5px] text-[#d4474c]">{validatePin(newPin)}</p>}
          <button
            type="button"
            disabled={!oldPin || !!validatePin(newPin)}
            onClick={async () => {
              const ok = await changePin(oldPin, newPin).catch(() => false);
              toast(ok ? 'Code modifié.' : 'Code actuel incorrect.', { tone: ok ? 'success' : 'info' });
              if (ok) {
                setOldPin('');
                setNewPin('');
              }
            }}
            className="h-11 rounded-full bg-[#7174AA] text-white font-semibold disabled:opacity-40 cursor-pointer"
          >
            Changer le code
          </button>
          <p className={`mt-2 text-[14px] font-semibold text-[#d4474c]`}>Tout effacer</p>
          <p className={`text-[12.5px] ${s.muted}`}>Supprime définitivement toutes les notes et pièces jointes. Tape EFFACER.</p>
          <input value={wipeText} onChange={(e) => setWipeText(e.target.value)} className={s.input} aria-label="Confirmation de l’effacement" />
          <button
            type="button"
            disabled={wiping || wipeText.trim().toUpperCase() !== 'EFFACER'}
            onClick={async () => {
              setWiping(true);
              try {
                await destroyVault();
                lockCarnet();
                toast('Carnet effacé.', { tone: 'info' });
              } catch {
                toast('Impossible d’effacer le carnet. Réessaie.', { tone: 'info' });
              } finally {
                setWiping(false);
              }
            }}
            className="h-11 rounded-full bg-[#FF5B5B] text-white font-semibold disabled:opacity-40 cursor-pointer"
          >
            Effacer tout le carnet
          </button>
        </div>
      )}
    </div>
  );
};

/* ====================================================================== */

export const CarnetScreen: React.FC<CarnetScreenProps> = ({ onBack, onHome }) => {
  const session = useCarnetSession();
  const [exists, setExists] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'notes' | 'lacher'>('notes');
  const [editing, setEditing] = useState<{ entry: CarnetEntry; isNew: boolean } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);

  const check = useCallback(() => {
    vaultExists()
      .then(setExists)
      .catch((e: Error) => setFailure(e.message));
  }, []);
  useEffect(check, [check, session]);

  // Verrouillage pendant l'édition : on referme l'éditeur
  useEffect(() => {
    if (!session) setEditing(null);
  }, [session]);

  let body: React.ReactNode;
  if (failure) {
    body = <p className="px-5 pt-6 text-[14px] text-[#d4474c]">{failure}</p>;
  } else if (exists === null) {
    body = (
      <div className="pt-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#7174AA]" />
      </div>
    );
  } else if (!exists) {
    body = <SetupView onReady={check} />;
  } else if (!session) {
    body = <UnlockView onReady={check} onReset={check} />;
  } else if (editing) {
    body = (
      <Editor
        key={editing.entry.id}
        initial={editing.entry}
        isNew={editing.isNew}
        onClose={() => {
          setEditing(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  } else {
    body = (
      <>
        <div className="px-4 flex items-center justify-between gap-2">
          <h1 className="px-1 font-ubuntu font-bold text-[26px] text-[#7174AA]">Mon carnet</h1>
          <button
            type="button"
            onClick={lockCarnet}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border-2 border-[#7174AA]/50 text-[#7174AA] text-[13px] font-semibold cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            Verrouiller
          </button>
        </div>
        <div className="mx-4 mt-3 mb-3.5 p-1 rounded-full bg-[#7174AA]/10 grid grid-cols-2 gap-1" role="tablist">
          {(
            [
              ['notes', 'Mes notes'],
              ['lacher', 'Lâcher prise'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`py-2 rounded-full text-[14px] font-ubuntu font-medium cursor-pointer ${tab === k ? 'bg-[#7174AA] text-white' : 'text-[#7174AA]'}`}
            >
              {l}
            </button>
          ))}
        </div>
        {tab === 'notes' ? (
          <ListView refreshKey={refreshKey} onEdit={(entry, isNew) => setEditing({ entry, isNew })} />
        ) : (
          <ReleaseView />
        )}
      </>
    );
  }

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={editing ? () => setEditing(null) : onBack} onBrandClick={onHome}>
      {body}
    </ScreenShell>
  );
};
