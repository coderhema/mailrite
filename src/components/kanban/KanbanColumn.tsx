import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Plus, X, Pencil } from 'lucide-react';
import KanbanCardComponent from './KanbanCard';
import EmptyState from '../shared/EmptyState';
import type { KanbanColumn as KanbanColumnType, KanbanCard } from '../../types';

interface KanbanColumnComponentProps {
  column: KanbanColumnType;
  cards: KanbanCard[];
  allColumns: KanbanColumnType[];
  onMove: (cardId: string, columnId: string) => void;
  onCardClick: (card: KanbanCard) => void;
  onRename: (columnId: string, title: string) => void;
  onRemove: (columnId: string) => void;
}

export default function KanbanColumnComponent({
  column,
  cards,
  allColumns,
  onMove,
  onCardClick,
  onRename,
  onRemove,
}: KanbanColumnComponentProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const isDefault = ['to-reach', 'in-progress', 'sent', 'replied'].includes(column.id);

  return (
    <div className="flex-shrink-0 w-[260px] flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                onRename(column.id, title);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onRename(column.id, title);
                  setEditing(false);
                }
              }}
              className="bg-bg-elevated border border-border rounded px-2 py-0.5 text-[11px] font-bold text-text-primary outline-none w-[140px]"
            />
          ) : (
            <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">{column.title}</span>
          )}
          <span className="text-[10px] text-text-tertiary font-medium tabular-nums">{cards.length}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {!isDefault && (
            <button
              onClick={() => onRemove(column.id)}
              className="p-1 text-text-tertiary hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <KanbanCardComponent
              key={card.id}
              card={card}
              columns={allColumns}
              onMove={onMove}
              onClick={onCardClick}
            />
          ))}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-6">
            <EmptyState
              title="Empty"
              description="Move contacts here"
            />
          </div>
        )}
      </div>
    </div>
  );
}
