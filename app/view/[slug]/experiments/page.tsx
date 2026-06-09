'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import { ExperimentStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

const STATUS_DOT: Record<string, string> = {
  Running: '#1565C0',
  Planning: '#939598',
  Complete: '#2E7D32',
  Blocked: '#C62828',
};

export default function ExperimentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExperimentStatus | 'All'>('All');

  const running = data.experiments.filter((e) => e.status === 'Running').length;
  const planning = data.experiments.filter((e) => e.status === 'Planning').length;
  const complete = data.experiments.filter((e) => e.status === 'Complete').length;
  const blocked = data.experiments.filter((e) => e.status === 'Blocked').length;

  const filtered = data.experiments.filter((e) => {
    const matchesFilter = activeFilter === 'All' || e.status === activeFilter;
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.owner.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-bold text-[#000F1E]">Experiments</h1>
          <p className="text-sm text-[#939598] mt-0.5">
            {data.experiments.length} experiments · <span className="text-[#E65100]">1 new since your last visit</span>
          </p>
        </div>
        <p className="text-sm text-[#939598] mt-2">Updated today at 8:14am</p>
      </div>

      {/* Status summary */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-[#000F1E] mb-4">Status summary</h2>
        <div className="flex gap-4">
          {[
            { label: 'Experiments running', count: running, color: '#1565C0', status: 'Running' as ExperimentStatus },
            { label: 'Planning', count: planning, color: '#939598', status: 'Planning' as ExperimentStatus },
            { label: 'Complete', count: complete, color: '#2E7D32', status: 'Complete' as ExperimentStatus },
            { label: 'Blocked', count: blocked, color: '#C62828', status: 'Blocked' as ExperimentStatus },
          ].map(({ label, count, color, status }) => (
            <button
              key={status}
              onClick={() => setActiveFilter(activeFilter === status ? 'All' : status)}
              className={`flex-1 border rounded-lg p-5 text-left transition-colors ${activeFilter === status ? 'border-[#000F1E] bg-[#F7F7F6]' : 'border-[#DAD9D6] bg-white hover:border-[#CACAC8]'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
              <p className="text-[32px] font-bold text-[#000F1E] leading-none mb-1">{count}</p>
              <p className="text-[13px] text-[#939598]">{label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Search */}
      <div className="mb-4">
        <p className="text-[12px] font-medium text-[#939598] uppercase tracking-wider mb-1.5">Search</p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full h-[42px] px-3.5 border border-[#DAD9D6] rounded-[4px] text-sm text-[#000F1E] placeholder:text-[#B7B8B9] outline-none focus:border-[#000F1E] transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#939598] uppercase tracking-wider mb-1.5">Filters</p>
        <div className="flex flex-wrap gap-2">
          {(['All', 'Running', 'Planning', 'Complete', 'Blocked', 'Reported'] as const).map((status) => {
            const count = status === 'All' ? data.experiments.length : data.experiments.filter((e) => e.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setActiveFilter(status === 'All' ? 'All' : status as ExperimentStatus)}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                  activeFilter === status
                    ? 'bg-[#000F1E] text-white border-[#000F1E]'
                    : 'bg-white text-[#464A4D] border-[#DAD9D6] hover:border-[#000F1E]'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[13px] text-[#939598] mb-4">{filtered.length} results</p>

      {/* Table */}
      <div className="border border-[#DAD9D6] rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#DAD9D6] bg-[#F7F7F6]">
              <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Experiment</th>
              <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Status</th>
              <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Owner</th>
              <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Last Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((exp) => (
              <tr key={exp.id} className="border-b border-[#DAD9D6] last:border-0 hover:bg-[#F7F7F6] transition-colors">
                <td className="px-4 py-3.5">
                  <Link href={`/view/${slug}/experiments/${exp.id}`} className="text-sm font-medium text-[#000F1E] hover:text-[#234474] transition-colors">
                    {exp.title}
                  </Link>
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={exp.status} /></td>
                <td className="px-4 py-3.5 text-sm text-[#464A4D]">{exp.owner}</td>
                <td className="px-4 py-3.5 text-sm text-[#464A4D]">{exp.lastUpdated}</td>
                <td className="px-4 py-3.5">
                  <Link href={`/view/${slug}/experiments/${exp.id}`} className="text-[13px] text-[#234474] font-medium hover:text-[#1A2D45]">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#939598] text-sm">No experiments match your search.</div>
        )}
      </div>
    </div>
  );
}
