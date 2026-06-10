'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import { ExperimentStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { Search, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = [
  { key: 'Running',  label: 'Running',  color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'Planning', label: 'Planning', color: '#9CA3AF', bg: '#F9FAFB' },
  { key: 'Complete', label: 'Complete', color: '#22C55E', bg: '#F0FDF4' },
  { key: 'Blocked',  label: 'Blocked',  color: '#F43F5E', bg: '#FFF1F2' },
];

export default function ExperimentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExperimentStatus | 'All'>('All');

  const counts = STATUS_CONFIG.reduce((acc, s) => {
    acc[s.key] = data.experiments.filter((e) => e.status === s.key).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = data.experiments.filter((e) => {
    const matchesFilter = activeFilter === 'All' || e.status === activeFilter;
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.owner.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Research dashboard</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Experiments</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            {data.experiments.length} experiments
            <span className="text-[#C2410C] font-medium"> · 1 new since your last visit</span>
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <p className="text-[12.5px] text-[#9CA3AF]">Updated today at 8:14am</p>
        </div>
      </div>

      {/* Status summary */}
      <section className="mb-8 fade-up fade-up-1">
        <p className="text-[11.5px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">Status summary</p>
        <div className="grid grid-cols-4 gap-3">
          {STATUS_CONFIG.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveFilter(activeFilter === s.key ? 'All' : s.key as ExperimentStatus)}
              className="text-left p-4 rounded-[14px] bg-white transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)] hover:-translate-y-0.5"
              style={{
                boxShadow: activeFilter === s.key ? `0 0 0 2px ${s.color}, 0 4px 12px rgba(0,15,30,0.08)` : '0 1px 3px rgba(0,15,30,0.06)',
                border: '1px solid rgba(0,15,30,0.05)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              </div>
              <p className="text-[28px] font-bold text-[#111827] leading-none tracking-[-0.02em] tabular-nums mb-1">{counts[s.key] ?? 0}</p>
              <p className="text-[12px] text-[#6B7280]">{s.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-6 fade-up fade-up-2">
        <div className="relative flex-1">
          <Search size={14} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experiments..."
            className="w-full h-10 pl-9 pr-4 rounded-[10px] text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-200"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,15,30,0.04)' }}
            onFocus={(e) => { e.target.style.border = '1.5px solid #000F1E'; e.target.style.boxShadow = '0 0 0 3px rgba(0,15,30,0.06)'; }}
            onBlur={(e) => { e.target.style.border = '1px solid #E5E7EB'; e.target.style.boxShadow = '0 1px 2px rgba(0,15,30,0.04)'; }}
          />
        </div>
        <div className="flex gap-1.5">
          {(['All', 'Running', 'Planning', 'Complete', 'Blocked', 'Reported'] as const).map((s) => {
            const cnt = s === 'All' ? data.experiments.length : data.experiments.filter((e) => e.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setActiveFilter(s === 'All' ? 'All' : s as ExperimentStatus)}
                className="h-9 px-3 rounded-[8px] text-[12.5px] font-medium transition-all duration-200"
                style={{
                  background: activeFilter === s ? '#000F1E' : '#FFFFFF',
                  color: activeFilter === s ? '#FFFFFF' : '#4B5563',
                  border: '1px solid',
                  borderColor: activeFilter === s ? '#000F1E' : '#E5E7EB',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[12.5px] text-[#9CA3AF] mb-4 fade-up">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div
        className="bg-white rounded-[14px] overflow-hidden fade-up fade-up-3"
        style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)', border: '1px solid rgba(0,15,30,0.05)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,15,30,0.06)', background: '#FAFAFA' }}>
              {['Experiment', 'Status', 'Owner', 'Last Updated', ''].map((h, i) => (
                <th key={i} className="text-left px-5 py-3 text-[11px] font-semibold text-[#6B7280] tracking-[0.06em] uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((exp, i) => (
              <tr
                key={exp.id}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,15,30,0.04)' : 'none' }}
                className="hover:bg-[#FAFAFA] transition-colors group"
              >
                <td className="px-5 py-4">
                  <Link href={`/view/${slug}/experiments/${exp.id}`} className="text-[13.5px] font-semibold text-[#111827] group-hover:text-[#234474] transition-colors">
                    {exp.title}
                  </Link>
                </td>
                <td className="px-5 py-4"><StatusBadge status={exp.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[10px] font-bold text-[#374151]">
                      {exp.owner[0]}
                    </div>
                    <span className="text-[13px] text-[#4B5563]">{exp.owner}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-[13px] text-[#9CA3AF]">{exp.lastUpdated}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/view/${slug}/experiments/${exp.id}`}
                    className="flex items-center gap-0.5 text-[12.5px] font-semibold text-[#234474] hover:text-[#000F1E] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    View <ChevronRight size={13} strokeWidth={2} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-14">
            <p className="text-[14px] font-medium text-[#374151] mb-1">No experiments found</p>
            <p className="text-[13px] text-[#9CA3AF]">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
