import { motion } from 'motion/react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-10 text-center"
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-bg-surface border border-border flex items-center justify-center text-text-tertiary mb-4">
          {icon}
        </div>
      )}
      <div className="text-[13px] font-semibold text-text-primary mb-1">{title}</div>
      {description && (
        <div className="text-[11px] text-text-secondary max-w-[200px] leading-relaxed">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
