import { ChevronRight } from 'lucide-react';
import Avatar from '../shared/Avatar';
import ProvenanceBadge from './ProvenanceBadge';
import type { ContactWithProvenance } from '../../types';

interface ContactCardProps {
  contact: ContactWithProvenance;
  onClick: () => void;
  showActions?: boolean;
}

export default function ContactCard({ contact, onClick, showActions = true }: ContactCardProps) {
  const uniqueSources = new Set(contact.provenance.map((p) => p.source));

  return (
    <div
      onClick={onClick}
      className="preview-item bg-bg-surface p-4 flex gap-3.5 items-center cursor-pointer hover:bg-bg-elevated active:bg-bg-surface transition-all group"
    >
      <Avatar initials={contact.avatar} />
      <div className="preview-details flex flex-col flex-1 min-w-0">
        <div className="preview-name text-[13px] font-bold tracking-tight truncate">{contact.name}</div>
        <div className="preview-role text-[10px] text-text-secondary font-medium uppercase tracking-wide truncate">
          {contact.role} @ {contact.company}
        </div>
        <div className="flex gap-1 mt-1.5">
          {Array.from(uniqueSources).map((source) => (
            <ProvenanceBadge
              key={source}
              provenance={{ field: 'data', source }}
            />
          ))}
        </div>
      </div>
      {showActions && (
        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}
