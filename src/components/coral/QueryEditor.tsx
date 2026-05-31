import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  loading: boolean;
}

export default function QueryEditor({ value, onChange, onRun, loading }: QueryEditorProps) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">SQL Query</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SELECT name, email FROM linkedin.connections LIMIT 10"
        className="w-full h-24 bg-bg-deep border border-border rounded-xl p-3 text-[12px] font-mono text-text-primary resize-none outline-none focus:border-accent/40 transition-colors placeholder:text-text-tertiary"
        spellCheck={false}
      />
      <button
        onClick={onRun}
        disabled={loading || !value.trim()}
        className="w-full py-2.5 bg-accent text-bg-deep font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 text-[12px]"
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Zap className="w-3.5 h-3.5 fill-bg-deep" />
            </motion.div>
            Running...
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            Run Query
          </>
        )}
      </button>
    </div>
  );
}
