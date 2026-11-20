import React, { useMemo, useState } from 'react';
import { CalendarCheck, ChevronRight, Clock, ExternalLink, Search } from 'lucide-react';
import { ScreenShell } from '../../components/ScreenShell';
import { useSerenity } from '../../context/SerenityContext';
import { ARTICLES, ARTICLE_CATEGORIES, ArticleCategory, formatDateFr, searchArticles } from '../../data/articles';

const useTone = () => {
  const { nightMode } = useSerenity();
  return {
    card: nightMode ? 'bg-white/[0.06] border-white/10' : 'bg-white/95 border-black/[0.08]',
    strong: nightMode ? 'text-white' : 'text-[#1d1b20]',
    muted: nightMode ? 'text-white/60' : 'text-[#6b6d80]',
  };
};

interface LibraryScreenProps {
  initialCategory?: string;
  onBack: () => void;
  onHome: () => void;
  onOpen: (id: string) => void;
}

/** Bibliothèque d'articles sourcés : recherche + catégories. */
export const LibraryScreen: React.FC<LibraryScreenProps> = ({ initialCategory, onBack, onHome, onOpen }) => {
  const t = useTone();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ArticleCategory | null>(
    initialCategory && initialCategory in ARTICLE_CATEGORIES ? (initialCategory as ArticleCategory) : null
  );
  const results = useMemo(() => searchArticles(query, category), [query, category]);

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={onBack} onBrandClick={onHome}>
      <div className="px-4 flex flex-col gap-3.5">
        <div className="px-1">
          <h1 className="font-ubuntu font-bold text-[28px] leading-tight text-[#7174AA]">Comprendre et agir</h1>
          <p className={`mt-1 text-[13.5px] ${t.muted}`}>{ARTICLES.length} fiches rédigées à partir de sources officielles, datées et vérifiées.</p>
        </div>

        <div className={`flex items-center gap-2 rounded-[18px] border-2 px-3.5 h-12 ${t.card}`}>
          <Search className={`w-4 h-4 shrink-0 ${t.muted}`} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : preuves, témoin, 3018…"
            aria-label="Rechercher une fiche"
            className={`flex-1 min-w-0 bg-transparent text-[16px] focus:outline-none ${t.strong}`}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5" role="group" aria-label="Catégories">
          <button
            type="button"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-medium border cursor-pointer ${
              category === null ? 'bg-[#7174AA] border-[#7174AA] text-white' : 'border-[#7174AA] text-[#7174AA]'
            }`}
          >
            Tout
          </button>
          {(Object.keys(ARTICLE_CATEGORIES) as ArticleCategory[]).map((c) => {
            const active = category === c;
            const color = ARTICLE_CATEGORIES[c].color;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(active ? null : c)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-medium border cursor-pointer"
                style={{ borderColor: color, backgroundColor: active ? color : 'transparent', color: active ? '#fff' : color }}
              >
                {ARTICLE_CATEGORIES[c].label}
              </button>
            );
          })}
        </div>

        {results.length === 0 ? (
          <p className={`text-center py-6 text-[14px] ${t.muted}`}>Aucune fiche ne correspond. Essaie un autre mot.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {results.map((a) => {
              const cat = ARTICLE_CATEGORIES[a.category];
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(a.id)}
                    className={`w-full text-left rounded-[22px] border-[3px] px-4 py-3.5 flex items-start gap-3 hover:shadow-md active:scale-[0.99] transition cursor-pointer ${t.card}`}
                    style={{ borderColor: `${cat.color}88` }}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>
                        {cat.label}
                      </span>
                      <span className={`block mt-0.5 font-ubuntu font-medium text-[16px] leading-snug ${t.strong}`}>{a.title}</span>
                      <span className={`block mt-1 text-[13px] leading-snug ${t.muted}`}>{a.summary}</span>
                      <span className={`mt-1.5 inline-flex items-center gap-1 text-[11.5px] ${t.muted}`}>
                        <Clock className="w-3 h-3" />
                        {a.readingMinutes} min · à jour du {formatDateFr(a.updatedAt)}
                      </span>
                    </span>
                    <ChevronRight className={`w-5 h-5 mt-5 shrink-0 ${t.muted}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ScreenShell>
  );
};

interface ArticleScreenProps {
  id: string;
  onBack: () => void;
  onHome: () => void;
  onOpen: (id: string) => void;
}

export const ArticleScreen: React.FC<ArticleScreenProps> = ({ id, onBack, onHome, onOpen }) => {
  const t = useTone();
  const article = ARTICLES.find((a) => a.id === id);

  if (!article) {
    return (
      <ScreenShell theme="sinformer" showBrand={false} showBack onBack={onBack} onBrandClick={onHome}>
        <p className={`px-5 pt-6 text-[15px] ${t.strong}`}>Cette fiche n’existe pas ou a été déplacée.</p>
      </ScreenShell>
    );
  }
  const cat = ARTICLE_CATEGORIES[article.category];
  const related = ARTICLES.filter((a) => a.id !== article.id && a.category !== article.category).slice(0, 3);

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={onBack} onBrandClick={onHome}>
      <article className="px-5 flex flex-col gap-4">
        <header>
          <span className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>
            {cat.label}
          </span>
          <h1 className={`mt-1 font-ubuntu font-bold text-[26px] leading-[1.2] ${t.strong}`}>{article.title}</h1>
          <p className={`mt-2 text-[15px] leading-[1.5] ${t.muted}`}>{article.summary}</p>
        </header>

        {article.sections.map((s, i) => (
          <section key={i} className="flex flex-col gap-2">
            {s.heading && <h2 className="font-ubuntu font-bold text-[18px] text-[#7174AA]">{s.heading}</h2>}
            {s.paragraphs?.map((p, j) => (
              <p key={j} className={`text-[15.5px] leading-[1.6] ${t.strong}`}>
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="flex flex-col gap-1.5">
                {s.bullets.map((b, j) => (
                  <li key={j} className={`flex gap-2.5 text-[15px] leading-[1.55] ${t.strong}`}>
                    <span className="mt-[9px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className={`rounded-[20px] border-2 px-4 py-3.5 ${t.card}`}>
          <p className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${t.strong}`}>
            <CalendarCheck className="w-4 h-4 text-[#00A884]" />
            Mis à jour le {formatDateFr(article.updatedAt)}
          </p>
          <p className={`mt-1 text-[12px] leading-snug ${t.muted}`}>
            Fiche rédigée par l’équipe MBT à partir des sources ci-dessous. Elle ne remplace pas l’avis d’un professionnel.
          </p>
          <h2 className={`mt-3 text-[13px] font-bold uppercase tracking-wider ${t.muted}`}>Sources</h2>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {article.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-[13px] leading-snug text-[#2663FF] underline">
                  <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {src.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {related.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className={`text-[13px] font-bold uppercase tracking-wider ${t.muted}`}>À lire aussi</h2>
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onOpen(r.id)}
                className={`text-left rounded-[16px] border-2 px-4 py-2.5 font-ubuntu font-medium text-[14.5px] cursor-pointer ${t.card} ${t.strong}`}
              >
                {r.title}
              </button>
            ))}
          </section>
        )}
      </article>
    </ScreenShell>
  );
};
