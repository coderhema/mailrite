import { useState } from 'react';
import { motion } from 'motion/react';
import { MoreVertical } from 'lucide-react';
import Avatar from '../shared/Avatar';
import ProvenanceBadge from '../contacts/ProvenanceBadge';
import type { KanbanCard as KanbanCardType, KanbanColumn } from '../../types';

interface KanbanCardComponentProps {
  card: KanbanCardType;
  columns: KanbanColumn[];
  onMove: (cardId: string, columnId: string) => void;
  onClick: (card: KanbanCardType) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function KanbanCardComponent({ card, columns, onMove, onClick }: KanbanCardComponentProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { contact, lastActionAt } = card;
  const uniqueSources = new Set(contact.provenance.map((p) => p.source));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(card)}
      className="bg-bg-surface border border-border rounded-lg p-3 cursor-pointer hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all group relative"
    >
      <div className="flex items-start gap-2.5">
        <Avatar initials={contact.avatar} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-text-primary truncate">{contact.name}</div>
          <div className="text-[10px] text-text-secondary leading-tight truncate mt-0.5">
            {contact.role}
            <span className="text-text-tertiary"> @ </span>
            {contact.company}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-text-primary transition-all"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mt-2.5">
        {Array.from(uniqueSources).map((source) => (
          <ProvenanceBadge key={source} provenance={{ field: 'data', source }} />
        ))}
        <span className="ml-auto text-[9px] text-text-tertiary font-medium">{timeAgo(lastActionAt)}</span>
      </div>

      {menuOpen && (
        <div
          className="absolute right-3 top-10 bg-bg-surface border border-border rounded-lg shadow-xl z-30 py-1 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          {columns
            .filter((col) => col.id !== card.columnId)
            .map((col) => (
              <button
                key={col.id}
                onClick={() => {
                  onMove(card.id, col.id);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                Move to {col.title}
              </button>
            ))}
        </div>
      )}
    </motion.div>
  );
}
