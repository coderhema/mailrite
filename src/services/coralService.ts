import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export interface CoralSource {
  name: string;
  type: string;
  configured: boolean;
  meta?: string;
}

export interface CoralQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs?: number;
}

export interface CoralConfig {
  binaryPath: string;
  timeout: number;
}

const DEFAULT_CONFIG: CoralConfig = {
  binaryPath: 'coral',
  timeout: 30000,
};

let config: CoralConfig = { ...DEFAULT_CONFIG };

export function configureCoral(cfg: Partial<CoralConfig>) {
  config = { ...config, ...cfg };
}

function shellQuote(s: string): string {
  if (/^[a-zA-Z0-9_\/\\\.\:-]+$/.test(s) && !s.includes(' ')) return s;
  return `"${s.replace(/[\\"]/g, '\\$&')}"`;
}

async function coralExec(args: string[]): Promise<string> {
  const cmd = `${config.binaryPath} ${args.map(shellQuote).join(' ')}`;
  const { stdout, stderr } = await execAsync(cmd, {
    timeout: config.timeout,
    env: { ...process.env },
  });
  if (stderr && !stdout) {
    throw new Error(`Coral CLI error: ${stderr}`);
  }
  return stdout.trim();
}

export async function checkCoralAvailable(): Promise<boolean> {
  try {
    await coralExec(['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function addSource(name: string, type: string, options?: Record<string, string>): Promise<void> {
  const args = ['source', 'add', name];
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      args.push(`--${key}`, value);
    }
  }
  await coralExec(args);
}

export async function listSources(): Promise<CoralSource[]> {
  const output = await coralExec(['source', 'list']);
  if (!output) return [];
  return output.split('\n')
    .filter(line => {
      const t = line.trim();
      return t && !t.startsWith('Source') && !/^[-]+/.test(t);
    })
    .map(line => {
      const parts = line.trim().split(/\s{2,}/);
      return {
        name: parts[0] || '',
        type: parts[1] || 'unknown',
        configured: true,
      };
    })
    .filter(s => s.name !== '');
}

export async function removeSource(name: string): Promise<void> {
  await coralExec(['source', 'remove', name]);
}

function parseJsonOutput(output: string): CoralQueryResult {
  if (!output) return { columns: [], rows: [], rowCount: 0 };

  let data: Record<string, unknown>[];
  try {
    data = JSON.parse(output);
  } catch {
    return { columns: [], rows: [], rowCount: 0 };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { columns: [], rows: [], rowCount: 0 };
  }

  const columns = Object.keys(data[0]);
  return { columns, rows: data, rowCount: data.length };
}

export async function runQuery(sql: string): Promise<CoralQueryResult> {
  const start = performance.now();
  const output = await coralExec(['sql', '--format', 'json', sql]);
  const executionTimeMs = Math.round(performance.now() - start);
  const result = parseJsonOutput(output);
  result.executionTimeMs = executionTimeMs;
  return result;
}

export async function runQueryFromFile(filePath: string): Promise<CoralQueryResult> {
  const start = performance.now();
  const sql = fs.readFileSync(filePath, 'utf-8').trim();
  const output = await coralExec(['sql', '--format', 'json', sql]);
  const executionTimeMs = Math.round(performance.now() - start);
  const result = parseJsonOutput(output);
  result.executionTimeMs = executionTimeMs;
  return result;
}
