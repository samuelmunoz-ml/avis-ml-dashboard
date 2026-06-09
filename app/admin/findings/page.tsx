'use client';
import { useState, useRef, useCallback } from 'react';
import { useData } from '@/lib/store';
import { Finding, FindingStatus, Severity, ResolutionStep } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

const STATUSES: FindingStatus[] = ['Reported', 'Acknowledged', 'Fix in progress', 'Resolved'];
const SEVERITIES: Severity[] = ['High', 'Medium', 'Low'];
const SITES = ['avis.com', 'budget.com', 'payless.com'];

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
  const [steps, setSteps] = useState<{ title: string; description: string }[]>([
    { title: '', description: '' },
  ]);
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
      reader.onload = (e) => {
        setImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setImages((prev) => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(file);
      }
    }
  }, []);

  function handleSave() {
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required.');
      return;
    }
    const newFinding: Finding = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      site,
      severity,
      status,
      category: 'Manual entry',
      addedBy: 'Admin',
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUpdated: 'Just now',
      images,
      isPinned: false,
      relatedFindingIds: [],
      resolutionSteps: steps
        .filter((s) => s.title.trim())
        .map((s, i) => ({
          id: generateId(),
          stepNumber: i + 1,
          title: s.title.trim(),
          description: s.description.trim(),
          status: 'pending',
        })),
    };
    setData({ ...data, findings: [newFinding, ...data.findings] });
    // Reset form
    setTitle('');
    setDescription('');
    setSite('avis.com');
    setSeverity('High');
    setStatus('Reported');
    setImages([]);
    setSteps([{ title: '', description: '' }]);
    showToast('Finding saved.');
  }

  function togglePin(id: string) {
    setData({
      ...data,
      findings: data.findings.map((f) => (f.id === id ? { ...f, isPinned: !f.isPinned } : f)),
    });
  }

  function deleteFinding(id: string) {
    if (!confirm('Delete this finding?')) return;
    setData({ ...data, findings: data.findings.filter((f) => f.id !== id) });
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-[32px] font-bold text-[#000F1E]">Findings</h1>
        <p className="text-sm text-[#939598] mt-1">Add, edit, and pin findings. Pinned findings appear on the main dashboard widget.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DAD9D6] mb-8">
        <button
          onClick={() => setTab('add')}
          className={`px-1 pb-3 mr-6 text-sm font-medium border-b-2 transition-colors ${tab === 'add' ? 'border-[#234474] text-[#234474]' : 'border-transparent text-[#939598] hover:text-[#464A4D]'}`}
        >
          + ADD FINDINGS
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-1 pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'all' ? 'border-[#234474] text-[#234474]' : 'border-transparent text-[#939598] hover:text-[#464A4D]'}`}
        >
          ALL FINDINGS ({data.findings.length})
        </button>
      </div>

      {tab === 'add' && (
        <div className="flex gap-8">
          {/* Create form */}
          <div className="flex-1 max-w-xl">
            <div className="border border-[#DAD9D6] rounded-lg p-6 bg-white" onPaste={handlePaste}>
              <h2 className="text-[18px] font-semibold text-[#000F1E] mb-6">Create new finding</h2>

              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Title <span className="text-[#C62828]">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Finding title"
                  className="w-full h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] placeholder:text-[#B7B8B9] outline-none focus:border-[#000F1E]"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Description <span className="text-[#C62828]">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the finding in 1–3 sentences"
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] placeholder:text-[#B7B8B9] outline-none focus:border-[#000F1E] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Site / area</label>
                  <select
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="w-full h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] outline-none focus:border-[#000F1E] bg-white"
                  >
                    {SITES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] outline-none focus:border-[#000F1E] bg-white"
                  >
                    {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[13px] font-medium text-[#000F1E] mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`transition-all ${status === s ? 'ring-2 ring-[#000F1E] ring-offset-1 rounded-full' : ''}`}
                    >
                      <StatusBadge status={s} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Image upload */}
              <div className="mb-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && processFiles(e.target.files)}
                />
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-[#234474] bg-[#E8ECF1]' : 'border-[#DAD9D6] hover:border-[#939598]'}`}
                >
                  <div className="w-10 h-10 rounded-full border border-[#DAD9D6] flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-[#939598]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#464A4D] mb-1">Drag and drop photos here</p>
                  <p className="text-[12px] text-[#939598] mb-3">or click to browse your files</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="h-9 px-4 bg-[#000F1E] text-white text-[13px] font-medium rounded-[4px] hover:bg-[#0D1E35] transition-colors"
                  >
                    Choose Photos
                  </button>
                </div>
                <p className="text-[11px] text-[#939598] mt-1.5">Tip: paste screenshots with ⌘V anywhere in this form</p>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img} alt="" className="w-16 h-16 object-cover rounded border border-[#DAD9D6]" />
                        <button
                          onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C62828] text-white rounded-full text-[10px] flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution steps */}
              <div className="mb-6">
                <h3 className="text-[15px] font-semibold text-[#000F1E] mb-1">Resolution path</h3>
                <p className="text-[13px] text-[#939598] mb-4">Steps to resolution — current status tracked below</p>
                <div className="space-y-4">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-5 h-5 rounded-full border-2 border-[#DAD9D6] bg-white flex-shrink-0" />
                        {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-[#DAD9D6] my-1" style={{ minHeight: '20px' }} />}
                      </div>
                      <div className="flex-1 space-y-2 pb-2">
                        <p className="text-[12px] font-medium text-[#234474]">Step {i + 1}</p>
                        <div>
                          <label className="block text-[12px] font-medium text-[#000F1E] mb-1">Title <span className="text-[#C62828]">*</span></label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => setSteps((prev) => prev.map((s, j) => j === i ? { ...s, title: e.target.value } : s))}
                            className="w-full h-9 px-3 border border-[#DAD9D6] rounded-[4px] text-[13px] outline-none focus:border-[#000F1E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#000F1E] mb-1">Description <span className="text-[#C62828]">*</span></label>
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) => setSteps((prev) => prev.map((s, j) => j === i ? { ...s, description: e.target.value } : s))}
                            className="w-full h-9 px-3 border border-[#DAD9D6] rounded-[4px] text-[13px] outline-none focus:border-[#000F1E]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSteps((prev) => [...prev, { title: '', description: '' }])}
                  className="text-[13px] text-[#234474] font-medium hover:text-[#1A2D45] mt-2"
                >
                  + Add step
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setTitle(''); setDescription(''); setImages([]); setSteps([{ title: '', description: '' }]); }}
                  className="h-11 px-6 border border-[#DAD9D6] text-[#000F1E] text-sm font-medium rounded-[4px] hover:bg-[#F7F7F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="h-11 px-6 bg-[#000F1E] text-white text-sm font-medium rounded-[4px] hover:bg-[#0D1E35] transition-colors"
                >
                  Save finding
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-80 flex-shrink-0 space-y-6">
            {/* Recent findings */}
            <div className="border border-[#DAD9D6] rounded-lg p-5 bg-white">
              <h3 className="text-[15px] font-semibold text-[#000F1E] mb-4">Recent findings</h3>
              <div className="space-y-4">
                {data.findings.slice(0, 3).map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#000F1E] mb-0.5 leading-snug">{f.title}</p>
                      <p className="text-[12px] text-[#939598]">{f.site} · {f.status} · {f.dateAdded}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => togglePin(f.id)}
                        title={f.isPinned ? 'Unpin' : 'Pin to dashboard'}
                        className={`w-7 h-7 border rounded flex items-center justify-center text-[12px] transition-colors ${f.isPinned ? 'border-[#E65100] text-[#E65100]' : 'border-[#DAD9D6] text-[#939598] hover:border-[#E65100]'}`}
                      >
                        📌
                      </button>
                      <button className="w-7 h-7 border border-[#DAD9D6] rounded flex items-center justify-center text-[12px] text-[#939598] hover:border-[#000F1E] transition-colors">✏️</button>
                      <button
                        onClick={() => deleteFinding(f.id)}
                        className="w-7 h-7 border border-[#FFCDD2] rounded flex items-center justify-center text-[12px] text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                      >🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source sync */}
            <div className="border border-[#DAD9D6] rounded-lg p-5 bg-white">
              <h3 className="text-[15px] font-semibold text-[#000F1E] mb-1">Source sync</h3>
              <p className="text-[12px] text-[#939598] mb-4">Connected Google Sheets. Sync manually or wait for auto-sync every 6 hours.</p>
              <div className="space-y-3">
                {[
                  { name: 'Experiments pipeline', detail: 'experiments-tracker.gsheet · 18 rows', status: 'synced', label: 'Sync' },
                  { name: 'KPI metrics', detail: 'ml-kpi-dashboard.gsheet · 6 rows', status: 'syncing', label: 'Syncing...' },
                  { name: 'Anomaly data', detail: 'anomaly-tracking.gsheet · 142 rows', status: 'stale', label: 'Sync' },
                  { name: 'Timeline milestones', detail: 'engagement-timeline.gsheet', status: 'error', label: 'Reconnect' },
                ].map((source) => (
                  <div key={source.name} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium ${source.status === 'error' ? 'text-[#C62828]' : 'text-[#000F1E]'}`}>{source.name}</p>
                      <p className="text-[11px] text-[#939598]">{source.detail}</p>
                      {source.status === 'synced' && <p className="text-[11px] text-[#2E7D32]">Synced · Today 8:14 am</p>}
                      {source.status === 'stale' && <p className="text-[11px] text-[#E65100]">Stale · Last synced Jun 28 — 3 days ago</p>}
                      {source.status === 'error' && <p className="text-[11px] text-[#C62828]">Error · Permissions revoked — re-connect required</p>}
                      {source.status === 'syncing' && <p className="text-[11px] text-[#1565C0]">Syncing now...</p>}
                    </div>
                    <button className={`h-7 px-3 border rounded text-[12px] font-medium flex-shrink-0 transition-colors ${source.status === 'error' ? 'border-[#C62828] text-[#C62828] hover:bg-[#FFEBEE]' : 'border-[#DAD9D6] text-[#464A4D] hover:border-[#000F1E]'}`}>
                      {source.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'all' && (
        <div className="space-y-3">
          {data.findings.map((f) => (
            <div key={f.id} className="border border-[#DAD9D6] rounded-lg p-4 bg-white flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={f.status} />
                  {f.isPinned && <span className="text-[11px] text-[#E65100] font-medium">📌 Pinned</span>}
                </div>
                <h3 className="text-[14px] font-semibold text-[#000F1E] mb-0.5">{f.title}</h3>
                <p className="text-[12px] text-[#939598]">{f.site} · {f.severity} · Added {f.dateAdded} by {f.addedBy}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => togglePin(f.id)}
                  title={f.isPinned ? 'Unpin' : 'Pin to dashboard'}
                  className={`w-8 h-8 border rounded flex items-center justify-center text-[13px] transition-colors ${f.isPinned ? 'border-[#E65100] text-[#E65100]' : 'border-[#DAD9D6] text-[#939598] hover:border-[#E65100]'}`}
                >
                  📌
                </button>
                <button
                  onClick={() => deleteFinding(f.id)}
                  className="w-8 h-8 border border-[#FFCDD2] rounded flex items-center justify-center text-[13px] text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#000F1E] text-white px-5 py-3 rounded-lg text-sm font-medium shadow-lg z-50 animate-in fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
