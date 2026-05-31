import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

interface ThinkingIndicatorProps {
  stage: string;
}

export default function ThinkingIndicator({ stage }: ThinkingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="message w-full flex justify-start"
    >
      <div className="msg-bubble inline-block px-5 py-4 md:px-8 md:py-6 rounded-3xl text-[15px] md:text-[16px] leading-relaxed relative max-w-[90%] md:max-w-[540px] bg-bg-surface/30 border border-border/50 text-text-primary rounded-tl-[4px]">
        <div className="text-[10px] text-accent mb-3 tracking-[0.2em] font-black uppercase flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <Zap className="w-3 h-3 fill-accent" />
          </motion.div>
          Thinking...
        </div>
        <div className="shimmer-text font-medium italic">{stage}</div>
      </div>
    </motion.div>
  );
}
