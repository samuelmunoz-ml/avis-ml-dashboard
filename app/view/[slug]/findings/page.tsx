'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import { Finding, FindingStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { ArrowUpRight } from 'lucide-react';

const ALL_STATUSES: FindingStatus[] = ['Reported', 'Acknowledged', 'Fix in progress', 'Resolved'];

export default function FindingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();
  const [activeFilter, setActiveFilter] = useState<FindingStatus | 'All'>('All');
  const seen = new Set(data.seenFindings[slug] ?? []);

  const filtered = activeFilter === 'All' ? data.findings : data.findings.filter((f) => f.status === activeFilter);
  const unseenCount = data.findings.filter((f) => !seen.has(f.id)).length;

  const counts: Record<string, number> = { All: data.findings.length };
  ALL_STATUSES.forEach((s) => { counts[s] = data.findings.filter((f) => f.status === s).length; });

  const pinnedFindings = filtered.filter((f) => f.isPinned);
  const otherFindings = filtered.filter((f) => !f.isPinned);

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Research dashboard</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Findings</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            {data.findings.length} total
            {unseenCount > 0 && <span className="text-[#C2410C] font-medium"> · {unseenCount} new since your last visit</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <p className="text-[12.5px] text-[#9CA3AF]">Updated today at 8:14am</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-7 fade-up fade-up-1">
        {(['All', ...ALL_STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className="h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-all duration-200"
            style={{
              background: activeFilter === status ? '#000F1E' : '#FFFFFF',
              color: activeFilter === status ? '#FFFFFF' : '#4B5563',
              border: '1px solid',
              borderColor: activeFilter === status ? '#000F1E' : '#E5E7EB',
              boxShadow: activeFilter === status ? '0 1px 3px rgba(0,15,30,0.2)' : '0 1px 2px rgba(0,15,30,0.04)',
            }}
          >
            {status} <span className="opacity-60 ml-0.5">({counts[status] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Key findings */}
      {pinnedFindings.length > 0 && (
        <section className="mb-8 fade-up fade-up-2">
          <p className="text-[11.5px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">Key findings</p>
          <div className="grid grid-cols-2 gap-4">
            {pinnedFindings.map((f) => <FindingCard key={f.id} finding={f} slug={slug} isNew={!seen.has(f.id)} />)}
          </div>
        </section>
      )}

      {/* All findings */}
      {otherFindings.length > 0 && (
        <section className="fade-up fade-up-3">
          {pinnedFindings.length > 0 && (
            <p className="text-[11.5px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">All findings</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {otherFindings.map((f) => <FindingCard key={f.id} finding={f} slug={slug} isNew={!seen.has(f.id)} />)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 fade-up">
          <p className="text-[15px] font-medium text-[#374151] mb-1">No findings match this filter</p>
          <p className="text-[13px] text-[#9CA3AF]">Try selecting a different status above</p>
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding, slug, isNew }: { finding: Finding; slug: string; isNew: boolean }) {
  return (
    <Link href={`/view/${slug}/findings/${finding.id}`} className="block group">
      <div
        className="bg-white rounded-[14px] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,15,30,0.10)] hover:-translate-y-0.5"
        style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)', border: '1px solid rgba(0,15,30,0.05)' }}
      >
        <div className="p-5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            {isNew && <StatusBadge status="New" />}
            <StatusBadge status={finding.status} />
          </div>

          <h3 className="text-[15px] font-semibold text-[#111827] leading-snug mb-2 group-hover:text-[#234474] transition-colors">
            {finding.title}
          </h3>
          <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2 mb-4">{finding.description}</p>

          {/* Image thumbnails */}
          <div className="grid grid-cols-2 gap-2 mb-4 h-[90px]">
            {[0, 1].map((i) =>
              finding.images[i] ? (
                <img key={i} src={finding.images[i]} alt="" className="w-full h-full object-cover rounded-[8px]" />
              ) : (
                <div key={i} className="rounded-[8px] overflow-hidden h-full" style={{ background: 'repeating-linear-gradient(45deg, #F3F4F6 0px, #F3F4F6 1px, #FAFAFA 1px, #FAFAFA 16px)' }} />
              )
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-[#9CA3AF]">Added {finding.dateAdded}</span>
            <span className="text-[12.5px] font-semibold text-[#234474] flex items-center gap-0.5 group-hover:text-[#000F1E] transition-colors">
              View detail <ArrowUpRight size={12} strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
