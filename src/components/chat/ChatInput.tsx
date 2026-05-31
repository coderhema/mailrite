import { useRef } from 'react';
import { Send } from 'lucide-react';
import type { DataSource } from '../../types';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  activeSources: DataSource[];
  value: string;
  onChange: (value: string) => void;
}

export default function ChatInput({ onSend, disabled, activeSources, value, onChange }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    onChange('');
    textareaRef.current?.focus();
  };

  return (
    <div className="input-area px-4 md:px-12 lg:px-20 pb-6 md:pb-10 pt-4 bg-gradient-to-t from-bg-deep via-bg-deep/95 to-transparent relative shrink-0">
      {activeSources.length > 0 && (
        <div className="mb-3.5 flex opacity-90 gap-2">
          {activeSources.map((s) => (
            <span
              key={s.id}
              className="tag-pill inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] text-accent font-bold uppercase tracking-wider"
            >
              <span className="status-dot w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#FF9F1C]" />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div className="input-container chat-shadow relative bg-bg-surface border border-border rounded-2xl p-4 flex gap-4 items-end transition-all">
        <textarea
          ref={textareaRef}
          placeholder="Ask MailRite..."
          className="flex-1 bg-transparent border-none text-text-primary font-sans text-[15px] resize-none h-7 p-1 outline-none placeholder:text-text-tertiary font-medium"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className={`send-btn w-9 h-9 bg-accent border-none rounded-lg cursor-pointer flex items-center justify-center relative -top-0.5 transition-all active:translate-y-[2px] active:shadow-none active:scale-[0.95] shadow-[0_4px_0_#c27800] ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
          }`}
          onClick={handleSend}
          disabled={disabled}
        >
          <Send className="w-4.5 h-4.5 text-black" />
        </button>
      </div>
    </div>
  );
}
