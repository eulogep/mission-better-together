import { useEffect, useRef, useState } from 'react';
import { BookOpenText, ChevronRight, ExternalLink, MessageCircle, NotebookPen } from 'lucide-react';
import { ScreenShell } from '../../components/ScreenShell';
import { DraftEditor } from '../../components/DraftEditor';
import { useSerenity } from '../../context/SerenityContext';
import { PRACTICE_SCENARIOS, PracticeScenario } from './scenarios';

interface PracticeScreenProps {
  scenarioId?: string;
  onOpenScenario: (id: string) => void;
  onOpenArticle: (id: string) => void;
  onPrepareConversation: () => void;
  onBack: () => void;
  onHome: () => void;
}

export function PracticeScreen({ scenarioId, onOpenScenario, onOpenArticle, onPrepareConversation, onBack, onHome }: PracticeScreenProps) {
  const { nightMode } = useSerenity();
  const scenario = PRACTICE_SCENARIOS.find((item) => item.id === scenarioId);
  const surface = nightMode ? 'border-white/15 bg-white/8' : 'border-[#ded9e9] bg-white/90';

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={onBack} onBrandClick={onHome}>
      <div className="mx-auto w-full max-w-[580px] px-5 pt-2 pb-5 sm:px-7">
        {scenario ? (
          <PracticeExercise key={scenario.id} scenario={scenario} onOpenArticle={onOpenArticle} />
        ) : (
          <>
            <h1 className="font-ubuntu text-[30px] font-bold leading-tight">S’entraîner à réagir</h1>
            <p className="mt-2 max-w-[45ch] text-sm leading-relaxed opacity-80">
              Choisis une situation fictive, compare les réactions et trouve les mots pour en parler.
            </p>
            <ul className="mt-5 space-y-3">
              {PRACTICE_SCENARIOS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpenScenario(item.id)}
                    className={`group flex w-full items-center gap-3 overflow-hidden rounded-2xl border pr-3.5 text-left cursor-pointer sm:gap-4 ${surface}`}
                  >
                    <img
                      src={item.image}
                      alt=""
                      style={{ objectPosition: `center ${item.imageFocusY}%` }}
                      className="h-24 w-24 shrink-0 object-cover sm:w-32"
                    />
                    <span className="min-w-0 flex-1 py-3">
                      <span className="block text-xs opacity-80">{item.role}</span>
                      <span className="mt-1 block font-ubuntu text-base font-medium leading-tight sm:text-lg">{item.title}</span>
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 opacity-65 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <button
          type="button"
          onClick={onPrepareConversation}
          className={`mt-5 flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left cursor-pointer ${surface}`}
        >
          <NotebookPen aria-hidden="true" className="size-5 shrink-0" />
          <span className="flex-1 font-medium">Préparer une conversation</span>
          <ChevronRight aria-hidden="true" className="size-4 shrink-0 opacity-65" />
        </button>
      </div>
    </ScreenShell>
  );
}

function PracticeExercise({ scenario, onOpenArticle }: { scenario: PracticeScenario; onOpenArticle: (id: string) => void }) {
  const { nightMode } = useSerenity();
  const [selected, setSelected] = useState<number | null>(null);
  const [showDraft, setShowDraft] = useState(false);
  const [draft, setDraft] = useState(scenario.starter);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const draftPanelRef = useRef<HTMLElement>(null);
  const choice = selected === null ? null : scenario.choices[selected];
  const surface = nightMode ? 'border-white/15 bg-white/8' : 'border-[#ded9e9] bg-white/95';
  const active = nightMode ? 'border-[#c9bafb] bg-[#524575]' : 'border-[#665793] bg-[#f0eafa]';

  useEffect(() => {
    if (selected !== null) feedbackRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  useEffect(() => {
    if (showDraft) draftPanelRef.current?.scrollIntoView({ block: 'nearest' });
  }, [showDraft]);

  return (
    <>
      <header className="relative isolate flex min-h-[154px] flex-col justify-end overflow-hidden rounded-2xl bg-[#201a31] p-4 text-white sm:min-h-[200px] sm:p-5">
        <img
          src={scenario.image}
          alt=""
          style={{ objectPosition: `center ${scenario.imageFocusY}%` }}
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <p className="text-xs font-medium text-[#f5de8e]">{scenario.role} · Situation fictive</p>
        <h1 className="mt-1 font-ubuntu text-[27px] font-bold leading-tight sm:text-[32px]">{scenario.title}</h1>
      </header>
      <p className="mt-4 text-[15px] leading-relaxed">{scenario.situation}</p>

      <h2 id="practice-choices" className="mt-5 mb-2.5 font-ubuntu text-lg font-medium">Que ferais-tu ?</h2>
      <div role="group" aria-labelledby="practice-choices" className="grid gap-2.5">
        {scenario.choices.map((option, index) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={selected === index}
            className={`min-h-12 w-full rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium leading-snug cursor-pointer ${selected === index ? active : surface}`}
            onClick={() => setSelected(index)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" ref={feedbackRef} className="scroll-m-3">
        {choice && (
          <section className={`mt-4 rounded-2xl border p-4 ${active}`}>
            <h2 className="font-ubuntu text-base font-medium">Ce que ça peut changer</h2>
            <p className="mt-1 text-sm leading-relaxed">{choice.feedback}</p>
          </section>
        )}
      </div>

      {choice && (
        <>
          <button
            type="button"
            aria-expanded={showDraft}
            onClick={() => setShowDraft((visible) => !visible)}
            className="mt-3 flex min-h-12 w-full items-center gap-2.5 rounded-xl bg-[#57477e] px-3.5 text-left text-sm font-medium text-white hover:bg-[#463768] cursor-pointer"
          >
            <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
            {showDraft ? 'Masquer le brouillon' : 'Préparer mes mots'}
          </button>
          {showDraft && (
            <section ref={draftPanelRef} className={`mt-2 scroll-m-3 rounded-2xl border p-4 ${surface}`}>
              <DraftEditor label={scenario.recipient} draft={draft} onChange={setDraft} />
            </section>
          )}
          <button
            type="button"
            onClick={() => onOpenArticle(scenario.articleId)}
            className="mt-3 flex min-h-11 items-center gap-2.5 px-1 text-sm font-medium underline underline-offset-4 cursor-pointer"
          >
            <BookOpenText aria-hidden="true" className="size-4" /> Lire la fiche pratique
          </button>
        </>
      )}
      <a
        href={scenario.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs underline underline-offset-4"
      >
        Source · Éducation nationale <ExternalLink aria-hidden="true" className="size-3" />
      </a>
    </>
  );
}
