import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSheetValues, rowsToObjects,
  parseFindings, parseExperiments, parseTimelinePhases, parseMilestones, parseKpi,
} from '@/lib/sheets';

export type DataType = 'findings' | 'experiments' | 'timeline' | 'milestones' | 'kpi';

export interface SyncRequest {
  sheetId: string;
  tabName: string;
  dataType: DataType;
}

export interface SyncResponse {
  ok: true;
  dataType: DataType;
  rowCount: number;
  data: unknown;
  syncedAt: string;
}

export interface SyncError {
  ok: false;
  error: string;
}

const PARSERS: Record<DataType, (rows: Record<string, string>[]) => unknown> = {
  findings:    parseFindings,
  experiments: parseExperiments,
  timeline:    parseTimelinePhases,
  milestones:  parseMilestones,
  kpi:         parseKpi,
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    return NextResponse.json<SyncError>(
      { ok: false, error: 'GOOGLE_SHEETS_API_KEY is not configured. Add it to your environment variables.' },
      { status: 500 },
    );
  }

  let body: SyncRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<SyncError>({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { sheetId, tabName, dataType } = body;
  if (!sheetId || !tabName || !dataType) {
    return NextResponse.json<SyncError>(
      { ok: false, error: 'sheetId, tabName, and dataType are all required.' },
      { status: 400 },
    );
  }

  const parser = PARSERS[dataType];
  if (!parser) {
    return NextResponse.json<SyncError>(
      { ok: false, error: `Unknown dataType "${dataType}". Valid values: ${Object.keys(PARSERS).join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const rawRows = await fetchSheetValues(sheetId, tabName, apiKey);
    const objects = rowsToObjects(rawRows);
    const parsed = parser(objects);
    const rowCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed as object).length;

    return NextResponse.json<SyncResponse>({
      ok: true,
      dataType,
      rowCount,
      data: parsed,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json<SyncError>({ ok: false, error: message }, { status: 502 });
  }
}

// Test connectivity without full parse — just checks the API key and sheet access
export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, configured: false, error: 'GOOGLE_SHEETS_API_KEY not set.' });
  }

  const sheetId  = request.nextUrl.searchParams.get('sheetId');
  const tabName  = request.nextUrl.searchParams.get('tabName') ?? 'Sheet1';

  if (!sheetId) {
    return NextResponse.json({ ok: true, configured: true, message: 'API key is configured.' });
  }

  try {
    const rows = await fetchSheetValues(sheetId, tabName, apiKey);
    const headers = rows[0] ?? [];
    return NextResponse.json({ ok: true, configured: true, headers, rowCount: Math.max(0, rows.length - 1) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, configured: true, error: message }, { status: 502 });
  }
}
