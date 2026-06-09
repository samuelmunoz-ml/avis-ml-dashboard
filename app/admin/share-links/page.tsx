'use client';
import { useState } from 'react';
import { useData } from '@/lib/store';
import { ShareLink } from '@/lib/types';

function generateId() {
  return 'sl-' + Date.now().toString(36);
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generatePassword(): string {
  const words = ['Avis', 'ML', 'ABG', 'Fleet', 'Data', 'Analytics'];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const year = new Date().getFullYear();
  return `${w1}-${w2}-${year}`;
}

const SECTION_LABELS = {
  overview: { label: 'Overview', desc: 'Main dashboard — metrics, findings summary, pipeline snapshot' },
  findings: { label: 'Findings', desc: 'All finding cards, detail pages, and resolution paths' },
  experiments: { label: 'Experiments', desc: 'Full pipeline table, experiment detail pages, outcome metrics' },
  timeline: { label: 'Timeline', desc: 'Engagement Gantt, milestones, and context notes' },
};

export default function ShareLinksPage() {
  const { data, setData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<ShareLink | null>(null);
  const [toast, setToast] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlugVal] = useState('');
  const [password, setPassword] = useState('');
  const [sections, setSections] = useState({ overview: true, findings: true, experiments: true, timeline: true });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function openCreate() {
    setEditingLink(null);
    setName('');
    setSlugVal('');
    setPassword(generatePassword());
    setSections({ overview: true, findings: true, experiments: true, timeline: true });
    setShowModal(true);
  }

  function openEdit(link: ShareLink) {
    setEditingLink(link);
    setName(link.name);
    setSlugVal(link.slug);
    setPassword(link.password);
    setSections({ ...link.sections });
    setShowModal(true);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editingLink) setSlugVal(toSlug(val));
  }

  function handleSave() {
    if (!name.trim() || !slug.trim() || !password.trim()) {
      showToast('Name, slug, and password are required.');
      return;
    }
    if (editingLink) {
      setData({
        ...data,
        shareLinks: data.shareLinks.map((l) =>
          l.id === editingLink.id ? { ...l, name, slug, password, sections } : l
        ),
      });
    } else {
      const newLink: ShareLink = {
        id: generateId(),
        name,
        slug,
        password,
        sections,
        createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setData({ ...data, shareLinks: [...data.shareLinks, newLink] });
    }
    setShowModal(false);
    showToast(editingLink ? 'Link updated.' : 'Link created.');
  }

  function deleteLink(id: string) {
    if (!confirm('Delete this share link?')) return;
    setData({ ...data, shareLinks: data.shareLinks.filter((l) => l.id !== id) });
    showToast('Link deleted.');
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied.`);
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://avis-ml.monstarlab.com';

  return (
    <div className="p-8 max-w-[900px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-[#000F1E]">Share links</h1>
          <p className="text-sm text-[#939598] mt-1 max-w-lg">
            Each link gives a specific stakeholder access to a curated view of the dashboard. Sections and password are configured per link.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-11 px-5 bg-[#000F1E] text-white text-sm font-medium rounded-[4px] hover:bg-[#0D1E35] transition-colors whitespace-nowrap"
        >
          + Create new link
        </button>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold text-[#000F1E] mb-5">Existing links</h2>
        <div className="space-y-4">
          {data.shareLinks.map((link) => (
            <div key={link.id} className="border border-[#DAD9D6] rounded-lg p-5 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-semibold text-[#000F1E] mb-1">{link.name}</h3>
                  <p className="text-[13px] text-[#939598] mb-3 font-mono">{baseUrl}/view/{link.slug}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(Object.entries(link.sections) as [keyof typeof link.sections, boolean][])
                      .filter(([, v]) => v)
                      .map(([key]) => (
                        <span key={key} className="px-2.5 h-6 flex items-center rounded border border-[#DAD9D6] text-[12px] text-[#464A4D] capitalize">
                          {SECTION_LABELS[key].label}
                        </span>
                      ))}
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-[#939598]">
                    <span>🔒 Password set</span>
                    {link.lastAccessed && <span>👁 Last accessed: {link.lastAccessed}</span>}
                    <span>📅 Created {link.createdDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(link)}
                    className="w-8 h-8 border border-[#DAD9D6] rounded flex items-center justify-center text-[#464A4D] hover:bg-[#F7F7F6] transition-colors text-sm"
                  >✏️</button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="w-8 h-8 border border-[#FFCDD2] rounded flex items-center justify-center text-[#C62828] hover:bg-[#FFEBEE] transition-colors text-sm"
                  >🗑️</button>
                  <button
                    onClick={() => copyToClipboard(`${baseUrl}/view/${link.slug}`, 'URL')}
                    className="h-8 px-3.5 border border-[#DAD9D6] rounded text-[13px] font-medium text-[#000F1E] hover:bg-[#F7F7F6] transition-colors flex items-center gap-1.5"
                  >
                    <span>⬚</span> Copy URL
                  </button>
                  <button
                    onClick={() => copyToClipboard(link.password, 'Password')}
                    className="h-8 px-3.5 border border-[#DAD9D6] rounded text-[13px] font-medium text-[#000F1E] hover:bg-[#F7F7F6] transition-colors flex items-center gap-1.5"
                  >
                    <span>🔑</span> Copy Password
                  </button>
                </div>
              </div>
            </div>
          ))}

          {data.shareLinks.length === 0 && (
            <div className="border border-dashed border-[#DAD9D6] rounded-lg py-12 text-center text-[#939598] text-sm">
              No share links yet. Create one to get started.
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl border border-[#DAD9D6] w-full max-w-[560px] shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-[#DAD9D6]">
              <h2 className="text-[18px] font-semibold text-[#000F1E]">
                {editingLink ? 'Edit share link' : 'Create new link'}
              </h2>
              <p className="text-[13px] text-[#939598] mt-1">
                Configure which sections this stakeholder can see, set a password, and copy the generated URL.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Link name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ravi — Experiments + Metrics"
                    className="w-full h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] placeholder:text-[#B7B8B9] outline-none focus:border-[#000F1E]"
                  />
                  <p className="text-[11px] text-[#939598] mt-1">Used for your reference only. Not shown to the viewer.</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlugVal(toSlug(e.target.value))}
                    placeholder="ravi"
                    className="w-full h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm font-mono text-[#000F1E] placeholder:text-[#B7B8B9] outline-none focus:border-[#000F1E]"
                  />
                  {slug && <p className="text-[11px] text-[#939598] mt-1 font-mono">{baseUrl}/view/{slug}</p>}
                </div>
              </div>

              {/* Section visibility */}
              <div>
                <label className="block text-[13px] font-medium text-[#000F1E] mb-1">Section visibility</label>
                <p className="text-[12px] text-[#234474] mb-3">Choose which pages this viewer can access. Overview is always included.</p>
                <div className="space-y-2">
                  {(Object.entries(SECTION_LABELS) as [keyof typeof SECTION_LABELS, { label: string; desc: string }][]).map(([key, { label, desc }]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors ${
                        key === 'overview' ? 'border-[#DAD9D6] bg-[#F7F7F6] cursor-not-allowed' : 'border-[#DAD9D6] hover:border-[#CACAC8]'
                      } ${sections[key] && key !== 'overview' ? 'border-[#234474] bg-[#E8ECF1]' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={sections[key]}
                        disabled={key === 'overview'}
                        onChange={(e) => setSections((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-[#DAD9D6] accent-[#000F1E]"
                      />
                      <div>
                        <span className="text-[14px] font-medium text-[#000F1E]">{label} </span>
                        <span className="text-[13px] text-[#939598]">{desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Access Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm font-mono text-[#000F1E] outline-none focus:border-[#000F1E]"
                  />
                  <button
                    onClick={() => setPassword(generatePassword())}
                    className="h-[42px] px-4 border border-[#DAD9D6] text-sm font-medium text-[#000F1E] rounded-[4px] hover:bg-[#F7F7F6] transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-[11px] text-[#939598] mt-1.5">
                  ⚠️ Share this password with the viewer separately — it is not included in the link. Passwords are stored encrypted.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-[#DAD9D6] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="h-11 px-6 border border-[#DAD9D6] text-[#000F1E] text-sm font-medium rounded-[4px] hover:bg-[#F7F7F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="h-11 px-6 bg-[#000F1E] text-white text-sm font-medium rounded-[4px] hover:bg-[#0D1E35] transition-colors"
              >
                Save link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#000F1E] text-white px-5 py-3 rounded-lg text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
