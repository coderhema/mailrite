import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';
import type { ContactWithProvenance } from '../../types';

interface DraftPreviewProps {
  contact: ContactWithProvenance;
  draft: string | null;
  isSending: boolean;
  onSend: () => void;
  onBack: () => void;
}

export default function DraftPreview({ contact, draft, isSending, onSend, onBack }: DraftPreviewProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contact.id}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 p-4 bg-bg-surface border border-border rounded-xl">
          <div className="avatar w-12 h-12 bg-bg-elevated border border-border rounded-full flex items-center justify-center text-[12px] text-text-secondary font-black uppercase tracking-tighter shrink-0">
            {contact.avatar}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold truncate">{contact.name}</div>
            <div className="text-[10px] text-text-secondary font-medium uppercase truncate">
              {contact.role} @ {contact.company}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel-title text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
            Email Draft
          </div>
          <div className="text-[14px] text-text-primary leading-relaxed border-l-2 border-accent/30 pl-4 italic whitespace-pre-wrap font-medium bg-bg-surface/50 p-4 rounded-r-xl">
            {draft || 'Drafting...'}
          </div>
        </div>

        <button
          onClick={onSend}
          disabled={isSending || !draft}
          className="w-full py-4 bg-accent text-bg-deep font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-accent/20"
        >
          {isSending ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Zap className="w-4 h-4 fill-bg-deep" />
              </motion.div>
              Sending...
            </>
          ) : (
            <>Send via {contact.source}</>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
