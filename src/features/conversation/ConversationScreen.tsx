import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, ListOrdered, NotebookPen } from 'lucide-react';
import { DraftEditor } from '../../components/DraftEditor';
import { ScreenShell } from '../../components/ScreenShell';
import { useSerenity } from '../../context/SerenityContext';
import { DraftDetails, PERSPECTIVES, RECIPIENTS, REQUESTS, buildConversationDraft } from './draft';

type View = 'prepare' | 'draft' | 'practice' | 'show';

const HEADINGS: Record<View, string> = {
  prepare: 'Préparer une conversation',
  draft: 'Ton brouillon',
  practice: 'Répéter par étapes',
  show: 'Carte à montrer',
};

const INITIAL_DETAILS: DraftDetails = { perspective: 'eleve', recipient: 'proche', request: 'ecoute', facts: '' };

const primary = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#57477e] px-4 py-2 text-sm font-medium text-white hover:bg-[#463768] cursor-pointer disabled:opacity-45 disabled:cursor-default';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-current/20 px-3 py-2 text-sm font-medium hover:bg-current/5 cursor-pointer disabled:opacity-45 disabled:cursor-default';

interface ChoiceGroupProps<Value extends string> {
  name: string;
  label: string;
  options: readonly { id: Value; label: string }[];
  selected: Value;
  onSelect: (value: Value) => void;
}

function ChoiceGroup<Value extends string>({ name, label, options, selected, onSelect }: ChoiceGroupProps<Value>) {
  const { nightMode } = useSerenity();
  const active = nightMode ? 'border-[#d7c8ff] bg-[#524575]' : 'border-[#665793] bg-[#efe9fa]';
  const inactive = nightMode ? 'border-white/15 bg-white/5' : 'border-[#dfd9eb] bg-white/85';

  return (
    <fieldset>
      <legend className="font-ubuntu font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm leading-tight cursor-pointer ${selected === option.id ? active : inactive}`}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected === option.id}
              onChange={() => onSelect(option.id)}
              className="size-4 shrink-0 accent-[#7764ad]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ConversationScreen({ onBack }: { onBack: () => void }) {
  const { nightMode } = useSerenity();
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [draft, setDraft] = useState<{ template: string; text: string } | null>(null);
  const [view, setView] = useState<View>('prepare');
  const [part, setPart] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const surface = nightMode ? 'border-white/15 bg-[#222635]' : 'border-[#ded9e9] bg-white/90';
  const template = buildConversationDraft(details);
  const text = draft?.text ?? '';
  const parts = text.trim().split(/\n\s*\n/);
  const changingTemplate = draft !== null && draft.template !== template;

  useEffect(() => {
    heading.current?.focus();
  }, [view]);

  useEffect(() => {
    const resetRestoredPage = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setDetails(INITIAL_DETAILS);
      setDraft(null);
      setPart(0);
      setView('prepare');
    };
    window.addEventListener('pageshow', resetRestoredPage);
    return () => window.removeEventListener('pageshow', resetRestoredPage);
  }, []);

  const openDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDraft((current) => current?.template === template ? current : { template, text: template });
    setView('draft');
  };

  const goBack = () => {
    if (view === 'prepare') onBack();
    else if (view === 'draft') setView('prepare');
    else setView('draft');
  };

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={goBack}>
      <div className="mx-auto w-full max-w-[600px] px-5 pt-2 pb-5 sm:px-8">
        <h1 ref={heading} tabIndex={-1} className="font-ubuntu text-[30px] font-bold leading-tight focus:outline-none">
          {HEADINGS[view]}
        </h1>

        {view === 'prepare' && (
          <>
            <p className="mt-2 max-w-[48ch] text-sm leading-relaxed opacity-85">
              Choisis à qui tu veux parler et ce que tu aimerais demander. Tu pourras ensuite adapter tes mots.
            </p>
            <form onSubmit={openDraft} autoComplete="off" className={`mt-5 grid gap-5 rounded-2xl border p-4 sm:p-5 ${surface}`}>
              <ChoiceGroup
                label="Ta situation"
                name="perspective"
                options={PERSPECTIVES}
                selected={details.perspective}
                onSelect={(perspective) => setDetails((current) => ({ ...current, perspective }))}
              />
              <ChoiceGroup
                label="À qui veux-tu parler ?"
                name="recipient"
                options={RECIPIENTS}
                selected={details.recipient}
                onSelect={(recipient) => setDetails((current) => ({ ...current, recipient }))}
              />
              <ChoiceGroup
                label="De quoi as-tu besoin ?"
                name="request"
                options={REQUESTS}
                selected={details.request}
                onSelect={(request) => setDetails((current) => ({ ...current, request }))}
              />
              <div>
                <label htmlFor="conversation-facts" className="block font-ubuntu font-medium">Ce que tu veux expliquer</label>
                <p id="conversation-facts-hint" className="mt-1 text-xs leading-relaxed opacity-80">
                  Facultatif. Tu peux noter ce que tu as vécu ou observé, quand et où.
                </p>
                <textarea
                  id="conversation-facts"
                  aria-describedby="conversation-facts-hint"
                  spellCheck={false}
                  value={details.facts}
                  onChange={(event) => setDetails((current) => ({ ...current, facts: event.target.value }))}
                  rows={3}
                  className={`mt-2 w-full resize-y rounded-lg border border-current/25 p-2.5 text-base leading-relaxed ${nightMode ? 'bg-[#181b29]' : 'bg-white'}`}
                />
              </div>
              <div>
                <button className={`w-full ${primary}`} type="submit">
                  <NotebookPen aria-hidden="true" className="size-4" />
                  {draft === null ? 'Voir mon brouillon' : changingTemplate ? 'Créer un nouveau brouillon' : 'Reprendre mon brouillon'}
                </button>
              </div>
            </form>
            <p className="mt-3 text-xs leading-relaxed opacity-80">
              Ton texte reste dans cet écran et s’efface quand tu le quittes.
            </p>
            <details className="mt-2 text-xs opacity-85">
              <summary className="w-fit py-2 cursor-pointer">Sources · Éducation nationale</summary>
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                <li><a href="https://www.education.gouv.fr/non-au-harcelement/je-suis-victime-de-harcelement-468671" target="_blank" rel="noreferrer" className="underline">Pour les élèves</a></li>
                <li><a href="https://www.education.gouv.fr/non-au-harcelement/mon-enfant-est-victime-de-harcelement-323014" target="_blank" rel="noreferrer" className="underline">Pour les parents</a></li>
              </ul>
              <p className="mt-2">Vérifiées le <time dateTime="2026-11-20">20 novembre 2026</time>.</p>
            </details>
          </>
        )}

        {view === 'draft' && draft && (
          <>
            <div className={`mt-5 rounded-2xl border p-4 sm:p-5 ${surface}`}>
              <DraftEditor label="Tes mots" draft={text} onChange={(value) => setDraft({ ...draft, text: value })} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={secondary}
                disabled={!text.trim()}
                onClick={() => {
                  setPart(0);
                  setView('practice');
                }}
              >
                <ListOrdered aria-hidden="true" className="size-4" /> Répéter par étapes
              </button>
              <button type="button" className={primary} disabled={!text.trim()} onClick={() => setView('show')}>
                <Eye aria-hidden="true" className="size-4" /> Afficher en grand
              </button>
            </div>
            <button type="button" onClick={goBack} className={`mt-3 ${secondary}`}>
              <ArrowLeft aria-hidden="true" className="size-4" /> Revenir aux choix
            </button>
          </>
        )}

        {view === 'practice' && (
          <>
            <div aria-live="polite" className={`mt-4 rounded-2xl border p-5 sm:p-6 ${surface}`}>
              <p className="mb-2 text-sm font-medium opacity-80">Partie {part + 1} sur {parts.length}</p>
              <p className="whitespace-pre-wrap text-[clamp(1.125rem,4.6vw,1.45rem)] leading-relaxed [overflow-wrap:anywhere]">{parts[part]}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className={secondary} onClick={() => setPart((current) => current - 1)} disabled={part === 0}>
                <ArrowLeft aria-hidden="true" className="size-4" /> Précédente
              </button>
              <button type="button" className={primary} onClick={() => setPart((current) => current + 1)} disabled={part >= parts.length - 1}>
                Suivante <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
            <button type="button" className={`mt-3 ${secondary}`} onClick={goBack}>Revenir au brouillon</button>
          </>
        )}

        {view === 'show' && (
          <>
            <button type="button" className={`mt-3 ${secondary}`} onClick={goBack}>
              <ArrowLeft aria-hidden="true" className="size-4" /> Quitter le grand affichage
            </button>
            <div className={`mt-4 rounded-2xl border p-5 sm:p-7 ${surface}`}>
              <p className="whitespace-pre-wrap text-[clamp(1.25rem,5vw,1.75rem)] leading-relaxed [overflow-wrap:anywhere]">{text.trim()}</p>
            </div>
          </>
        )}
      </div>
    </ScreenShell>
  );
}
