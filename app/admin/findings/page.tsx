'use client';
import { useState, useRef, useCallback } from 'react';
import { useData } from '@/lib/store';
import { Finding, FindingStatus, Severity } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { Pin, Pencil, Trash2, Upload, X, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const STATUSES: FindingStatus[] = ['Reported', 'Acknowledged', 'Fix in progress', 'Resolved'];
const SEVERITIES: Severity[] = ['High', 'Medium', 'Low'];
const SITES = ['avis.com', 'budget.com', 'payless.com'];

const CARD_STYLE = {
  boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)',
  border: '1px solid rgba(0,15,30,0.05)',
};

const INPUT_BASE = 'w-full h-10 px-3.5 rounded-[10px] text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-200 bg-[#F9FAFB]';
const INPUT_STYLE = { border: '1.5px solid #E5E7EB' };

function generateId() {
  return 'f-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function AdminFindingsPage() {
  const { data, setData } = useData();
  const [tab, setTab] = useState<'add' | 'all'>('add');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [site, setSite] = useState('avis.com');
  const [severity, setSeverity] = useState<Severity>('High');
  const [status, setStatus] = useState<FindingStatus>('Reported');
  const [images, setImages] = useState<string[]>([]);
  const [steps, setSteps] = useState([{ title: '', description: '' }]);
  const [toast, setToast] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function processFiles(files: FileList) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => setImages((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
    if (item) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setImages((prev) => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(file);
      }
    }
  }, []);

  function handleSave() {
    if (!title.trim() || !description.trim()) { showToast('Title and description are required.'); return; }
    const newFinding: Finding = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      site, severity, status,
      category: 'Manual entry',
      addedBy: 'Admin',
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUpdated: 'Just now',
      images,
      isPinned: false,
      relatedFindingIds: [],
      resolutionSteps: steps.filter((s) => s.title.trim()).map((s, i) => ({
        id: generateId(), stepNumber: i + 1,
        title: s.title.trim(), description: s.description.trim(), status: 'pending',
      })),
    };
    setData({ ...data, findings: [newFinding, ...data.findings] });
    setTitle(''); setDescription(''); setSite('avis.com'); setSeverity('High');
    setStatus('Reported'); setImages([]); setSteps([{ title: '', description: '' }]);
    showToast('Finding saved.');
  }

  function togglePin(id: string) {
    setData({ ...data, findings: data.findings.map((f) => f.id === id ? { ...f, isPinned: !f.isPinned } : f) });
  }

  function deleteFinding(id: string) {
    if (!confirm('Delete this finding?')) return;
    setData({ ...data, findings: data.findings.filter((f) => f.id !== id) });
  }

  const syncSources = [
    { name: 'Experiments pipeline', detail: 'experiments-tracker.gsheet · 18 rows', status: 'synced' },
    { name: 'KPI metrics',          detail: 'ml-kpi-dashboard.gsheet · 6 rows',     status: 'syncing' },
    { name: 'Anomaly data',         detail: 'anomaly-tracking.gsheet · 142 rows',   status: 'stale' },
    { name: 'Timeline milestones',  detail: 'engagement-timeline.gsheet',           status: 'error' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 fade-up">
        <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Admin · Content</p>
        <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Findings</h1>
        <p className="text-[13px] text-[#9CA3AF] mt-0.5">Add, edit, and pin findings. Pinned findings appear on the main dashboard widget.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-7 bg-white rounded-[12px] p-1 w-fit fade-up fade-up-1" style={CARD_STYLE}>
        {[
          { key: 'add', label: '+ Add finding' },
          { key: 'all', label: `All findings (${data.findings.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'add' | 'all')}
            className={`px-4 h-8 rounded-[8px] text-[13px] font-medium transition-all ${
              tab === t.key ? 'bg-[#000F1E] text-white' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'add' && (
        <div className="flex gap-6 fade-up fade-up-2">
          {/* Form */}
          <div className="flex-1 max-w-[560px]">
            <div className="bg-white rounded-[14px] p-6" style={CARD_STYLE} onPaste={handlePaste}>
              <h2 className="text-[17px] font-bold text-[#111827] tracking-[-0.01em] mb-5">Create new finding</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Title <span className="text-[#F43F5E]">*</span></label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Finding title" className={INPUT_BASE} style={INPUT_STYLE}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.boxShadow = '0 0 0 3px rgba(0,15,30,0.06)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Description <span className="text-[#F43F5E]">*</span></label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the finding in 1–3 sentences" rows={3}
                    className="w-full px-3.5 py-2.5 rounded-[10px] text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none resize-none transition-all duration-200 bg-[#F9FAFB]"
                    style={INPUT_STYLE}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.boxShadow = '0 0 0 3px rgba(0,15,30,0.06)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Site / area</label>
                    <select value={site} onChange={(e) => setSite(e.target.value)}
                      className={INPUT_BASE + ' bg-[#F9FAFB]'} style={INPUT_STYLE}>
                      {SITES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Severity</label>
                    <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}
                      className={INPUT_BASE + ' bg-[#F9FAFB]'} style={INPUT_STYLE}>
                      {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Status picker */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-2 tracking-[0.01em]">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button key={s} onClick={() => setStatus(s)}
                        className={`transition-all duration-200 rounded-full ${status === s ? 'ring-2 ring-offset-1 ring-[#000F1E]' : ''}`}>
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => e.target.files && processFiles(e.target.files)} />
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-[12px] p-6 text-center cursor-pointer transition-all duration-200 ${
                      isDragging ? 'bg-[#EFF6FF]' : 'bg-[#F9FAFB] hover:bg-[#F3F4F6]'
                    }`}
                    style={{ border: isDragging ? '2px dashed #3B82F6' : '2px dashed #E5E7EB' }}
                  >
                    <div className="w-9 h-9 rounded-[10px] bg-white flex items-center justify-center mx-auto mb-2.5" style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.1)' }}>
                      <Upload size={16} strokeWidth={1.75} className="text-[#6B7280]" />
                    </div>
                    <p className="text-[13.5px] font-medium text-[#374151] mb-0.5">Drag and drop photos here</p>
                    <p className="text-[12px] text-[#9CA3AF] mb-3">or click to browse · ⌘V to paste</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="h-8 px-4 rounded-[8px] text-[12.5px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] transition-colors"
                    >
                      Choose photos
                    </button>
                  </div>
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt="" className="w-14 h-14 object-cover rounded-[8px]" style={{ border: '1px solid rgba(0,15,30,0.08)' }} />
                          <button
                            onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#BE123C] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resolution steps */}
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827] mb-0.5">Resolution path</h3>
                  <p className="text-[12.5px] text-[#9CA3AF] mb-4">Steps to resolution — current status tracked below</p>
                  <div className="space-y-0">
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center pt-0.5">
                          <div className="w-5 h-5 rounded-full bg-white border-2 border-[#E5E7EB] flex-shrink-0" />
                          {i < steps.length - 1 && <div className="w-px flex-1 bg-[#E5E7EB] my-1.5" style={{ minHeight: '20px' }} />}
                        </div>
                        <div className="flex-1 pb-4 space-y-2">
                          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em]">Step {i + 1}</p>
                          <input type="text" value={step.title}
                            onChange={(e) => setSteps((prev) => prev.map((s, j) => j === i ? { ...s, title: e.target.value } : s))}
                            placeholder="Step title"
                            className="w-full h-9 px-3 rounded-[8px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] outline-none bg-[#F9FAFB] transition-all"
                            style={{ border: '1.5px solid #E5E7EB' }}
                            onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.background = '#fff'; }}
                            onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                          />
                          <input type="text" value={step.description}
                            onChange={(e) => setSteps((prev) => prev.map((s, j) => j === i ? { ...s, description: e.target.value } : s))}
                            placeholder="Description"
                            className="w-full h-9 px-3 rounded-[8px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] outline-none bg-[#F9FAFB] transition-all"
                            style={{ border: '1.5px solid #E5E7EB' }}
                            onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.background = '#fff'; }}
                            onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setSteps((prev) => [...prev, { title: '', description: '' }])}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-[#234474] hover:text-[#000F1E] transition-colors"
                  >
                    <Plus size={13} strokeWidth={2.5} /> Add step
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 mt-6 pt-5" style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}>
                <button
                  onClick={() => { setTitle(''); setDescription(''); setImages([]); setSteps([{ title: '', description: '' }]); }}
                  className="h-10 px-5 rounded-[10px] text-[13.5px] font-semibold text-[#374151] transition-colors hover:bg-[#F3F4F6]"
                  style={{ border: '1px solid rgba(0,15,30,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="h-10 px-5 rounded-[10px] text-[13.5px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] transition-colors"
                >
                  Save finding
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Recent findings */}
            <div className="bg-white rounded-[14px] p-5" style={CARD_STYLE}>
              <p className="text-[11.5px] font-bold text-[#374151] uppercase tracking-[0.06em] mb-4">Recent findings</p>
              <div className="space-y-3">
                {data.findings.slice(0, 3).map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-2 pb-3" style={{ borderBottom: '1px solid rgba(0,15,30,0.05)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#111827] mb-0.5 leading-snug line-clamp-1">{f.title}</p>
                      <p className="text-[11.5px] text-[#9CA3AF]">{f.site} · {f.dateAdded}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => togglePin(f.id)} title={f.isPinned ? 'Unpin' : 'Pin'}
                        className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-all ${f.isPinned ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#F9FAFB] text-[#9CA3AF] hover:text-[#C2410C]'}`}
                        style={{ border: f.isPinned ? '1px solid #FED7AA' : '1px solid rgba(0,15,30,0.07)' }}>
                        <Pin size={11} strokeWidth={2} />
                      </button>
                      <button onClick={() => deleteFinding(f.id)}
                        className="w-7 h-7 rounded-[6px] bg-[#F9FAFB] flex items-center justify-center text-[#9CA3AF] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-all"
                        style={{ border: '1px solid rgba(0,15,30,0.07)' }}>
                        <Trash2 size={11} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source sync */}
            <div className="bg-white rounded-[14px] p-5" style={CARD_STYLE}>
              <p className="text-[11.5px] font-bold text-[#374151] uppercase tracking-[0.06em] mb-1">Source sync</p>
              <p className="text-[12px] text-[#9CA3AF] mb-4">Google Sheets · auto-syncs every 6 hours</p>
              <div className="space-y-3">
                {syncSources.map((source) => {
                  const Icon = source.status === 'error' ? AlertTriangle
                    : source.status === 'synced' ? CheckCircle
                    : source.status === 'syncing' ? RefreshCw
                    : Clock;
                  const iconColor = source.status === 'error' ? '#BE123C' : source.status === 'synced' ? '#15803D' : source.status === 'syncing' ? '#1D4ED8' : '#C2410C';
                  const btnLabel = source.status === 'error' ? 'Reconnect' : source.status === 'syncing' ? 'Syncing…' : 'Sync';

                  return (
                    <div key={source.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <Icon size={13} strokeWidth={1.75} className={`mt-0.5 flex-shrink-0 ${source.status === 'syncing' ? 'animate-spin' : ''}`} style={{ color: iconColor }} />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-[#111827] leading-none mb-0.5">{source.name}</p>
                          <p className="text-[11px] text-[#9CA3AF] truncate">{source.detail}</p>
                          {source.status === 'synced'   && <p className="text-[10.5px] text-[#15803D] font-medium mt-0.5">Synced · Today 8:14am</p>}
                          {source.status === 'stale'    && <p className="text-[10.5px] text-[#C2410C] font-medium mt-0.5">Stale · Jun 28 — 3 days ago</p>}
                          {source.status === 'error'    && <p className="text-[10.5px] text-[#BE123C] font-medium mt-0.5">Permissions revoked</p>}
                          {source.status === 'syncing'  && <p className="text-[10.5px] text-[#1D4ED8] font-medium mt-0.5">Syncing now…</p>}
                        </div>
                      </div>
                      <button
                        className={`h-7 px-3 rounded-[7px] text-[11.5px] font-semibold flex-shrink-0 transition-colors ${
                          source.status === 'error'
                            ? 'bg-[#FFF1F2] text-[#BE123C] hover:bg-[#FFE4E6]'
                            : source.status === 'syncing'
                            ? 'bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed'
                            : 'bg-[#F9FAFB] text-[#374151] hover:bg-[#F3F4F6]'
                        }`}
                        style={{ border: '1px solid rgba(0,15,30,0.08)' }}
                        disabled={source.status === 'syncing'}
                      >
                        {btnLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'all' && (
        <div className="space-y-2 fade-up fade-up-2">
          {data.findings.map((f) => (
            <div key={f.id} className="bg-white rounded-[14px] px-5 py-4 flex items-start justify-between gap-4 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)]" style={CARD_STYLE}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusBadge status={f.status} />
                  {f.isPinned && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#C2410C]">
                      <Pin size={10} strokeWidth={2} /> Pinned
                    </span>
                  )}
                </div>
                <h3 className="text-[14px] font-semibold text-[#111827] mb-0.5 leading-snug">{f.title}</h3>
                <p className="text-[12px] text-[#9CA3AF]">{f.site} · {f.severity} · Added {f.dateAdded} by {f.addedBy}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 items-center">
                <button onClick={() => togglePin(f.id)} title={f.isPinned ? 'Unpin' : 'Pin to dashboard'}
                  className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all ${f.isPinned ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#F9FAFB] text-[#9CA3AF] hover:text-[#C2410C]'}`}
                  style={{ border: f.isPinned ? '1px solid #FED7AA' : '1px solid rgba(0,15,30,0.07)' }}>
                  <Pin size={13} strokeWidth={1.75} />
                </button>
                <button onClick={() => deleteFinding(f.id)}
                  className="w-8 h-8 rounded-[8px] bg-[#F9FAFB] flex items-center justify-center text-[#9CA3AF] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-all"
                  style={{ border: '1px solid rgba(0,15,30,0.07)' }}>
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
          {data.findings.length === 0 && (
            <div className="text-center py-16 text-[#9CA3AF] text-[14px]">No findings yet. Add one above.</div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#000F1E] text-white px-5 py-3 rounded-[12px] text-[13.5px] font-semibold shadow-lg z-50 fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
