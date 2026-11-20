import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Phone, RotateCcw, User, Wind } from 'lucide-react';
import { useSerenity } from '../context/SerenityContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'psy';
  text: string;
  crisisAction?: { label: string; serviceKey: string }[];
}

interface ChatPsyScreenProps {
  onBack: () => void;
  onCallService: (serviceKey: string) => void;
  onOpenSanctuary: () => void;
}

const STORAGE_KEY = 'mbt_chat_psy_v1';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'user',
    text: 'Bonjour Dr. House, est-ce que je peux vous parler en toute confidentialité ?',
  },
  {
    id: 'm2',
    sender: 'psy',
    text: 'Bonjour ! Bien sûr, vous êtes ici dans un espace sécurisé et anonyme. Comment puis-je vous aider aujourd’hui ?',
  },
  {
    id: 'm3',
    sender: 'user',
    text: 'Je subis des moqueries et des messages méchants tous les jours, je ne sais plus quoi faire.',
  },
  {
    id: 'm4',
    sender: 'psy',
    text: 'Je suis vraiment désolé que vous traversiez cela. Ce que vous vivez n’est jamais de votre faute. Prenez le temps de m’expliquer ce qui se passe : est-ce à l’école, en ligne, ou ailleurs ?',
  },
];

const QUICK_PROMPTS = [
  'C’est à l’école / au collège',
  'Sur les réseaux sociaux',
  'Je suis témoin',
  'Je ne me sens pas en sécurité',
];

function generateReply(userText: string): {
  text: string;
  crisisAction?: { label: string; serviceKey: string }[];
} {
  const lower = userText.toLowerCase();

  if (
    lower.includes('suicide') ||
    lower.includes('mourir') ||
    lower.includes('plus envie') ||
    lower.includes('finir') ||
    lower.includes('mal me faire')
  ) {
    return {
      text: 'Merci d’avoir osé en parler. Vous n’êtes pas seul(e) et des professionnels bienveillants peuvent vous écouter tout de suite, gratuitement et en toute confidentialité. Appelez le 3114 maintenant.',
      crisisAction: [
        { label: 'Appeler le 3114 (24h/24)', serviceKey: '3114' },
        { label: 'Appeler le 3018', serviceKey: '3018' },
      ],
    };
  }

  if (
    lower.includes('danger') ||
    lower.includes('sécurité') ||
    lower.includes('securite') ||
    lower.includes('frappe') ||
    lower.includes('menace') ||
    lower.includes('peur')
  ) {
    return {
      text: 'Votre sécurité passe avant tout. Mettez-vous immédiatement dans un lieu sûr entouré d’adultes (infirmerie, commerce, pharmacie « Demandez Angela ») et contactez un secours ou un proche.',
      crisisAction: [
        { label: '17 · Police Secours', serviceKey: '17' },
        { label: '3018 · Harcèlement', serviceKey: '3018' },
      ],
    };
  }

  if (
    lower.includes('réseau') ||
    lower.includes('reseau') ||
    lower.includes('ligne') ||
    lower.includes('message') ||
    lower.includes('insta') ||
    lower.includes('snap') ||
    lower.includes('tiktok') ||
    lower.includes('cyber')
  ) {
    return {
      text: 'Face au cyberharcèlement, trois réflexes efficaces :\n1. Ne répondez pas aux provocations.\n2. Faites des captures d’écran (date, pseudo, contenu) comme preuves.\n3. Bloquez les comptes et contactez le 3018 qui peut faire supprimer des contenus en quelques heures.',
      crisisAction: [{ label: 'Appeler le 3018 (Gratuit)', serviceKey: '3018' }],
    };
  }

  if (lower.includes('témoin') || lower.includes('temoin') || lower.includes('ami')) {
    return {
      text: 'Votre réaction de témoin est précieuse et peut vraiment protéger la victime. Ne vous mettez pas en danger seul(e) : restez aux côtés de la personne après l’incident, montrez-lui votre soutien et alertez immédiatement un adulte de confiance (CPE, enseignant, parent).',
    };
  }

  if (
    lower.includes('école') ||
    lower.includes('ecole') ||
    lower.includes('collège') ||
    lower.includes('college') ||
    lower.includes('lycée') ||
    lower.includes('lycee') ||
    lower.includes('classe')
  ) {
    return {
      text: 'Dans un établissement scolaire, vous pouvez noter les faits (dates, lieux, témoins) et en parler à un adulte de confiance : parent, infirmière, CPE ou référent pHARe. Voulez-vous que nous préparions ensemble comment aborder la conversation ?',
      crisisAction: [{ label: '3020 · Harcèlement scolaire', serviceKey: '3020' }],
    };
  }

  return {
    text: 'Je vous écoute avec attention. Pouvez-vous me dire depuis combien de temps cette situation dure et s’il y a déjà un adulte ou un proche au courant autour de vous ? Nous allons avancer étape par étape ensemble.',
  };
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_MESSAGES;
}

export const ChatPsyScreen: React.FC<ChatPsyScreenProps> = ({
  onBack,
  onCallService,
  onOpenSanctuary,
}) => {
  const { nightMode } = useSerenity();
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const sendMessage = (textToSend?: string) => {
    const clean = (textToSend ?? input).trim();
    if (!clean || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: clean,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      const reply = generateReply(clean);
      setMessages((prev) => [
        ...prev,
        {
          id: `p_${Date.now()}`,
          sender: 'psy',
          text: reply.text,
          crisisAction: reply.crisisAction,
        },
      ]);
      setIsTyping(false);
    }, 650);
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col font-ios animate-screen-in overflow-hidden transition-colors duration-300 ${
        nightMode ? 'bg-[#141724] text-[#eef0fa]' : 'bg-white text-[#1d1b20]'
      }`}
    >
      {/* Header matching Figma 207:1250 + calming breathing shortcut */}
      <div
        className={`px-3.5 pt-4 pb-3 border-b flex items-center justify-between shrink-0 z-10 ${
          nightMode ? 'bg-[#181c2c] border-white/10' : 'bg-white border-black/10'
        }`}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className={`w-9 h-9 -ml-1 flex items-center justify-center rounded-full active:scale-90 transition cursor-pointer ${
            nightMode ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'
          }`}
        >
          <ChevronLeft className="w-7 h-7" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className={`w-[42px] h-[42px] rounded-full border flex items-center justify-center ${
              nightMode
                ? 'border-white/25 bg-white/8 text-white'
                : 'border-[#8e8e93] bg-white text-black'
            }`}
          >
            <User className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-semibold text-[15.5px] leading-tight ${
                  nightMode ? 'text-white' : 'text-black'
                }`}
              >
                Dr. House
              </span>
              <img
                src="/assets/verified-badge.png"
                alt="Spécialiste vérifié"
                className="w-[17px] h-[17px] object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Psychologue · Confidentiel
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSanctuary}
            title="Pause respiration apaisante"
            aria-label="Pause respiration"
            className="w-8 h-8 rounded-full bg-[#00e8ae]/15 text-[#00a87e] flex items-center justify-center hover:bg-[#00e8ae]/25 transition cursor-pointer"
          >
            <Wind className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetChat}
            title="Réinitialiser la conversation"
            aria-label="Réinitialiser la conversation"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8e8e93] hover:bg-black/5 hover:text-current cursor-pointer transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-5 pb-32 flex flex-col gap-4">
        {messages.map((msg) =>
          msg.sender === 'user' ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[78%] bg-[#2663FF] text-white px-5 py-3.5 rounded-tl-[25px] rounded-bl-[25px] rounded-br-[25px] text-[13.5px] leading-[1.45] shadow-xs">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-2.5">
              <div className="w-[26px] h-[26px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-black/5 flex items-center justify-center shrink-0">
                <img
                  src="/assets/psy-avatar.png"
                  alt=""
                  className="w-[14px] h-[18px] object-contain"
                />
              </div>
              <div className="max-w-[78%] flex flex-col gap-2">
                <div
                  className={`px-5 py-3.5 rounded-tl-[25px] rounded-tr-[25px] rounded-br-[25px] text-[13.5px] leading-[1.48] whitespace-pre-line ${
                    nightMode ? 'bg-white/10 text-[#e6e9f7]' : 'bg-[#EEEEEE] text-[#505050]'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.crisisAction && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.crisisAction.map((act) => (
                      <button
                        key={act.serviceKey}
                        type="button"
                        onClick={() => onCallService(act.serviceKey)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF8989] text-white text-[12px] font-semibold shadow-xs hover:bg-[#f26f6f] active:scale-95 transition cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {isTyping && (
          <div className="flex items-end gap-2.5">
            <div className="w-[26px] h-[26px] rounded-full bg-white shadow border border-black/5 flex items-center justify-center shrink-0">
              <img src="/assets/psy-avatar.png" alt="" className="w-[14px] h-[18px] object-contain" />
            </div>
            <div
              className={`px-4 py-3 rounded-[20px] flex gap-1 ${
                nightMode ? 'bg-white/10' : 'bg-[#EEEEEE]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#999] animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-[#999] animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-[#999] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating Bottom Composer + Quick Replies */}
      <div
        className={`absolute inset-x-0 bottom-0 pt-3 pb-5 px-4 bg-gradient-to-t ${
          nightMode
            ? 'from-[#141724] via-[#141724]/95 to-transparent'
            : 'from-white via-white/95 to-transparent'
        }`}
      >
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2.5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium active:scale-95 transition cursor-pointer border ${
                nightMode
                  ? 'bg-[#2663FF]/18 border-[#2663FF]/35 text-[#a7c2ff] hover:bg-[#2663FF]/28'
                  : 'bg-[#f4f6fb] border-[#2663FF]/20 text-[#2663FF] hover:bg-[#2663FF]/10'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className={`h-[56px] rounded-[30px] shadow-[0_8px_28px_rgba(0,0,0,0.14)] border flex items-center pl-5 pr-3 gap-2.5 ${
            nightMode ? 'bg-[#1e2336] border-white/10' : 'bg-white border-black/5'
          }`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message..."
            className={`flex-1 bg-transparent text-[14px] focus:outline-none ${
              nightMode
                ? 'text-white placeholder:text-white/40'
                : 'text-[#1d1b20] placeholder:text-[#a1a1a1]'
            }`}
          />
          <button
            type="button"
            onClick={() =>
              setInput((prev) =>
                prev ? prev : 'J’aurais besoin de conseils pour en parler à un adulte.'
              )
            }
            title="Dicter un message"
            aria-label="Microphone"
            className="w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer"
          >
            <img src="/assets/icon-mic.svg" alt="" className="w-6 h-6" />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Envoyer"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 active:scale-90 disabled:opacity-40 transition cursor-pointer"
          >
            <img src="/assets/icon-send.svg" alt="Envoyer" className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};
