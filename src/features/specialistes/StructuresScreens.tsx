import React, { useMemo, useState } from 'react';
import { BadgeCheck, Bot, ChevronRight, Clock, ExternalLink, MessageSquareText, Phone, Search, ShieldCheck } from 'lucide-react';
import { ScreenShell } from '../../components/ScreenShell';
import { useSerenity } from '../../context/SerenityContext';
import { formatDateFr } from '../../data/articles';
import { AUDIENCES, Audience, Channel, STRUCTURES, STRUCTURE_TYPES, StructureType, searchStructures } from '../../data/structures';
import { smsHref } from '../../lib/device';

const useTone = () => {
  const { nightMode } = useSerenity();
  return {
    card: nightMode ? 'bg-white/[0.06] border-white/10' : 'bg-white/95 border-black/[0.08]',
    strong: nightMode ? 'text-white' : 'text-[#1d1b20]',
    muted: nightMode ? 'text-white/60' : 'text-[#6b6d80]',
  };
};

const ACCENT = '#2663FF';

interface StructuresScreenProps {
  onBack: () => void;
  onHome: () => void;
  onOpen: (id: string) => void;
  onAssistant: () => void;
}

/** Annuaire des structures d'aide vérifiées : recherche + filtres. */
export const StructuresScreen: React.FC<StructuresScreenProps> = ({ onBack, onHome, onOpen, onAssistant }) => {
  const t = useTone();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<StructureType | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const results = useMemo(() => searchStructures(query, type, audience), [query, type, audience]);

  const chip = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-medium border cursor-pointer ${
      active ? 'bg-[#2663FF] border-[#2663FF] text-white' : 'border-[#2663FF]/40 text-[#2663FF]'
    }`;

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={onBack} onBrandClick={onHome}>
      <div className="px-4 flex flex-col gap-3.5">
        <div className="px-1">
          <h1 className="font-ubuntu font-bold text-[28px] leading-tight text-[#2663FF]">Structures d’aide</h1>
          <p className={`mt-1 text-[13.5px] leading-snug ${t.muted}`}>
            Services publics et associations reconnus. Coordonnées vérifiées le {formatDateFr(STRUCTURES[0].verifiedAt)}. MBT
            n’est affilié à aucune de ces structures.
          </p>
        </div>

        <div className={`flex items-center gap-2 rounded-[18px] border-2 px-3.5 h-12 ${t.card}`}>
          <Search className={`w-4 h-4 shrink-0 ${t.muted}`} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : écoute, plainte, parents…"
            aria-label="Rechercher une structure"
            className={`flex-1 min-w-0 bg-transparent text-[16px] focus:outline-none ${t.strong}`}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Type d’aide">
          <button type="button" aria-pressed={type === null} onClick={() => setType(null)} className={chip(type === null)}>
            Tous
          </button>
          {(Object.keys(STRUCTURE_TYPES) as StructureType[]).map((k) => (
            <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(type === k ? null : k)} className={chip(type === k)}>
              {STRUCTURE_TYPES[k]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mt-1" role="group" aria-label="Public">
          {(['jeunes', 'parents', 'pros'] as Audience[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={audience === k}
              onClick={() => setAudience(audience === k ? null : k)}
              className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer ${
                audience === k ? 'bg-[#1d1b20] text-white' : `${t.card} border ${t.muted}`
              }`}
            >
              Pour : {AUDIENCES[k]}
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <p className={`text-center py-6 text-[14px] ${t.muted}`}>Aucune structure ne correspond à ces critères.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpen(s.id)}
                  className={`w-full text-left rounded-[22px] border-2 px-4 py-3.5 flex items-start gap-3 hover:shadow-md active:scale-[0.99] transition cursor-pointer ${t.card}`}
                >
                  <span className="flex-1 min-w-0">
                    <span className={`block font-ubuntu font-medium text-[15.5px] leading-snug ${t.strong}`}>{s.name}</span>
                    <span className={`block mt-0.5 text-[13px] leading-snug ${t.muted}`}>{s.summary}</span>
                    <span className={`mt-1.5 inline-flex items-center gap-1 text-[11.5px] ${t.muted}`}>
                      <Clock className="w-3 h-3" />
                      {s.hours}
                      {s.free ? ' · gratuit' : ''}
                      {s.anonymous ? ' · anonyme' : ''}
                    </span>
                  </span>
                  <ChevronRight className={`w-5 h-5 mt-3 shrink-0 ${t.muted}`} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onAssistant}
          className={`mt-1 flex items-center gap-3 rounded-[20px] border-2 border-dashed px-4 py-3 text-left cursor-pointer ${t.card}`}
        >
          <Bot className="w-6 h-6 text-[#2663FF] shrink-0" />
          <span className={`text-[13.5px] leading-snug ${t.strong}`}>
            <strong>Pas sûr·e de qui contacter ?</strong>
            <span className={`block text-[12.5px] ${t.muted}`}>L’assistant d’orientation (réponses automatiques) t’aide à choisir.</span>
          </span>
        </button>
      </div>
    </ScreenShell>
  );
};

interface StructureScreenProps {
  id: string;
  onBack: () => void;
  onHome: () => void;
  onCall: (serviceKey: string, customName?: string, customPhone?: string) => void;
}

export const StructureScreen: React.FC<StructureScreenProps> = ({ id, onBack, onHome, onCall }) => {
  const t = useTone();
  const s = STRUCTURES.find((x) => x.id === id);

  if (!s) {
    return (
      <ScreenShell theme="sinformer" showBrand={false} showBack onBack={onBack} onBrandClick={onHome}>
        <p className={`px-5 pt-6 text-[15px] ${t.strong}`}>Cette fiche n’existe pas ou a été déplacée.</p>
      </ScreenShell>
    );
  }

  const renderChannel = (c: Channel) => {
    const base = 'flex items-center gap-3 px-4 py-3.5 rounded-[20px] font-ubuntu font-medium text-[15.5px] text-left active:scale-[0.98] transition cursor-pointer';
    if (c.kind === 'tel') {
      return (
        <button key={c.label} type="button" onClick={() => onCall(c.serviceKey ?? 'custom', s.name, c.number)} className={`${base} bg-[#34C759] text-white`}>
          <Phone className="w-5 h-5 shrink-0" />
          {c.label}
        </button>
      );
    }
    if (c.kind === 'sms') {
      return (
        <a key={c.label} href={smsHref(c.number)} className={`${base} bg-[#FF8989] text-white`}>
          <MessageSquareText className="w-5 h-5 shrink-0" />
          {c.label}
        </a>
      );
    }
    return (
      <a key={c.label} href={c.url} target="_blank" rel="noopener noreferrer" className={`${base} border-2 border-[#2663FF]/40 text-[#2663FF] ${t.card}`}>
        <ExternalLink className="w-5 h-5 shrink-0" />
        {c.label}
      </a>
    );
  };

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={onBack} onBrandClick={onHome}>
      <div className="px-5 flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {s.types.map((ty) => (
              <span key={ty} className="px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#2663FF]/10 text-[#2663FF]">
                {STRUCTURE_TYPES[ty]}
              </span>
            ))}
          </div>
          <h1 className={`mt-2 font-ubuntu font-bold text-[25px] leading-[1.2] ${t.strong}`}>{s.name}</h1>
          <p className={`mt-2 text-[15px] leading-[1.55] ${t.strong}`}>{s.description}</p>
        </div>

        <div className={`rounded-[18px] border-2 px-4 py-3 flex flex-col gap-1 ${t.card}`}>
          <p className={`inline-flex items-center gap-2 text-[14px] ${t.strong}`}>
            <Clock className="w-4 h-4" style={{ color: ACCENT }} />
            {s.hours}
          </p>
          <p className={`text-[13px] ${t.muted}`}>
            {s.free ? 'Gratuit' : 'Payant'}
            {s.anonymous ? ' · Anonyme' : ''} · Pour : {s.audiences.map((a) => AUDIENCES[a]).join(', ')}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">{s.channels.map(renderChannel)}</div>

        <div className={`rounded-[18px] px-4 py-3 text-[12.5px] leading-snug ${t.muted} border ${t.card}`}>
          <p className="inline-flex items-center gap-1.5 font-semibold">
            <BadgeCheck className="w-4 h-4 text-[#00A884]" />
            Vérifié le {formatDateFr(s.verifiedAt)}
          </p>
          <p className="mt-1">
            Source :{' '}
            <a href={s.source} target="_blank" rel="noopener noreferrer" className="underline text-[#2663FF] break-all">
              {new URL(s.source).hostname}
            </a>
            . Les horaires peuvent évoluer : en cas de doute, consulte le site officiel.
          </p>
          <p className="mt-1 inline-flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            MBT n’est pas affilié à cette structure et ne transmet aucune information à ta place.
          </p>
        </div>
      </div>
    </ScreenShell>
  );
};
