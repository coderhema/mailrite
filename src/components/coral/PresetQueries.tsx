import type { CoralPresetQuery } from '../../types';

interface PresetQueriesProps {
  queries: CoralPresetQuery[];
  onSelect: (preset: CoralPresetQuery) => void;
}

export default function PresetQueries({ queries, onSelect }: PresetQueriesProps) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Preset Queries</div>
      <div className="flex flex-wrap gap-1.5">
        {queries.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSelect(preset)}
            className="text-[10px] px-2.5 py-1.5 bg-bg-surface border border-border rounded-lg text-text-secondary hover:border-accent/40 hover:text-accent transition-colors font-medium"
            title={preset.description}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
