'use client';
import { useState } from 'react';

type Source = { id: string; name: string; file: string; rows: number | null; status: string; lastSync: string | null };
const SOURCES: Source[] = [
  { id: 's-1', name: 'Experiments pipeline', file: 'experiments-tracker.gsheet', rows: 18, status: 'synced', lastSync: 'Today 8:14 am' },
  { id: 's-2', name: 'KPI metrics', file: 'ml-kpi-dashboard.gsheet', rows: 6, status: 'synced', lastSync: 'Today 8:14 am' },
  { id: 's-3', name: 'Anomaly data', file: 'anomaly-tracking.gsheet', rows: 142, status: 'stale', lastSync: 'Jun 28 — 3 days ago' },
  { id: 's-4', name: 'Timeline milestones', file: 'engagement-timeline.gsheet', rows: null, status: 'error', lastSync: null },
];

export default function SourceSyncPage() {
  const [sources, setSources] = useState(SOURCES);
  const [syncing, setSyncing] = useState<string[]>([]);

  function syncSource(id: string) {
    if (SOURCES.find(s => s.id === id)?.status === 'error') return;
    setSyncing((prev) => [...prev, id]);
    setTimeout(() => {
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: 'synced', lastSync: 'Just now' } : s));
      setSyncing((prev) => prev.filter((s) => s !== id));
    }, 2000);
  }

  function syncAll() {
    sources.filter(s => s.status !== 'error').forEach(s => syncSource(s.id));
  }

  return (
    <div className="p-8 max-w-[700px]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#000F1E]">Source sync</h1>
          <p className="text-sm text-[#939598] mt-1">Connected Google Sheets. Sync manually or wait for auto-sync every 6 hours.</p>
        </div>
        <button
          onClick={syncAll}
          className="h-11 px-5 bg-[#000F1E] text-white text-sm font-medium rounded-[4px] hover:bg-[#0D1E35] transition-colors"
        >
          Sync all
        </button>
      </div>

      <div className="space-y-4">
        {sources.map((source) => {
          const isSyncing = syncing.includes(source.id);
          return (
            <div
              key={source.id}
              className={`border rounded-lg p-5 bg-white transition-colors ${
                source.status === 'error' ? 'border-[#FFCDD2]' : source.status === 'stale' ? 'border-[#FFE0B2]' : 'border-[#DAD9D6]'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isSyncing ? 'bg-[#1565C0] animate-pulse' :
                      source.status === 'synced' ? 'bg-[#2E7D32]' :
                      source.status === 'stale' ? 'bg-[#E65100]' :
                      'bg-[#C62828]'
                    }`} />
                    <p className={`text-[15px] font-semibold ${source.status === 'error' ? 'text-[#C62828]' : 'text-[#000F1E]'}`}>
                      {source.name}
                    </p>
                  </div>
                  <p className="text-[13px] text-[#939598]">
                    {source.file}{source.rows ? ` · ${source.rows} rows` : ''}
                  </p>
                  {isSyncing && <p className="text-[12px] text-[#1565C0] mt-0.5">Syncing now...</p>}
                  {!isSyncing && source.status === 'synced' && (
                    <p className="text-[12px] text-[#2E7D32] mt-0.5">✓ Synced · {source.lastSync}</p>
                  )}
                  {!isSyncing && source.status === 'stale' && (
                    <p className="text-[12px] text-[#E65100] mt-0.5">⚠ Stale · Last synced {source.lastSync}</p>
                  )}
                  {source.status === 'error' && (
                    <p className="text-[12px] text-[#C62828] mt-0.5">✗ Error · Permissions revoked — re-connect required</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {source.status === 'error' ? (
                    <button className="h-9 px-4 border border-[#C62828] text-[#C62828] text-sm font-medium rounded-[4px] hover:bg-[#FFEBEE] transition-colors">
                      Reconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => syncSource(source.id)}
                      disabled={isSyncing}
                      className="h-9 px-4 border border-[#DAD9D6] text-[#000F1E] text-sm font-medium rounded-[4px] hover:bg-[#F7F7F6] disabled:opacity-50 transition-colors"
                    >
                      {isSyncing ? 'Syncing...' : '↻ Sync'}
                    </button>
                  )}
                  <button className="w-9 h-9 border border-[#DAD9D6] rounded-[4px] flex items-center justify-center text-[#939598] hover:bg-[#F7F7F6] text-sm transition-colors">↗</button>
                </div>
              </div>
              {isSyncing && (
                <div className="mt-3 h-1.5 bg-[#EFF0F0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#234474] rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 border border-[#DAD9D6] rounded-lg p-5 bg-white">
        <h3 className="text-[15px] font-semibold text-[#000F1E] mb-1.5">Add new source</h3>
        <p className="text-[13px] text-[#939598] mb-4">Paste a Google Sheets URL to connect a new data source.</p>
        <div>
          <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Title <span className="text-[#C62828]">*</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Google Sheets URL or title"
              className="flex-1 h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] placeholder:text-[#B7B8B9] outline-none focus:border-[#000F1E]"
            />
            <button className="h-[42px] px-5 border border-[#DAD9D6] text-[#000F1E] text-sm font-medium rounded-[4px] hover:bg-[#F7F7F6] transition-colors">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
