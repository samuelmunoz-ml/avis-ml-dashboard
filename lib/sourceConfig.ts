import { DataType } from '@/app/api/sync/route';

export interface SourceConfig {
  id: string;
  name: string;
  dataType: DataType;
  sheetId: string;
  tabName: string;
  sheetUrl: string;
  lastSynced: string | null;
  rowCount: number | null;
  status: 'idle' | 'synced' | 'stale' | 'error';
  errorMessage?: string;
}

const KEY = 'avis-ml-sources';

export const DATA_TYPE_META: Record<DataType, { label: string; description: string; defaultTab: string; color: string }> = {
  findings:    { label: 'Findings',          description: 'Finding cards, severity, status, resolution steps', defaultTab: 'findings',    color: '#8B5CF6' },
  experiments: { label: 'Experiments',       description: 'Experiment pipeline, hypotheses, metrics, outcomes', defaultTab: 'experiments', color: '#3B82F6' },
  timeline:    { label: 'Timeline phases',   description: 'Engagement phases with start/end dates and status',  defaultTab: 'timeline',    color: '#10B981' },
  milestones:  { label: 'Milestones',        description: 'Key milestones, dates, and completion status',       defaultTab: 'milestones',  color: '#F97316' },
  kpi:         { label: 'KPI metrics',       description: 'Dashboard KPI values, subtexts and trend direction', defaultTab: 'kpi',         color: '#06B6D4' },
};

export function loadSources(): SourceConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function saveSources(sources: SourceConfig[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(sources));
}

export function isStale(source: SourceConfig, maxAgeHours = 6): boolean {
  if (!source.lastSynced || source.status !== 'synced') return false;
  const age = (Date.now() - new Date(source.lastSynced).getTime()) / 3600000;
  return age > maxAgeHours;
}

export function formatLastSynced(isoString: string | null): string {
  if (!isoString) return 'Never';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24)   return `${diffH}h ago`;
  return `${diffD}d ago`;
}

export function generateId() { return 'src-' + Date.now().toString(36); }
