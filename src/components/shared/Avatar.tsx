import { motion } from 'motion/react';

interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-[12px]',
  lg: 'w-12 h-12 text-[14px]',
};

export default function Avatar({ initials, size = 'sm', className = '' }: AvatarProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`${sizeMap[size]} bg-bg-elevated border border-border rounded-full flex items-center justify-center font-black uppercase tracking-tighter text-text-secondary shrink-0 ${className}`}
    >
      {initials}
    </motion.div>
  );
}
