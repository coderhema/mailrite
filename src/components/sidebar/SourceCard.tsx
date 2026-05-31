import { motion, AnimatePresence } from 'motion/react';
import { Linkedin, Mail, Instagram, Twitter, Facebook, Slack, MessageSquare, Database, Lock } from 'lucide-react';
import type { DataSource } from '../../types';

interface SourceCardProps {
  source: DataSource;
  onToggle: (id: string) => void;
  onConfigure: (source: DataSource) => void;
  showConnectionLine?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-3.5 h-3.5" />,
  mail: <Mail className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  twitter: <Twitter className="w-3.5 h-3.5" />,
  facebook: <Facebook className="w-3.5 h-3.5" />,
  slack: <Slack className="w-3.5 h-3.5" />,
  discord: <MessageSquare className="w-3.5 h-3.5" />,
  hubspot: <Database className="w-3.5 h-3.5" />,
};

export default function SourceCard({ source, onToggle, onConfigure, showConnectionLine }: SourceCardProps) {
  return (
    <div className="relative">
      <label
        onClick={(e) => {
          if (!source.configured) {
            e.preventDefault();
            onConfigure(source);
          }
        }}
        className={`source-card bg-bg-surface border border-border rounded-lg p-4 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer relative group z-20 ${
          source.active
            ? 'border-accent/40 bg-gradient-to-br from-bg-surface to-accent/5'
            : 'hover:bg-bg-elevated hover:border-text-secondary/40'
        }`}
      >
        <div className="source-info flex flex-col">
          <div className="source-name text-[14px] font-semibold mb-0.5 flex items-center gap-2">
            <span className="text-text-secondary">{iconMap[source.icon] || null}</span>
            {source.name}
            {!source.configured && <Lock className="w-3 h-3 text-text-tertiary" />}
          </div>
          <div className="source-meta text-[10px] text-text-secondary tabular-nums tracking-wide">
            {source.configured ? source.meta : 'Configure in settings'}
          </div>
        </div>
        <input
          type="checkbox"
          className="hidden"
          checked={source.active}
          disabled={!source.configured}
          onChange={() => onToggle(source.id)}
        />
        <div
          className={`toggle w-11 h-6.5 rounded-full relative transition-all duration-300 ease-in-out p-1 ${
            !source.configured ? 'opacity-40 cursor-not-allowed' : ''
          } ${source.active ? 'bg-[#34C759]' : 'bg-[#E9E9EA] dark:bg-[#39393D]'}`}
        >
          <motion.div
            animate={{ x: source.active ? 18 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-4.5 h-4.5 bg-white rounded-full shadow-md"
          />
        </div>
      </label>

      <AnimatePresence>
        {source.active && showConnectionLine && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            style={{ originX: 0 }}
            className="absolute -right-[26px] top-1/2 -translate-y-1/2 w-[26px] h-[1px] z-10 overflow-hidden"
          >
            <div className="w-full h-full connection-flow" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_#FF9F1C]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
