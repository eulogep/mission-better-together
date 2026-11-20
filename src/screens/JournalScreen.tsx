import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Feather,
  FileText,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Wind,
} from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { useSerenity } from '../context/SerenityContext';
import { soundEngine } from '../utils/soundEngine';

interface JournalEntry {
  id: string;
  date: string;
  place: string;
  witnesses: string;
  details: string;
}

interface JournalScreenProps {
  onBack: () => void;
  onHome: () => void;
  onOpenSanctuary: () => void;
  onEmergencyCall: () => void;
}

const STORAGE_KEY = 'mbt_private_journal_v1';

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export const JournalScreen: React.FC<JournalScreenProps> = ({
  onBack,
  onHome,
  onOpenSanctuary,
  onEmergencyCall,
}) => {
  const { nightMode } = useSerenity();
  const [mode, setMode] = useState<'release' | 'facts'>('release');

  // Catharsis "Lâcher prise" state
  const [heavyThought, setHeavyThought] = useState('');
  const [releasing, setReleasing] = useState(false);
  const [releasedMessage, setReleasedMessage] = useState(false);

  // Structured Incident Facts state
  const [entries, setEntries] = useState<JournalEntry[]>(loadEntries);
  const [place, setPlace] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [details, setDetails] = useState('');

  const handleRelease = () => {
    if (!heavyThought.trim() || releasing) return;
    setReleasing(true);
    soundEngine.playChime(4, true);
    window.setTimeout(() => soundEngine.playChime(6, true), 260);
    window.setTimeout(() => {
      setHeavyThought('');
      setReleasing(false);
      setReleasedMessage(true);
      window.setTimeout(() => setReleasedMessage(false), 3800);
    }, 1100);
  };

  const handleSaveFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;
    const now = new Date();
    const formatted = now.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const next: JournalEntry = {
      id: `log_${Date.now()}`,
      date: formatted,
      place: place.trim() || 'Non précisé',
      witnesses: witnesses.trim() || 'Aucun précisé',
      details: details.trim(),
    };
    const updated = [next, ...entries];
    setEntries(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setPlace('');
    setWitnesses('');
    setDetails('');
  };

  const handleDeleteFact = (id: string) => {
    const updated = entries.filter((x) => x.id !== id);
    setEntries(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleExportTxt = () => {
    if (entries.length === 0) return;
    const lines = [
      '=== JOURNAL CONFIDENTIEL — MISSION BETTER TOGETHER (MBT) ===',
      `Exporté le ${new Date().toLocaleString('fr-FR')}`,
      '',
      ...entries.flatMap((e, i) => [
        `--- Note #${entries.length - i} ---`,
        `Date / Heure : ${e.date}`,
        `Lieu : ${e.place}`,
        `Témoins : ${e.witnesses}`,
        `Faits constatés : ${e.details}`,
        '',
      ]),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-mbt-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ScreenShell
      theme="sinformer"
      showBrand={false}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
      scrollable
    >
      <div className="px-4 pt-1 flex flex-col gap-3.5">
        {/* Header + Local-only Privacy Trust Signal */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
            <Lock className="w-3 h-3" />
            100% privé · reste uniquement sur cet appareil
          </span>
          <h1
            className={`font-ubuntu font-bold text-[23px] mt-1.5 ${
              nightMode ? 'text-[#f3f4fa]' : 'text-[#23243a]'
            }`}
          >
            Mon Carnet Protégé
          </h1>
        </div>

        {/* Mode Switcher */}
        <div
          className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border ${
            nightMode ? 'bg-white/6 border-white/10' : 'bg-[#f4f5fb] border-[#7174aa]/15'
          }`}
        >
          <button
            type="button"
            onClick={() => setMode('release')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[12.5px] font-medium transition cursor-pointer ${
              mode === 'release'
                ? 'bg-[#7174AA] text-white shadow-sm'
                : nightMode
                ? 'text-[#b5bad4]'
                : 'text-[#555]'
            }`}
          >
            <Feather className="w-4 h-4" />
            Lâcher prise
          </button>
          <button
            type="button"
            onClick={() => setMode('facts')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[12.5px] font-medium transition cursor-pointer ${
              mode === 'facts'
                ? 'bg-[#7174AA] text-white shadow-sm'
                : nightMode
                ? 'text-[#b5bad4]'
                : 'text-[#555]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Noter les faits ({entries.length})
          </button>
        </div>

        {/* Trauma-Informed Escape Hatch */}
        <button
          type="button"
          onClick={onOpenSanctuary}
          className={`w-full px-3.5 py-2 rounded-2xl border flex items-center justify-between text-[12px] font-medium transition cursor-pointer ${
            nightMode
              ? 'bg-[#00e8ae]/10 border-[#00e8ae]/25 text-[#88f7d9]'
              : 'bg-[#eefcf7] border-[#00e8ae]/40 text-[#008262] hover:bg-[#e1f9f0]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Wind className="w-4 h-4" />
            Tu te sens submergé·e ? Fais une pause respiration
          </span>
          <span className="font-bold">→</span>
        </button>

        {/* MODE 1 — CATHARSIS RELEASE */}
        {mode === 'release' ? (
          <div
            className={`relative rounded-[26px] p-4 border overflow-hidden ${
              nightMode
                ? 'bg-white/6 border-white/12'
                : 'bg-white/92 border-[#7174aa]/20 shadow-sm'
            }`}
          >
            <p className={`text-[13px] mb-2.5 ${nightMode ? 'text-[#c3c7e0]' : 'text-[#555]'}`}>
              Dépose ici une parole blessante ou un poids que tu ne veux plus garder en toi. Rien ne
              sera enregistré.
            </p>

            <AnimatePresence mode="wait">
              {releasing ? (
                <motion.div
                  key="dissolving"
                  initial={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  animate={{ opacity: 0, y: -40, filter: 'blur(10px)', scale: 0.92 }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  className="h-[156px] rounded-2xl bg-gradient-to-b from-[#7174aa]/15 to-[#00e8ae]/15 p-4 flex items-center justify-center text-center italic text-[14px] text-[#7174AA]"
                >
                  {heavyThought}
                </motion.div>
              ) : (
                <motion.textarea
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  value={heavyThought}
                  onChange={(e) => setHeavyThought(e.target.value)}
                  rows={5}
                  placeholder="Écris librement ce qui te pèse aujourd’hui…"
                  className={`w-full rounded-2xl p-3.5 text-[14px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#7174AA]/40 ${
                    nightMode
                      ? 'bg-white/8 text-white placeholder:text-white/35'
                      : 'bg-[#f6f7fc] text-[#222] placeholder:text-[#989ab0]'
                  }`}
                />
              )}
            </AnimatePresence>

            <button
              type="button"
              disabled={!heavyThought.trim() || releasing}
              onClick={handleRelease}
              className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-[#7174AA] to-[#5ec4ae] text-white font-ubuntu font-medium text-[14.5px] shadow-md flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Libérer et laisser s’envoler
            </button>

            {releasedMessage && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center text-[12.5px] font-medium text-[#00a87e]"
              >
                ✦ Tes mots se sont envolés. Respire doucement, tu es plus léger·e.
              </motion.p>
            )}
          </div>
        ) : (
          /* MODE 2 — STRUCTURED EVIDENCE LOG */
          <div className="flex flex-col gap-3">
            <form
              onSubmit={handleSaveFact}
              className={`rounded-[24px] p-4 border flex flex-col gap-2.5 ${
                nightMode
                  ? 'bg-white/6 border-white/12'
                  : 'bg-white/92 border-[#7174aa]/20 shadow-sm'
              }`}
            >
              <p className={`text-[12.5px] ${nightMode ? 'text-[#c3c7e0]' : 'text-[#555]'}`}>
                Noter les dates et faits aide un adulte de confiance, un CPE ou la police à agir
                vite.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Lieu (cour, bus, Insta…)"
                  className={`px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7174AA]/40 ${
                    nightMode
                      ? 'bg-white/8 text-white placeholder:text-white/35'
                      : 'bg-[#f4f5fa] text-[#222]'
                  }`}
                />
                <input
                  type="text"
                  value={witnesses}
                  onChange={(e) => setWitnesses(e.target.value)}
                  placeholder="Témoins (optionnel)"
                  className={`px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7174AA]/40 ${
                    nightMode
                      ? 'bg-white/8 text-white placeholder:text-white/35'
                      : 'bg-[#f4f5fa] text-[#222]'
                  }`}
                />
              </div>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Décris ce qui s’est passé (paroles, messages, gestes)…"
                className={`w-full px-3 py-2.5 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#7174AA]/40 ${
                  nightMode
                    ? 'bg-white/8 text-white placeholder:text-white/35'
                    : 'bg-[#f4f5fa] text-[#222]'
                }`}
              />
              <button
                type="submit"
                disabled={!details.trim()}
                className="w-full py-2.5 rounded-xl bg-[#7174AA] text-white font-ubuntu font-medium text-[14px] flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Enregistrer avec date et heure
              </button>
            </form>

            {entries.length > 0 && (
              <>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] font-semibold text-[#7174AA]">
                    Historique enregistré ({entries.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#00a87e] hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exporter (.txt)
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-2xl p-3.5 border text-[13px] ${
                        nightMode
                          ? 'bg-white/6 border-white/10 text-[#e0e4f5]'
                          : 'bg-white/90 border-black/8 text-[#222]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#8e8e93] mb-1">
                        <span>
                          {entry.date} · {entry.place}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFact(entry.id)}
                          aria-label="Supprimer cette note"
                          className="text-[#ff8989] hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="leading-snug">{entry.details}</p>
                      {entry.witnesses !== 'Aucun précisé' && (
                        <p className="mt-1 text-[11px] text-[#7174AA]">
                          Témoins : {entry.witnesses}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ScreenShell>
  );
};
