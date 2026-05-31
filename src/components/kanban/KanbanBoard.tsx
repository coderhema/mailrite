import { Plus } from 'lucide-react';
import KanbanColumnComponent from './KanbanColumn';
import type { KanbanColumn, KanbanCard } from '../../types';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard>;
  onMove: (cardId: string, columnId: string) => void;
  onCardClick: (card: KanbanCard) => void;
  onAddColumn: (title: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onRemoveColumn: (columnId: string) => void;
  getCardsForColumn: (columnId: string) => KanbanCard[];
}

export default function KanbanBoard({
  columns,
  cards,
  onMove,
  onCardClick,
  onAddColumn,
  onRenameColumn,
  onRemoveColumn,
  getCardsForColumn,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map((col) => (
        <KanbanColumnComponent
          key={col.id}
          column={col}
          cards={getCardsForColumn(col.id)}
          allColumns={columns}
          onMove={onMove}
          onCardClick={onCardClick}
          onRename={onRenameColumn}
          onRemove={onRemoveColumn}
        />
      ))}

      <div className="flex-shrink-0 w-[200px] flex items-start pt-9">
        <button
          onClick={() => {
            const title = prompt('Column name:');
            if (title?.trim()) onAddColumn(title.trim());
          }}
          className="w-full py-8 border-2 border-dashed border-border rounded-xl text-text-tertiary hover:text-text-secondary hover:border-text-secondary/40 transition-all flex flex-col items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Add Column</span>
        </button>
      </div>
    </div>
  );
}
