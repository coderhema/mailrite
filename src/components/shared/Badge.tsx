interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'provenance';
  className?: string;
  title?: string;
}

const variantStyles = {
  default: 'bg-bg-surface text-text-secondary border-border',
  accent: 'bg-accent-dim text-accent border-accent/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  provenance: 'bg-bg-elevated text-text-secondary border-border',
};

export default function Badge({ children, variant = 'default', className = '', title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
