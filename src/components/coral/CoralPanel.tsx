import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import PresetQueries from './PresetQueries';
import QueryEditor from './QueryEditor';
import QueryResults from './QueryResults';
import type { CoralPresetQuery, CoralQueryResult } from '../../types';

interface CoralPanelProps {
  available: boolean | null;
  presets: CoralPresetQuery[];
  query: string;
  onQueryChange: (value: string) => void;
  onRun: () => void;
  onPresetSelect: (preset: CoralPresetQuery) => void;
  loading: boolean;
  error: string | null;
  results: CoralQueryResult | null;
}

export default function CoralPanel({
  available,
  presets,
  query,
  onQueryChange,
  onRun,
  onPresetSelect,
  loading,
  error,
  results,
}: CoralPanelProps) {
  return (
    <motion.div
      key="coral"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {available === false && (
        <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-text-secondary">
            <span className="font-bold text-yellow-500">Coral CLI not found.</span>{' '}
            Install it: <code className="text-accent">brew install withcoral/tap/coral</code>
          </div>
        </div>
      )}

      <PresetQueries queries={presets} onSelect={onPresetSelect} />
      <QueryEditor value={query} onChange={onQueryChange} onRun={onRun} loading={loading} />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
          {error}
        </div>
      )}

      {results && <QueryResults result={results} />}
    </motion.div>
  );
}
