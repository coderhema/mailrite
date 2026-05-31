import { motion } from 'motion/react';

interface LoadingDotsProps {
  className?: string;
}

export default function LoadingDots({ className = '' }: LoadingDotsProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
          className="w-1.5 h-1.5 rounded-full bg-current"
        />
      ))}
    </span>
  );
}
