export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  source: 'LinkedIn' | 'Gmail' | 'Instagram' | 'Twitter';
  email?: string;
}

export interface ContactProvenance {
  field: string;
  source: string;
  sourcedAt?: string;
}

export interface ContactWithProvenance extends Contact {
  provenance: ContactProvenance[];
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export interface DataSource {
  id: string;
  name: string;
  meta: string;
  active: boolean;
  configured: boolean;
  icon: string;
}

export interface CoralQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs?: number;
}

export interface CoralPresetQuery {
  label: string;
  sql: string;
  description: string;
}

export interface KanbanCard {
  id: string;
  contact: ContactWithProvenance;
  columnId: string;
  draft?: string;
  lastActionAt: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cardIds: string[];
}
