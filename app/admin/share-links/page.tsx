'use client';
import { useState } from 'react';
import { useData } from '@/lib/store';
import { ShareLink } from '@/lib/types';
import { Copy, KeyRound, Pencil, Trash2, Link2, Plus, Lock, Eye, Calendar, X, RefreshCw, ExternalLink } from 'lucide-react';

const CARD_STYLE = {
  boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)',
  border: '1px solid rgba(0,15,30,0.05)',
};

const INPUT_BASE = 'w-full h-10 px-3.5 rounded-[10px] text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-200 bg-[#F9FAFB]';

function generateId() { return 'sl-' + Date.now().toString(36); }
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
function generatePassword() {
  const w = ['Avis','ML','ABG','Fleet','Data','Analytics'];
  return `${w[Math.floor(Math.random()*w.length)]}-${w[Math.floor(Math.random()*w.length)]}-${new Date().getFullYear()}`;
}

const SECTION_META = {
  overview:    { label: 'Overview',    desc: 'Metrics, findings summary, pipeline snapshot' },
  findings:    { label: 'Findings',    desc: 'All finding cards, detail pages, resolution paths' },
  experiments: { label: 'Experiments', desc: 'Pipeline table, experiment detail, outcome metrics' },
  timeline:    { label: 'Timeline',    desc: 'Engagement Gantt, milestones, context notes' },
};

export default function ShareLinksPage() {
  const { data, setData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<ShareLink | null>(null);
  const [toast, setToast] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlugVal] = useState('');
  const [password, setPassword] = useState('');
  const [sections, setSections] = useState({ overview: true, findings: true, experiments: true, timeline: true });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function openCreate() {
    setEditingLink(null); setName(''); setSlugVal(''); setPassword(generatePassword());
    setSections({ overview: true, findings: true, experiments: true, timeline: true });
    setShowModal(true);
  }
  function openEdit(link: ShareLink) {
    setEditingLink(link); setName(link.name); setSlugVal(link.slug);
    setPassword(link.password); setSections({ ...link.sections }); setShowModal(true);
  }
  function handleSave() {
    if (!name.trim() || !slug.trim() || !password.trim()) { showToast('Name, slug, and password are required.'); return; }
    if (editingLink) {
      setData({ ...data, shareLinks: data.shareLinks.map((l) => l.id === editingLink.id ? { ...l, name, slug, password, sections } : l) });
    } else {
      setData({ ...data, shareLinks: [...data.shareLinks, { id: generateId(), name, slug, password, sections, createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }] });
    }
    setShowModal(false);
    showToast(editingLink ? 'Link updated.' : 'Link created.');
  }
  function deleteLink(id: string) {
    if (!confirm('Delete this share link?')) return;
    setData({ ...data, shareLinks: data.shareLinks.filter((l) => l.id !== id) });
    showToast('Link deleted.');
  }
  function copy(text: string, label: string) { navigator.clipboard.writeText(text); showToast(`${label} copied.`); }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://avis-ml.monstarlab.com';
  const enabledSectionCount = (s: ShareLink['sections']) => Object.values(s).filter(Boolean).length;

  return (
    <div className="p-8 max-w-[900px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Admin · Access</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Share links</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5 max-w-md">
            Each link gives a stakeholder access to a curated view of the dashboard with their own password and section permissions.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 px-5 rounded-[10px] text-[13.5px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] transition-colors flex items-center gap-2 mt-1"
        >
          <Plus size={14} strokeWidth={2.5} /> Create new link
        </button>
      </div>

      {/* Existing links */}
      <div className="space-y-3 fade-up fade-up-1">
        {data.shareLinks.map((link) => (
          <div key={link.id} className="bg-white rounded-[14px] p-5 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)]" style={CARD_STYLE}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-[15px] font-bold text-[#111827]">{link.name}</h3>
                  <span className="text-[11px] font-semibold text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                    {enabledSectionCount(link.sections)} sections
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <Link2 size={11} strokeWidth={1.75} className="text-[#9CA3AF]" />
                  <span className="text-[12.5px] font-mono text-[#6B7280]">{baseUrl}/view/{link.slug}</span>
                  <button
                    onClick={() => copy(`${baseUrl}/view/${link.slug}`, 'URL')}
                    className="ml-1 text-[#9CA3AF] hover:text-[#234474] transition-colors"
                  >
                    <ExternalLink size={11} strokeWidth={1.75} />
                  </button>
                </div>

                {/* Section pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(Object.entries(link.sections) as [keyof typeof link.sections, boolean][]).map(([key, enabled]) => (
                    <span
                      key={key}
                      className={`px-2.5 h-6 flex items-center rounded-full text-[11.5px] font-medium capitalize ${
                        enabled
                          ? 'bg-[#F0FDF4] text-[#15803D]'
                          : 'bg-[#F9FAFB] text-[#9CA3AF] line-through'
                      }`}
                    >
                      {SECTION_META[key].label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-[11.5px] text-[#9CA3AF]">
                  <span className="flex items-center gap-1"><Lock size={10} strokeWidth={1.75} /> Password set</span>
                  {link.lastAccessed && <span className="flex items-center gap-1"><Eye size={10} strokeWidth={1.75} /> {link.lastAccessed}</span>}
                  <span className="flex items-center gap-1"><Calendar size={10} strokeWidth={1.75} /> Created {link.createdDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => openEdit(link)}
                  className="w-8 h-8 rounded-[8px] bg-[#F9FAFB] flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all"
                  style={{ border: '1px solid rgba(0,15,30,0.07)' }}>
                  <Pencil size={13} strokeWidth={1.75} />
                </button>
                <button onClick={() => deleteLink(link.id)}
                  className="w-8 h-8 rounded-[8px] bg-[#F9FAFB] flex items-center justify-center text-[#9CA3AF] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-all"
                  style={{ border: '1px solid rgba(0,15,30,0.07)' }}>
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => copy(`${baseUrl}/view/${link.slug}`, 'URL')}
                  className="h-8 px-3.5 rounded-[8px] flex items-center gap-1.5 text-[12.5px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                  style={{ border: '1px solid rgba(0,15,30,0.08)' }}
                >
                  <Copy size={12} strokeWidth={1.75} /> Copy URL
                </button>
                <button
                  onClick={() => copy(link.password, 'Password')}
                  className="h-8 px-3.5 rounded-[8px] flex items-center gap-1.5 text-[12.5px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                  style={{ border: '1px solid rgba(0,15,30,0.08)' }}
                >
                  <KeyRound size={12} strokeWidth={1.75} /> Copy password
                </button>
              </div>
            </div>
          </div>
        ))}

        {data.shareLinks.length === 0 && (
          <div className="bg-white rounded-[14px] py-14 text-center fade-up" style={{ ...CARD_STYLE, border: '2px dashed #E5E7EB' }}>
            <p className="text-[14px] font-medium text-[#374151] mb-1">No share links yet</p>
            <p className="text-[13px] text-[#9CA3AF]">Create one to give stakeholders access to the dashboard</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-6">
          <div
            className="bg-white rounded-[18px] w-full max-w-[560px] overflow-y-auto max-h-[90vh] fade-up"
            style={{ boxShadow: '0 20px 60px rgba(0,15,30,0.16), 0 4px 12px rgba(0,15,30,0.08)' }}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
              <div>
                <h2 className="text-[17px] font-bold text-[#111827] tracking-[-0.01em]">
                  {editingLink ? 'Edit share link' : 'Create new link'}
                </h2>
                <p className="text-[13px] text-[#9CA3AF] mt-0.5">
                  Configure sections, set a password, and copy the generated URL.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-[8px] bg-[#F9FAFB] flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] transition-colors ml-4 flex-shrink-0" style={{ border: '1px solid rgba(0,15,30,0.07)' }}>
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Name + slug */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Link name</label>
                  <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (!editingLink) setSlugVal(toSlug(e.target.value)); }}
                    placeholder="Ravi — Experiments + Metrics"
                    className={INPUT_BASE} style={{ border: '1.5px solid #E5E7EB' }}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.boxShadow = '0 0 0 3px rgba(0,15,30,0.06)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                  />
                  <p className="text-[11px] text-[#9CA3AF] mt-1">For your reference — not shown to the viewer.</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">URL slug</label>
                  <input type="text" value={slug} onChange={(e) => setSlugVal(toSlug(e.target.value))} placeholder="ravi"
                    className={INPUT_BASE + ' font-mono'} style={{ border: '1.5px solid #E5E7EB' }}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.boxShadow = '0 0 0 3px rgba(0,15,30,0.06)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                  />
                  {slug && <p className="text-[11px] text-[#9CA3AF] mt-1 font-mono truncate">/view/{slug}</p>}
                </div>
              </div>

              {/* Section visibility */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1 tracking-[0.01em]">Section visibility</label>
                <p className="text-[12px] text-[#234474] mb-3">Choose which pages this viewer can access. Overview is always included.</p>
                <div className="space-y-2">
                  {(Object.entries(SECTION_META) as [keyof typeof SECTION_META, { label: string; desc: string }][]).map(([key, { label, desc }]) => {
                    const isLocked = key === 'overview';
                    const isActive = sections[key];
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-3.5 rounded-[10px] cursor-pointer transition-all ${
                          isLocked ? 'cursor-not-allowed opacity-70' :
                          isActive ? '' : ''
                        }`}
                        style={{
                          border: isActive ? '1.5px solid #000F1E' : '1.5px solid #E5E7EB',
                          background: isActive ? '#FAFAFA' : '#F9FAFB',
                        }}
                      >
                        <div
                          className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-[#000F1E]' : 'bg-white'}`}
                          style={{ border: isActive ? 'none' : '1.5px solid #D1D5DB' }}
                        >
                          {isActive && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <input type="checkbox" checked={isActive} disabled={isLocked}
                          onChange={(e) => setSections((prev) => ({ ...prev, [key]: e.target.checked }))}
                          className="hidden" />
                        <div className="min-w-0">
                          <span className="text-[13.5px] font-semibold text-[#111827]">{label} </span>
                          <span className="text-[12.5px] text-[#9CA3AF]">{desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">Access password</label>
                <div className="flex gap-2">
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_BASE + ' font-mono flex-1'} style={{ border: '1.5px solid #E5E7EB' }}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.boxShadow = '0 0 0 3px rgba(0,15,30,0.06)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                  />
                  <button onClick={() => setPassword(generatePassword())}
                    className="h-10 px-3.5 rounded-[10px] flex items-center gap-1.5 text-[12.5px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors flex-shrink-0"
                    style={{ border: '1px solid rgba(0,15,30,0.1)' }}>
                    <RefreshCw size={13} strokeWidth={1.75} /> Generate
                  </button>
                </div>
                <p className="text-[11.5px] text-[#9CA3AF] mt-1.5 flex items-start gap-1">
                  <span className="text-[#C2410C] font-bold mt-px">!</span>
                  Share this password with the viewer separately — not in the same message as the URL.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2.5 px-6 py-4" style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}>
              <button onClick={() => setShowModal(false)}
                className="h-10 px-5 rounded-[10px] text-[13.5px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                style={{ border: '1px solid rgba(0,15,30,0.1)' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                className="h-10 px-5 rounded-[10px] text-[13.5px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] transition-colors">
                {editingLink ? 'Update link' : 'Save link'}
              </button>
            </div>
          </div>
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
