'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { ExternalLink, GripVertical, Settings, Plus } from 'lucide-react';

const CARD_STYLE = {
  boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)',
  border: '1px solid rgba(0,15,30,0.05)',
};

function WidgetShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[14px] overflow-hidden fade-up" style={CARD_STYLE}>
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(0,15,30,0.05)', background: '#FAFAFA' }}
      >
        <div className="flex items-center gap-2.5">
          <GripVertical size={15} strokeWidth={1.75} className="text-[#9CA3AF] cursor-grab" />
          <span className="text-[13.5px] font-semibold text-[#111827]">{title}</span>
        </div>
        <button
          className="h-7 px-3 rounded-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-[#0D1E35]"
          style={{ background: '#000F1E' }}
        >
          Configuration
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function AddWidgetZone() {
  return (
    <button
      className="w-full py-4 rounded-[14px] border-2 border-dashed border-[#E5E7EB] text-[13px] font-semibold text-[#234474] hover:border-[#234474] hover:bg-[#EFF6FF] transition-all duration-200 flex items-center justify-center gap-1.5"
    >
      <Plus size={14} strokeWidth={2} />
      Add widget here
    </button>
  );
}

export default function AdminWidgetBuilder() {
  const { data } = useData();
  const [previewSlug, setPreviewSlug] = useState('');

  const pinnedFindings = data.findings.filter((f) => f.isPinned);
  const activeFindings = data.findings.filter((f) => f.status !== 'Resolved').length;
  const runningExperiments = data.experiments.filter((e) => e.status === 'Running').length;
  const resolvedFindings = data.findings.filter((f) => f.status === 'Resolved').length;

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-7 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Admin · Widget builder</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Overview</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">Avis Budget Group</p>
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          <div className="flex items-center gap-2 bg-white rounded-[10px] px-3 h-10" style={CARD_STYLE}>
            <span className="text-[12.5px] text-[#6B7280]">Preview as:</span>
            <select
              value={previewSlug}
              onChange={(e) => setPreviewSlug(e.target.value)}
              className="text-[13px] font-medium text-[#111827] outline-none bg-transparent"
            >
              <option value="">Select viewer…</option>
              {data.shareLinks.map((l) => (
                <option key={l.id} value={l.slug}>{l.name}</option>
              ))}
            </select>
          </div>
          {previewSlug && (
            <Link
              href={`/view/${previewSlug}/overview`}
              target="_blank"
              className="h-10 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#F3F4F6]"
              style={{ border: '1px solid rgba(0,15,30,0.1)', color: '#234474' }}
            >
              Preview <ExternalLink size={12} strokeWidth={2} />
            </Link>
          )}
          <button
            className="h-10 px-5 rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#0D1E35]"
            style={{ background: '#000F1E' }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 mb-7 bg-white rounded-[12px] p-1 w-fit fade-up fade-up-1" style={CARD_STYLE}>
        {['Overview', 'Findings', 'Experiments', 'Timeline'].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 h-8 rounded-[8px] text-[13px] font-medium transition-all ${
              i === 0 ? 'bg-[#000F1E] text-white' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {tab}
          </button>
        ))}
        <button className="px-4 h-8 rounded-[8px] text-[13px] font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
          + Add page
        </button>
      </div>

      <div className="space-y-3">
        {/* Metric row widget */}
        <WidgetShell title="Metric row">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Active findings',     value: activeFindings,    sub: '↑ 3 since last week',    subColor: '#15803D' },
              { label: 'Experiments running', value: runningExperiments,sub: '2 completed this week',  subColor: '#9CA3AF' },
              { label: 'Anomaly rate',         value: '9.7%',            sub: '↓ Highest since cutover', subColor: '#BE123C' },
              { label: 'Resolved findings',   value: resolvedFindings,  sub: '✓ 2 resolved this week', subColor: '#15803D' },
            ].map((m) => (
              <div key={m.label} className="rounded-[12px] p-4" style={{ background: '#F9FAFB', border: '1px solid rgba(0,15,30,0.05)' }}>
                <p className="text-[12px] text-[#6B7280] mb-2">{m.label}</p>
                <p className="text-[26px] font-bold text-[#111827] leading-none tracking-[-0.02em] tabular-nums mb-1">{m.value}</p>
                <p className="text-[12px] font-medium" style={{ color: m.subColor }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </WidgetShell>

        <AddWidgetZone />

        {/* Finding cards widget */}
        <WidgetShell title="Finding cards">
          <div className="grid grid-cols-3 gap-3">
            {pinnedFindings.slice(0, 3).map((f) => (
              <div key={f.id} className="rounded-[12px] overflow-hidden" style={{ border: '1px solid rgba(0,15,30,0.06)' }}>
                <div
                  className="h-24 relative"
                  style={{ background: 'repeating-linear-gradient(45deg, #F3F4F6 0px, #F3F4F6 1px, #FAFAFA 1px, #FAFAFA 16px)' }}
                >
                  {f.status === 'Reported' && (
                    <span className="absolute top-2 right-2 bg-[#C2410C] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>
                  )}
                </div>
                <div className="p-3 bg-white">
                  <p className="text-[13px] font-semibold text-[#111827] mb-1 line-clamp-2 leading-snug">{f.title}</p>
                  <p className="text-[11.5px] text-[#6B7280] mb-2 line-clamp-1">{f.description}</p>
                  <StatusBadge status={f.status} />
                </div>
              </div>
            ))}
          </div>
        </WidgetShell>

        <AddWidgetZone />

        {/* Status table + empty zone side by side */}
        <div className="grid grid-cols-2 gap-3">
          <WidgetShell title="Status table">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,15,30,0.05)' }}>
                  {['Experiment', 'Status', 'Owner'].map((h) => (
                    <th key={h} className="text-left pb-2.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.experiments.slice(0, 4).map((e, i) => (
                  <tr
                    key={e.id}
                    style={{ borderBottom: i < 3 ? '1px solid rgba(0,15,30,0.04)' : 'none' }}
                  >
                    <td className="py-2.5 text-[13px] text-[#111827] pr-3 leading-snug">{e.title}</td>
                    <td className="py-2.5"><StatusBadge status={e.status} /></td>
                    <td className="py-2.5 text-[13px] text-[#6B7280]">{e.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </WidgetShell>

          <button className="bg-white rounded-[14px] border-2 border-dashed border-[#E5E7EB] flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#234474] hover:border-[#234474] hover:bg-[#EFF6FF] transition-all duration-200 min-h-[200px]">
            <Plus size={14} strokeWidth={2} />
            Add widget here
          </button>
        </div>
      </div>
    </div>
  );
}
