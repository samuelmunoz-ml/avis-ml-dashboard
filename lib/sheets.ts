import {
  Finding, Experiment, TimelinePhase, Milestone, Severity,
  FindingStatus, ExperimentStatus, ResolutionStep, ExperimentMetric,
} from './types';

// ─── Column schemas (for the setup guide) ─────────────────────────────────────

export const SHEET_SCHEMAS: Record<string, { columns: string[]; description: string }> = {
  findings: {
    description: 'One row per finding. Row 1 must be the header row.',
    columns: [
      'id', 'title', 'description', 'site', 'severity', 'status', 'category',
      'addedBy', 'dateAdded', 'isPinned', 'relatedFindingIds',
      'step1Title', 'step1Description', 'step1Status', 'step1CompletedDate',
      'step2Title', 'step2Description', 'step2Status', 'step2CompletedDate',
      'step3Title', 'step3Description', 'step3Status', 'step3CompletedDate',
      'step4Title', 'step4Description', 'step4Status', 'step4CompletedDate',
    ],
  },
  experiments: {
    description: 'One row per experiment. Row 1 must be the header row.',
    columns: [
      'id', 'title', 'status', 'owner', 'lastUpdated', 'startDate',
      'site', 'category', 'severity', 'addedBy',
      'hypothesis', 'approach', 'outcome', 'outcomeStatus', 'relatedFindingIds',
      'metric1Label', 'metric1Value', 'metric1Subtext',
      'metric2Label', 'metric2Value', 'metric2Subtext',
      'metric3Label', 'metric3Value', 'metric3Subtext',
    ],
  },
  timeline: {
    description: 'One row per engagement phase.',
    columns: ['id', 'name', 'startDate', 'endDate', 'color', 'status'],
  },
  milestones: {
    description: 'One row per milestone.',
    columns: ['id', 'title', 'date', 'status', 'description', 'isHighlighted'],
  },
  kpi: {
    description: 'One row per KPI metric. Use the exact metric keys listed.',
    columns: ['metric', 'value', 'subtext', 'trend'],
  },
};

export const KPI_METRIC_KEYS = ['findings', 'experiments', 'anomalyRate', 'resolved'] as const;

// ─── Sheets API fetch ─────────────────────────────────────────────────────────

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export async function fetchSheetValues(
  spreadsheetId: string,
  tabName: string,
  apiKey: string,
): Promise<string[][]> {
  const range = encodeURIComponent(`${tabName}!A:ZZ`);
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 403) throw new Error(`Permission denied — make sure the sheet is shared as "Anyone with the link can view". Details: ${msg}`);
    if (res.status === 400) throw new Error(`Bad request — check the sheet ID and tab name. Details: ${msg}`);
    if (res.status === 404) throw new Error(`Sheet not found — check the sheet ID. Details: ${msg}`);
    throw new Error(msg);
  }

  const data = await res.json();
  return (data.values as string[][] | undefined) ?? [];
}

export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const [headers, ...dataRows] = rows;
  return dataRows
    .filter(row => row.some(cell => cell?.trim()))
    .map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h.trim()] = (row[i] ?? '').trim(); });
      return obj;
    });
}

export function extractSheetId(input: string): string | null {
  // Accepts full URL or bare sheet ID
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Bare ID (no slashes)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim();
  return null;
}

// ─── Data parsers ─────────────────────────────────────────────────────────────

export function parseFindings(rows: Record<string, string>[]): Finding[] {
  return rows
    .filter(r => r.title?.trim())
    .map((row, i) => ({
      id: row.id?.trim() || `f-${Date.now()}-${i}`,
      title: row.title ?? '',
      description: row.description ?? '',
      site: row.site ?? '',
      severity: (row.severity as Severity) || 'Medium',
      status: (row.status as FindingStatus) || 'Reported',
      category: row.category ?? '',
      addedBy: row.addedBy ?? '',
      dateAdded: row.dateAdded ?? '',
      lastUpdated: row.lastUpdated || row.dateAdded || '',
      images: [],
      isPinned: row.isPinned?.toLowerCase() === 'true',
      relatedFindingIds: splitComma(row.relatedFindingIds),
      resolutionSteps: parseSteps(row),
    }));
}

function parseSteps(row: Record<string, string>): ResolutionStep[] {
  const steps: ResolutionStep[] = [];
  for (let n = 1; n <= 4; n++) {
    const title = row[`step${n}Title`]?.trim();
    if (!title) break;
    steps.push({
      id: `rs-${n}-${Date.now()}`,
      stepNumber: n,
      title,
      description: row[`step${n}Description`]?.trim() ?? '',
      status: (['completed','in_progress','pending'].includes(row[`step${n}Status`])
        ? row[`step${n}Status`]
        : 'pending') as ResolutionStep['status'],
      completedDate: row[`step${n}CompletedDate`]?.trim() || undefined,
    });
  }
  return steps;
}

export function parseExperiments(rows: Record<string, string>[]): Experiment[] {
  return rows
    .filter(r => r.title?.trim())
    .map((row, i) => ({
      id: row.id?.trim() || `e-${Date.now()}-${i}`,
      title: row.title ?? '',
      status: (row.status as ExperimentStatus) || 'Planning',
      owner: row.owner ?? '',
      lastUpdated: row.lastUpdated ?? '',
      startDate: row.startDate ?? '',
      site: row.site ?? '',
      category: row.category ?? '',
      severity: row.severity ?? '',
      addedBy: row.addedBy ?? '',
      hypothesis: row.hypothesis ?? '',
      approach: row.approach ?? '',
      outcome: row.outcome ?? '',
      outcomeStatus: (['Pending','Confirmed','Failed'].includes(row.outcomeStatus)
        ? row.outcomeStatus : 'Pending') as Experiment['outcomeStatus'],
      relatedFindingIds: splitComma(row.relatedFindingIds),
      metrics: parseMetrics(row),
    }));
}

function parseMetrics(row: Record<string, string>): ExperimentMetric[] {
  const metrics: ExperimentMetric[] = [];
  for (let n = 1; n <= 3; n++) {
    const label = row[`metric${n}Label`]?.trim();
    if (!label) break;
    metrics.push({
      label,
      value: row[`metric${n}Value`]?.trim() ?? '',
      subtext: row[`metric${n}Subtext`]?.trim() || undefined,
    });
  }
  return metrics;
}

export function parseTimelinePhases(rows: Record<string, string>[]): TimelinePhase[] {
  return rows
    .filter(r => r.name?.trim())
    .map((row, i) => ({
      id: row.id?.trim() || `tp-${i + 1}`,
      name: row.name ?? '',
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      color: row.color ?? '#6B7280',
      status: (['completed','in_progress','upcoming'].includes(row.status)
        ? row.status : 'upcoming') as TimelinePhase['status'],
    }));
}

export function parseMilestones(rows: Record<string, string>[]): Milestone[] {
  return rows
    .filter(r => r.title?.trim())
    .map((row, i) => ({
      id: row.id?.trim() || `m-${i + 1}`,
      title: row.title ?? '',
      date: row.date ?? '',
      status: (['Complete','In Progress','Upcoming'].includes(row.status)
        ? row.status : 'Upcoming') as Milestone['status'],
      description: row.description ?? '',
      isHighlighted: row.isHighlighted?.toLowerCase() === 'true',
    }));
}

export function parseKpi(rows: Record<string, string>[]): Record<string, { value: string; subtext: string; trend: string }> {
  const result: Record<string, { value: string; subtext: string; trend: string }> = {};
  rows.filter(r => r.metric?.trim()).forEach(row => {
    result[row.metric.trim()] = {
      value:   row.value ?? '',
      subtext: row.subtext ?? '',
      trend:   row.trend ?? 'neutral',
    };
  });
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitComma(val: string | undefined): string[] {
  if (!val?.trim()) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}
