import { Plus } from 'lucide-react';
import SourceCard from './SourceCard';
import type { DataSource } from '../../types';

interface SourceListProps {
  sources: DataSource[];
  onToggle: (id: string) => void;
  onConfigure: (source: DataSource) => void;
  onAddSource: () => void;
}

export default function SourceList({ sources, onToggle, onConfigure, onAddSource }: SourceListProps) {
  return (
    <>
      <div className="panel-title text-[11px] uppercase tracking-[0.2em] text-text-secondary font-bold mb-6 flex justify-between items-center">
        Data Sources
        <button
          onClick={onAddSource}
          className="p-1 hover:text-accent transition-colors active:scale-[0.92]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-3 custom-scrollbar">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onToggle={onToggle}
            onConfigure={onConfigure}
            showConnectionLine
          />
        ))}
      </div>
    </>
  );
}
