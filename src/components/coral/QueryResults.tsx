import { Table, AlertCircle } from 'lucide-react';
import type { CoralQueryResult } from '../../types';

interface QueryResultsProps {
  result: CoralQueryResult;
}

export default function QueryResults({ result }: QueryResultsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-1.5">
          <Table className="w-3 h-3" />
          Results
        </div>
        <div className="text-[9px] text-text-tertiary font-medium">
          {result.rowCount} rows
          {result.executionTimeMs != null && ` · ${result.executionTimeMs}ms`}
        </div>
      </div>
      <div className="bg-bg-deep border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-border">
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="text-left p-2.5 text-accent font-bold uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.length > 0 ? (
              result.rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-bg-surface/50">
                  {result.columns.map((col) => (
                    <td key={col} className="p-2.5 text-text-primary whitespace-nowrap truncate max-w-[120px]">
                      {row[col] != null ? String(row[col]) : <span className="text-text-tertiary">NULL</span>}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={result.columns.length} className="p-6 text-center text-text-tertiary text-[11px] font-medium">
                  No rows returned
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
