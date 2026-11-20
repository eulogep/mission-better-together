import { useId, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { useSerenity } from '../context/SerenityContext';

interface DraftEditorProps {
  label: string;
  draft: string;
  onChange: (draft: string) => void;
}

export function DraftEditor({ label, draft, onChange }: DraftEditorProps) {
  const { nightMode } = useSerenity();
  const id = useId();
  const editor = useRef<HTMLTextAreaElement>(null);
  const [copyStatus, setCopyStatus] = useState<{ draft: string; message: string } | null>(null);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyStatus({ draft, message: 'Texte copié.' });
    } catch {
      editor.current?.focus();
      editor.current?.select();
      setCopyStatus({ draft, message: 'Copie automatique indisponible. Tu peux copier le texte sélectionné.' });
    }
  };

  return (
    <>
      <label htmlFor={id} className="block font-ubuntu font-medium">{label}</label>
      <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed opacity-80">
        Tu peux modifier le texte. Le brouillon s’efface quand tu quittes cet écran.
      </p>
      <textarea
        ref={editor}
        id={id}
        aria-describedby={`${id}-hint`}
        autoComplete="off"
        spellCheck={false}
        value={draft}
        onChange={(event) => {
          setCopyStatus(null);
          onChange(event.target.value);
        }}
        rows={6}
        className={`mt-2 w-full resize-y rounded-lg border border-current/25 p-2.5 text-base leading-relaxed ${nightMode ? 'bg-[#181b29]' : 'bg-white'}`}
      />
      <button
        type="button"
        onClick={copyDraft}
        disabled={!draft.trim()}
        className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg border border-current/20 px-3 text-sm font-medium cursor-pointer disabled:cursor-default disabled:opacity-50"
      >
        <Copy aria-hidden="true" className="size-4" /> Copier le texte
      </button>
      <p role="status" className="text-xs leading-relaxed [&:not(:empty)]:mt-2">
        {copyStatus?.draft === draft ? copyStatus.message : ''}
      </p>
    </>
  );
}
