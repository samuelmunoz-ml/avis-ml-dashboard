'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';

export default function AdminWidgetBuilder() {
  const { data } = useData();
  const [previewSlug, setPreviewSlug] = useState('');

  const pinnedFindings = data.findings.filter((f) => f.isPinned);

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-bold text-[#000F1E]">Overview</h1>
          <p className="text-sm text-[#939598]">Avis Budget Group</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#464A4D]">Preview as viewer:</label>
            <select
              value={previewSlug}
              onChange={(e) => setPreviewSlug(e.target.value)}
              className="h-9 px-3 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] outline-none focus:border-[#000F1E]"
            >
              <option value="">Select link…</option>
              {data.shareLinks.map((l) => (
                <option key={l.id} value={l.slug}>{l.name}</option>
              ))}
            </select>
            {previewSlug && (
              <Link
                href={`/view/${previewSlug}/overview`}
                target="_blank"
                className="h-9 px-4 border border-[#DAD9D6] rounded-[4px] text-sm font-medium text-[#000F1E] hover:bg-[#F7F7F6] flex items-center transition-colors"
              >
                Preview ↗
              </Link>
            )}
          </div>
          <button className="h-9 px-4 bg-[#000F1E] text-white text-sm font-medium rounded-[4px] hover:bg-[#0D1E35] transition-colors">
            Done
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-6 border-b border-[#DAD9D6] mb-8 text-[13px] font-medium">
        {['OVERVIEW', 'FINDINGS', 'EXPERIMENTS', 'TIMELINE', '+ADD PAGE'].map((tab) => (
          <button
            key={tab}
            className={`pb-3 border-b-2 transition-colors ${tab === 'OVERVIEW' ? 'border-[#234474] text-[#234474]' : 'border-transparent text-[#939598] hover:text-[#464A4D]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Metric row widget */}
        <div className="border border-[#DAD9D6] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#F7F7F6] border-b border-[#DAD9D6]">
            <div className="flex items-center gap-3">
              <span className="text-[#939598] cursor-grab">⠿</span>
              <span className="text-[14px] font-semibold text-[#000F1E]">Metric row</span>
              <div className="flex gap-1">
                {['Full', '1/2', '1/3'].map((s) => (
                  <button key={s} className={`px-2 py-0.5 text-[11px] border rounded ${s === 'Full' ? 'border-[#000F1E] text-[#000F1E]' : 'border-[#DAD9D6] text-[#939598]'}`}>{s}</button>
                ))}
              </div>
            </div>
            <button className="h-8 px-3 bg-[#000F1E] text-white text-[12px] font-medium rounded-[4px]">Configuration</button>
          </div>
          <div className="p-4 grid grid-cols-4 gap-4">
            {[
              { label: 'Active findings', value: data.findings.filter(f => f.status !== 'Resolved').length, sub: '↑ 3 since last week', subColor: 'text-[#2E7D32]' },
              { label: 'Experiments running', value: data.experiments.filter(e => e.status === 'Running').length, sub: '2 completed this week', subColor: 'text-[#939598]' },
              { label: 'Anomaly rate', value: '9.7%', sub: '↓ Highest since cutover', subColor: 'text-[#C62828]' },
              { label: 'Resolved findings', value: data.findings.filter(f => f.status === 'Resolved').length, sub: '✓ 2 resolved this week', subColor: 'text-[#2E7D32]' },
            ].map((m) => (
              <div key={m.label} className="border border-[#DAD9D6] rounded-lg p-4">
                <p className="text-[12px] text-[#939598] mb-1.5">{m.label}</p>
                <p className="text-[28px] font-bold text-[#000F1E] leading-none mb-1">{m.value}</p>
                <p className={`text-[12px] ${m.subColor}`}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add widget zone */}
        <div className="border-2 border-dashed border-[#B7B8B9] rounded-lg py-4 text-center text-[13px] text-[#234474] font-medium hover:border-[#234474] cursor-pointer transition-colors">
          + Add widget here
        </div>

        {/* Finding cards widget */}
        <div className="border border-[#DAD9D6] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#F7F7F6] border-b border-[#DAD9D6]">
            <div className="flex items-center gap-3">
              <span className="text-[#939598] cursor-grab">⠿</span>
              <span className="text-[14px] font-semibold text-[#000F1E]">Finding cards</span>
              <div className="flex gap-1">
                {['Full', '1/2', '1/3'].map((s) => (
                  <button key={s} className={`px-2 py-0.5 text-[11px] border rounded ${s === 'Full' ? 'border-[#000F1E] text-[#000F1E]' : 'border-[#DAD9D6] text-[#939598]'}`}>{s}</button>
                ))}
              </div>
            </div>
            <button className="h-8 px-3 bg-[#000F1E] text-white text-[12px] font-medium rounded-[4px]">Configuration</button>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            {pinnedFindings.slice(0, 3).map((f) => (
              <div key={f.id} className="border border-[#DAD9D6] rounded-lg overflow-hidden">
                <div className="h-28 bg-[#F7F7F6] relative">
                  <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #EFF0F0 25%, transparent 25%), linear-gradient(-45deg, #EFF0F0 25%, transparent 25%)', backgroundSize: '16px 16px', backgroundColor: '#F7F7F6' }} />
                  {f.status === 'Reported' && <span className="absolute top-2 right-2 bg-[#E65100] text-white text-[10px] px-2 py-0.5 rounded-full">New</span>}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-[#000F1E] mb-1 line-clamp-2">{f.title}</p>
                  <p className="text-[11px] text-[#939598] mb-2 line-clamp-2">{f.description}</p>
                  <StatusBadge status={f.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add widget zone */}
        <div className="border-2 border-dashed border-[#B7B8B9] rounded-lg py-4 text-center text-[13px] text-[#234474] font-medium hover:border-[#234474] cursor-pointer transition-colors">
          + Add widget here
        </div>

        {/* Status table widget */}
        <div className="flex gap-4">
          <div className="flex-1 border border-[#DAD9D6] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#F7F7F6] border-b border-[#DAD9D6]">
              <div className="flex items-center gap-3">
                <span className="text-[#939598] cursor-grab">⠿</span>
                <span className="text-[14px] font-semibold text-[#000F1E]">Status table</span>
              </div>
              <button className="w-8 h-8 border border-[#DAD9D6] rounded flex items-center justify-center text-[#939598] hover:bg-[#F7F7F6]">⚙</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#DAD9D6] bg-[#F7F7F6]">
                  <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#234474]">Experiment</th>
                  <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#234474]">Status</th>
                  <th className="text-left px-3 py-2.5 text-[12px] font-semibold text-[#234474]">Owner</th>
                </tr>
              </thead>
              <tbody>
                {data.experiments.slice(0, 4).map((e) => (
                  <tr key={e.id} className="border-b border-[#DAD9D6] last:border-0">
                    <td className="px-3 py-2.5 text-[13px] text-[#000F1E]">{e.title}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={e.status} /></td>
                    <td className="px-3 py-2.5 text-[13px] text-[#464A4D]">{e.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex-1 border-2 border-dashed border-[#B7B8B9] rounded-lg flex items-center justify-center text-[13px] text-[#234474] font-medium hover:border-[#234474] cursor-pointer transition-colors min-h-[200px]">
            + Add widget here
          </div>
        </div>
      </div>
    </div>
  );
}
