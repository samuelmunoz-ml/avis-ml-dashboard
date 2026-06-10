'use client';
import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, Plus, Trash2, ExternalLink, AlertTriangle,
  CheckCircle, Clock, ChevronDown, ChevronRight, X, Copy,
  Database, Info, Loader2, Key,
} from 'lucide-react';
import {
  SourceConfig, DATA_TYPE_META, loadSources, saveSources,
  isStale, formatLastSynced, generateId,
} from '@/lib/sourceConfig';
import { extractSheetId, SHEET_SCHEMAS } from '@/lib/sheets';
import { useData } from '@/lib/store';
import { DataType } from '@/app/api/sync/route';

const CARD = {
  boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)',
  border: '1px solid rgba(0,15,30,0.05)',
};

const INPUT = 'w-full h-10 px-3.5 rounded-[10px] text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-200 bg-[#F9FAFB]';
const INPUT_STYLE = { border: '1.5px solid #E5E7EB' };

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: SourceConfig['status'] | 'syncing' }) {
  const colors: Record<string, string> = {
    synced: '#22C55E', stale: '#F97316', error: '#F43F5E', idle: '#9CA3AF', syncing: '#3B82F6',
  };
  return (
    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[status] ?? '#9CA3AF' }} />
  );
}

// ─── Schema drawer ────────────────────────────────────────────────────────────

function SchemaDrawer({ dataType }: { dataType: DataType }) {
  const [open, setOpen] = useState(false);
  const schema = SHEET_SCHEMAS[dataType];
  const meta   = DATA_TYPE_META[dataType];
  if (!schema) return null;
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#234474] hover:text-[#000F1E] transition-colors">
        <Info size={12} strokeWidth={2} />
        View required columns
        {open ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
      </button>
      {open && (
        <div className="mt-3 rounded-[12px] p-4" style={{ background: '#F9FAFB', border: '1px solid rgba(0,15,30,0.07)' }}>
          <p className="text-[12px] text-[#6B7280] mb-3 leading-relaxed">{schema.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {schema.columns.map(col => (
              <code key={col} className="text-[11px] font-mono px-2 py-0.5 rounded-[5px]" style={{ background: meta.color + '14', color: meta.color }}>
                {col}
              </code>
            ))}
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-3">
            Copy these into Row 1 of your sheet tab. Each subsequent row is one record.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Add source modal ─────────────────────────────────────────────────────────

function AddSourceModal({
  onAdd, onClose, existingTypes,
}: {
  onAdd: (s: SourceConfig) => void;
  onClose: () => void;
  existingTypes: DataType[];
}) {
  const [dataType, setDataType] = useState<DataType>('findings');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [tabName, setTabName] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; headers?: string[] } | null>(null);

  const meta = DATA_TYPE_META[dataType];

  function autoFillName() {
    if (!name) setName(meta.label);
  }

  function autoFillTab() {
    if (!tabName) setTabName(meta.defaultTab);
  }

  async function handleTest() {
    const sheetId = extractSheetId(url);
    if (!sheetId) { setTestResult({ ok: false, message: 'Invalid Google Sheets URL or ID.' }); return; }
    const tab = tabName || meta.defaultTab;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/sync?sheetId=${sheetId}&tabName=${encodeURIComponent(tab)}`);
      const json = await res.json();
      if (!json.configured) {
        setTestResult({ ok: false, message: 'GOOGLE_SHEETS_API_KEY is not configured on the server. Add it to your Vercel environment variables.' });
      } else if (json.ok) {
        setTestResult({ ok: true, message: `Connected. Found ${json.rowCount} rows.`, headers: json.headers });
      } else {
        setTestResult({ ok: false, message: json.error ?? 'Connection failed.' });
      }
    } catch {
      setTestResult({ ok: false, message: 'Network error. Is the dev server running?' });
    } finally {
      setTesting(false);
    }
  }

  function handleAdd() {
    const sheetId = extractSheetId(url);
    if (!sheetId || !name.trim()) return;
    const source: SourceConfig = {
      id: generateId(),
      name: name.trim(),
      dataType,
      sheetId,
      sheetUrl: url.trim(),
      tabName: tabName.trim() || meta.defaultTab,
      lastSynced: null,
      rowCount: null,
      status: 'idle',
    };
    onAdd(source);
  }

  const sheetId = extractSheetId(url);
  const canAdd = !!sheetId && !!name.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,15,30,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto fade-up"
        style={{ boxShadow: '0 24px 64px rgba(0,15,30,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-0.5">Source sync · Connect</p>
            <h2 className="text-[17px] font-bold text-[#111827] tracking-[-0.01em]">Add data source</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[8px] bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:bg-[#E5E7EB] transition-colors">
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Data type */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-2 tracking-[0.01em]">Data type</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.entries(DATA_TYPE_META) as [DataType, typeof DATA_TYPE_META[DataType]][]).map(([type, m]) => {
                const alreadyConnected = existingTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => { if (!alreadyConnected) { setDataType(type); setName(m.label); setTabName(m.defaultTab); }}}
                    disabled={alreadyConnected}
                    className="p-2.5 rounded-[10px] text-center transition-all"
                    style={{
                      border: dataType === type ? `2px solid ${m.color}` : '1.5px solid #E5E7EB',
                      background: dataType === type ? m.color + '0D' : '#F9FAFB',
                      opacity: alreadyConnected ? 0.4 : 1,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ background: m.color }} />
                    <p className="text-[10.5px] font-semibold text-[#374151] leading-tight">{m.label}</p>
                    {alreadyConnected && <p className="text-[9px] text-[#9CA3AF] mt-0.5">Connected</p>}
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-[#6B7280] mt-2">{meta.description}</p>
          </div>

          {/* Source name */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Source label</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} onFocus={autoFillName}
              placeholder={meta.label} className={INPUT} style={INPUT_STYLE}
              onFocus2={(e: any) => { e.target.style.border='1.5px solid #000F1E'; e.target.style.background='#fff'; }}
              onBlur={(e: any) => { e.target.style.border='1.5px solid #E5E7EB'; e.target.style.background='#F9FAFB'; }}
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1">Used in the admin panel only — not shown to viewers.</p>
          </div>

          {/* Sheet URL */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Google Sheets URL <span className="text-[#F43F5E]">*</span></label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className={INPUT + ' font-mono text-[12.5px]'} style={INPUT_STYLE}
              onFocus={(e: any) => { e.target.style.border='1.5px solid #000F1E'; e.target.style.background='#fff'; }}
              onBlur={(e: any) => { e.target.style.border='1.5px solid #E5E7EB'; e.target.style.background='#F9FAFB'; }}
            />
            {sheetId && (
              <p className="text-[11.5px] text-[#22C55E] mt-1 flex items-center gap-1">
                <CheckCircle size={11} strokeWidth={2} /> Sheet ID: <code className="font-mono">{sheetId.slice(0, 20)}…</code>
              </p>
            )}
          </div>

          {/* Tab name */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Tab name</label>
            <input type="text" value={tabName} onChange={e => setTabName(e.target.value)} onFocus={autoFillTab}
              placeholder={meta.defaultTab} className={INPUT + ' font-mono text-[12.5px]'} style={INPUT_STYLE}
              onFocus2={(e: any) => { e.target.style.border='1.5px solid #000F1E'; e.target.style.background='#fff'; }}
              onBlur={(e: any) => { e.target.style.border='1.5px solid #E5E7EB'; e.target.style.background='#F9FAFB'; }}
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1">The exact name of the sheet tab containing this data.</p>
          </div>

          {/* Column reference */}
          <SchemaDrawer dataType={dataType} />

          {/* Test connection */}
          {testResult && (
            <div className="rounded-[10px] p-3.5" style={{
              background: testResult.ok ? '#F0FDF4' : '#FFF1F2',
              border: `1px solid ${testResult.ok ? '#BBF7D0' : '#FECDD3'}`,
            }}>
              <div className="flex items-start gap-2">
                {testResult.ok
                  ? <CheckCircle size={14} strokeWidth={2} className="text-[#15803D] mt-0.5 flex-shrink-0" />
                  : <AlertTriangle size={14} strokeWidth={2} className="text-[#BE123C] mt-0.5 flex-shrink-0" />
                }
                <div>
                  <p className={`text-[13px] font-semibold ${testResult.ok ? 'text-[#15803D]' : 'text-[#BE123C]'}`}>
                    {testResult.message}
                  </p>
                  {testResult.headers && testResult.headers.length > 0 && (
                    <p className="text-[11.5px] text-[#6B7280] mt-1">
                      Columns detected: <span className="font-mono">{testResult.headers.join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}>
          <button
            onClick={handleTest}
            disabled={!sheetId || testing}
            className="h-9 px-4 rounded-[9px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(0,15,30,0.1)', color: '#374151' }}
          >
            {testing ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <Database size={13} strokeWidth={1.75} />}
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-[9px] text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors" style={{ border: '1px solid rgba(0,15,30,0.1)' }}>
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="h-9 px-5 rounded-[9px] text-[13px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] disabled:opacity-40 transition-colors"
            >
              Add source
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SourceSyncPage() {
  const { data, setData } = useData();
  const [sources, setSources] = useState<SourceConfig[]>([]);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [apiKeyOk, setApiKeyOk] = useState<boolean | null>(null);
  const [expandedSchema, setExpandedSchema] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = loadSources();
    // Mark stale sources
    const updated = s.map(src => ({ ...src, status: (src.status === 'synced' && isStale(src) ? 'stale' : src.status) as SourceConfig['status'] }));
    setSources(updated);
    setMounted(true);

    // Check API key
    fetch('/api/sync').then(r => r.json()).then(j => setApiKeyOk(j.configured ?? false)).catch(() => setApiKeyOk(false));
  }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  function persistSources(updated: SourceConfig[]) {
    setSources(updated);
    saveSources(updated);
  }

  async function syncSource(source: SourceConfig) {
    setSyncing(prev => ({ ...prev, [source.id]: true }));
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: source.sheetId, tabName: source.tabName, dataType: source.dataType }),
      });
      const json = await res.json();

      if (!json.ok) {
        persistSources(sources.map(s => s.id === source.id
          ? { ...s, status: 'error', errorMessage: json.error }
          : s
        ));
        showToast(`Sync failed: ${json.error}`);
        return;
      }

      // Apply synced data to the store
      const newData = { ...data };
      if (source.dataType === 'findings')    newData.findings        = json.data;
      if (source.dataType === 'experiments') newData.experiments     = json.data;
      if (source.dataType === 'timeline')    newData.timelinePhases  = json.data;
      if (source.dataType === 'milestones')  newData.milestones      = json.data;
      setData(newData);

      persistSources(sources.map(s => s.id === source.id
        ? { ...s, status: 'synced', lastSynced: json.syncedAt, rowCount: json.rowCount, errorMessage: undefined }
        : s
      ));
      showToast(`${DATA_TYPE_META[source.dataType].label} synced — ${json.rowCount} rows loaded.`);
    } catch {
      persistSources(sources.map(s => s.id === source.id ? { ...s, status: 'error', errorMessage: 'Network error' } : s));
      showToast('Network error. Check your connection.');
    } finally {
      setSyncing(prev => ({ ...prev, [source.id]: false }));
    }
  }

  function syncAll() { sources.forEach(s => syncSource(s)); }

  function removeSource(id: string) {
    if (!confirm('Remove this data source? The data already loaded will remain until you refresh.')) return;
    const updated = sources.filter(s => s.id !== id);
    persistSources(updated);
  }

  function addSource(source: SourceConfig) {
    const updated = [...sources, source];
    persistSources(updated);
    setShowAddModal(false);
    showToast(`"${source.name}" connected. Click Sync to load data.`);
  }

  if (!mounted) return null;

  const existingTypes = sources.map(s => s.dataType);
  const allSynced = sources.length > 0 && sources.every(s => s.status === 'synced');
  const anyStale  = sources.some(s => s.status === 'stale');
  const anyError  = sources.some(s => s.status === 'error');

  return (
    <div className="p-8 max-w-[840px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-7 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Admin · Data</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Source sync</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">Connect Google Sheets as live data sources for the dashboard.</p>
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          {sources.length > 0 && (
            <button
              onClick={syncAll}
              disabled={Object.values(syncing).some(Boolean)}
              className="h-10 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#F3F4F6] disabled:opacity-50"
              style={{ border: '1px solid rgba(0,15,30,0.1)', color: '#374151' }}
            >
              <RefreshCw size={13} strokeWidth={2} className={Object.values(syncing).some(Boolean) ? 'animate-spin' : ''} />
              Sync all
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-5 rounded-[10px] text-[13px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] transition-colors flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={2.5} /> Add source
          </button>
        </div>
      </div>

      {/* API key banner */}
      {apiKeyOk === false && (
        <div className="mb-6 rounded-[14px] p-5 fade-up" style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
          <div className="flex items-start gap-3">
            <Key size={16} strokeWidth={1.75} className="text-[#D97706] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-bold text-[#92400E] mb-1">Google Sheets API key not configured</p>
              <p className="text-[13px] text-[#B45309] leading-relaxed mb-3">
                Syncing requires a <code className="font-mono bg-[#FEF3C7] px-1 rounded">GOOGLE_SHEETS_API_KEY</code> environment variable on your server.
              </p>
              <ol className="text-[12.5px] text-[#92400E] space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline">console.cloud.google.com</a> → APIs &amp; Services → Credentials</li>
                <li>Create an API key → restrict it to <strong>Google Sheets API</strong></li>
                <li>Add it to Vercel: <strong>Settings → Environment Variables → <code className="font-mono">GOOGLE_SHEETS_API_KEY</code></strong></li>
                <li>Redeploy (or run locally with <code className="font-mono">.env.local</code>)</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Setup guide when no sources */}
      {sources.length === 0 && (
        <div className="mb-6 rounded-[14px] p-6 fade-up" style={{ background: '#F9FAFB', border: '1.5px dashed #E5E7EB' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.08)' }}>
              <Database size={18} strokeWidth={1.5} className="text-[#6B7280]" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#111827] mb-1">Connect your first data source</p>
              <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4">
                Each source is a Google Sheets tab. You can connect up to 5 sources — one per data type (findings, experiments, timeline, milestones, KPIs). Once connected, click <strong>Sync</strong> to pull live data into the dashboard.
              </p>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {(Object.entries(DATA_TYPE_META) as [DataType, typeof DATA_TYPE_META[DataType]][]).map(([type, m]) => (
                  <div key={type} className="rounded-[10px] p-3 text-center" style={{ background: m.color + '0D', border: `1px solid ${m.color}33` }}>
                    <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ background: m.color }} />
                    <p className="text-[11px] font-semibold" style={{ color: m.color }}>{m.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="h-9 px-5 rounded-[9px] text-[13px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] transition-colors flex items-center gap-1.5"
              >
                <Plus size={13} strokeWidth={2.5} /> Connect first source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sources list */}
      {sources.length > 0 && (
        <div className="space-y-3 mb-6 fade-up fade-up-1">
          {sources.map(source => {
            const isSyncing  = syncing[source.id] ?? false;
            const meta       = DATA_TYPE_META[source.dataType];
            const statusKey  = isSyncing ? 'syncing' : source.status;

            const statusLabel: Record<string, string> = {
              syncing:   'Syncing…',
              synced:    `Synced ${formatLastSynced(source.lastSynced)}`,
              stale:     `Stale — last synced ${formatLastSynced(source.lastSynced)}`,
              error:     source.errorMessage ?? 'Error',
              idle:      'Not yet synced',
            };
            const statusColor: Record<string, string> = {
              syncing: '#1D4ED8', synced: '#15803D', stale: '#C2410C', error: '#BE123C', idle: '#9CA3AF',
            };

            return (
              <div
                key={source.id}
                className="bg-white rounded-[14px] overflow-hidden transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)]"
                style={{ ...CARD, borderLeft: `3px solid ${meta.color}` }}
              >
                {/* Progress bar */}
                {isSyncing && (
                  <div className="h-0.5 w-full overflow-hidden">
                    <div className="h-full w-1/3 rounded animate-pulse" style={{ background: meta.color, animation: 'shimmer 1.5s infinite' }} />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Name + type */}
                      <div className="flex items-center gap-2 mb-1">
                        <StatusDot status={statusKey} />
                        <span className="text-[15px] font-bold text-[#111827]">{source.name}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: meta.color + '14', color: meta.color }}>
                          {meta.label}
                        </span>
                        {source.rowCount !== null && (
                          <span className="text-[11px] text-[#9CA3AF] font-medium">{source.rowCount} rows</span>
                        )}
                      </div>

                      {/* Sheet info */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <code className="text-[12px] font-mono text-[#6B7280] truncate max-w-[320px]">{source.sheetUrl || source.sheetId}</code>
                        <span className="text-[#D1D5DB]">·</span>
                        <code className="text-[12px] font-mono text-[#6B7280]">{source.tabName}</code>
                        <a href={source.sheetUrl} target="_blank" rel="noreferrer" className="text-[#9CA3AF] hover:text-[#234474] transition-colors ml-0.5">
                          <ExternalLink size={11} strokeWidth={1.75} />
                        </a>
                      </div>

                      {/* Status */}
                      <p className="text-[12px] font-medium" style={{ color: statusColor[statusKey] ?? '#9CA3AF' }}>
                        {statusLabel[statusKey]}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => removeSource(source.id)}
                        className="w-8 h-8 rounded-[8px] bg-[#F9FAFB] flex items-center justify-center text-[#9CA3AF] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-all"
                        style={{ border: '1px solid rgba(0,15,30,0.07)' }}
                        title="Remove source"
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => syncSource(source)}
                        disabled={isSyncing}
                        className="h-8 px-4 rounded-[8px] text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        style={{
                          background: source.status === 'error' ? '#FFF1F2' : '#F3F4F6',
                          color: source.status === 'error' ? '#BE123C' : '#374151',
                          border: source.status === 'error' ? '1px solid #FECDD3' : '1px solid rgba(0,15,30,0.08)',
                        }}
                      >
                        <RefreshCw size={12} strokeWidth={2} className={isSyncing ? 'animate-spin' : ''} />
                        {source.status === 'error' ? 'Retry' : isSyncing ? 'Syncing…' : 'Sync now'}
                      </button>
                    </div>
                  </div>

                  {/* Schema reference inline */}
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,15,30,0.05)' }}>
                    <SchemaDrawer dataType={source.dataType} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sheets template guide */}
      <div className="bg-white rounded-[14px] p-6 fade-up fade-up-2" style={CARD}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
            <Info size={16} strokeWidth={1.75} className="text-[#15803D]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#111827]">Google Sheets template</p>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Create one sheet per data type, with these exact column headers in row 1.
              Share each sheet as <strong>"Anyone with the link can view"</strong>.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(Object.entries(SHEET_SCHEMAS) as [DataType, typeof SHEET_SCHEMAS[string]][]).map(([type, schema]) => {
            const meta = DATA_TYPE_META[type];
            const isOpen = expandedSchema === type;
            return (
              <div key={type} className="rounded-[12px] overflow-hidden" style={{ border: '1px solid rgba(0,15,30,0.06)' }}>
                <button
                  onClick={() => setExpandedSchema(isOpen ? null : type)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAFA] hover:bg-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                    <span className="text-[13.5px] font-semibold text-[#111827]">{meta.label}</span>
                    <span className="text-[11.5px] text-[#9CA3AF]">{schema.description}</span>
                  </div>
                  {isOpen ? <ChevronDown size={14} strokeWidth={2} className="text-[#6B7280]" /> : <ChevronRight size={14} strokeWidth={2} className="text-[#9CA3AF]" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-3">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {schema.columns.map(col => (
                        <code key={col} className="text-[11px] font-mono px-2 py-0.5 rounded-[5px]"
                          style={{ background: meta.color + '12', color: meta.color }}>
                          {col}
                        </code>
                      ))}
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(schema.columns.join('\t')); showToast('Column headers copied — paste into Row 1 of your sheet.'); }}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#234474] hover:text-[#000F1E] transition-colors"
                    >
                      <Copy size={11} strokeWidth={2} /> Copy headers (tab-separated, ready to paste into sheets)
                    </button>

                    {type === 'kpi' && (
                      <div className="mt-3 p-3 rounded-[8px]" style={{ background: '#F9FAFB', border: '1px solid rgba(0,15,30,0.06)' }}>
                        <p className="text-[11.5px] font-bold text-[#374151] mb-1.5">Example rows for the kpi tab:</p>
                        <table className="w-full text-[11px] font-mono">
                          <thead><tr className="text-[#9CA3AF]">{['metric','value','subtext','trend'].map(h=><th key={h} className="text-left pb-1 pr-4">{h}</th>)}</tr></thead>
                          <tbody className="text-[#374151]">
                            {[
                              ['findings','14','↑ 3 since last week','up'],
                              ['experiments','6','2 completed this week','neutral'],
                              ['anomalyRate','9.7%','↓ Highest since cutover','down'],
                              ['resolved','5','✓ 2 resolved this week','up'],
                            ].map(r=>(
                              <tr key={r[0]}>{r.map((c,i)=><td key={i} className="pr-4 py-0.5">{c}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add source modal */}
      {showAddModal && (
        <AddSourceModal
          onAdd={addSource}
          onClose={() => setShowAddModal(false)}
          existingTypes={existingTypes}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#000F1E] text-white px-5 py-3 rounded-[12px] text-[13.5px] font-semibold shadow-lg z-50 fade-up max-w-md text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
