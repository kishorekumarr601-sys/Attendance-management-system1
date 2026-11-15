import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Send, Star, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { askSmartErpAi } from '../utils/ai';

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

const PRESET_CHIPS = [
  'Who is at-risk?',
  'Show low attendance',
  'Why is Mechanical low?',
  'Top performers',
  "Today's summary",
];

export const FloatingAiAssistant: React.FC = () => {
  const { state, session, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! Ask me anything about live attendance trends, at-risk students, department averages, or today’s summary.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  if (!session) return null;

  const sendQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || typing) return;

    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const [answer] = await Promise.all([
      askSmartErpAi(trimmed, state),
      new Promise((res) => setTimeout(res, 420)),
    ]);

    setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: answer }]);
    setTyping(false);
  };

  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Answer copied to clipboard', 'info');
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      showToast('Unable to copy automatically', 'error');
    }
  };

  return (
    <div className="no-print">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Ask AI Assistant"
          className="fixed bottom-20 lg:bottom-6 right-5 z-[60] inline-flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full bg-[#7A0000] text-white font-bold text-sm shadow-xl border-2 border-[#FFD700]/70 hover:bg-[#A50000] transition-transform hover:scale-105"
        >
          <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" aria-hidden="true" />
          <span>Ask AI</span>
        </button>
      )}

      {open && (
        <section
          aria-label="Smart ERP AI Assistant"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[70] w-[calc(100vw-2rem)] sm:w-96 max-h-[75vh] bg-white rounded-2xl border border-[#E8CFCF] shadow-2xl flex flex-col overflow-hidden page-transition"
        >
          {/* Header */}
          <div className="red-gradient-bg plus-pattern px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#5A0000] border border-[#FFD700] flex items-center justify-center">
                <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Smart ERP AI Assistant</h3>
                <p className="text-[11px] text-[#FFD700]">Live insights from your ERP records</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close AI Assistant"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFF5F5]/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#7A0000] text-white rounded-br-sm'
                      : 'bg-white text-[#1A0000] border border-[#E8CFCF] rounded-bl-sm shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'ai' && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#5A0000] hover:text-[#7A0000] px-1"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#1E9E4A]" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy answer
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex items-start">
                <div className="bg-white border border-[#E8CFCF] rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-[#5A0000]">
                  Analyzing ERP records...
                </div>
              </div>
            )}
          </div>

          {/* Preset chips */}
          <div className="px-3 py-2 bg-white border-t border-[#E8CFCF] flex gap-1.5 overflow-x-auto">
            {PRESET_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => sendQuestion(chip)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-[#FFF5F5] border border-[#E8CFCF] text-[11px] font-semibold text-[#7A0000] hover:bg-[#FFD700] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="p-3 bg-white border-t border-[#E8CFCF] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about attendance, risks..."
              aria-label="Ask AI question"
              className="flex-1 px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs focus:border-[#7A0000] outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send question"
              className="w-11 h-11 rounded-full btn-gold flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
