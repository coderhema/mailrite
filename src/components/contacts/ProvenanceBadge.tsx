import type { ContactProvenance } from '../../types';

interface ProvenanceBadgeProps {
  provenance: ContactProvenance;
}

const sourceConfig: Record<string, { label: string; color: string }> = {
  linkedin: { label: 'Li', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  gmail: { label: 'Gm', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  instagram: { label: 'Ig', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  twitter: { label: 'Tw', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
};

export default function ProvenanceBadge({ provenance }: ProvenanceBadgeProps) {
  const cfg = sourceConfig[provenance.source.toLowerCase()] || {
    label: provenance.source.slice(0, 2).toUpperCase(),
    color: 'text-text-secondary bg-bg-elevated border-border',
  };

  return (
    <span
      title={`${provenance.field} sourced from ${provenance.source}`}
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}
