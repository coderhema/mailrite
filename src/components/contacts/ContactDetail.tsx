import { ChevronLeft } from 'lucide-react';
import Avatar from '../shared/Avatar';
import ProvenanceBadge from './ProvenanceBadge';
import type { ContactWithProvenance } from '../../types';

interface ContactDetailProps {
  contact: ContactWithProvenance;
  onBack: () => void;
}

export default function ContactDetail({ contact, onBack }: ContactDetailProps) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Pipeline
      </button>

      <div className="flex items-center gap-4 p-4 bg-bg-surface border border-border rounded-xl">
        <Avatar initials={contact.avatar} size="lg" />
        <div className="overflow-hidden">
          <div className="text-sm font-bold truncate">{contact.name}</div>
          <div className="text-[10px] text-text-secondary font-medium uppercase truncate">
            {contact.role} @ {contact.company}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-3">
          Data Provenance
        </div>
        <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
          {contact.provenance.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-0"
            >
              <span className="text-[12px] text-text-primary font-medium capitalize">{p.field}</span>
              <ProvenanceBadge provenance={p} />
            </div>
          ))}
          {contact.provenance.length === 0 && (
            <div className="px-4 py-3 text-[11px] text-text-tertiary">No provenance data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
