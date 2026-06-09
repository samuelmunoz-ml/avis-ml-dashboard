'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import { Finding, FindingStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

const ALL_STATUSES: FindingStatus[] = ['Reported', 'Acknowledged', 'Fix in progress', 'Resolved'];

function CheckerImage() {
  return (
    <div className="w-full h-full"
      style={{
        backgroundImage: 'linear-gradient(45deg, #EFF0F0 25%, transparent 25%), linear-gradient(-45deg, #EFF0F0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EFF0F0 75%), linear-gradient(-45deg, transparent 75%, #EFF0F0 75%)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        backgroundColor: '#F7F7F6',
      }}
    />
  );
}

export default function FindingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();
  const [activeFilter, setActiveFilter] = useState<FindingStatus | 'All'>('All');
  const seen = new Set(data.seenFindings[slug] ?? []);

  const filtered = activeFilter === 'All'
    ? data.findings
    : data.findings.filter((f) => f.status === activeFilter);

  const counts: Record<string, number> = { All: data.findings.length };
  ALL_STATUSES.forEach((s) => {
    counts[s] = data.findings.filter((f) => f.status === s).length;
  });

  const pinnedFindings = filtered.filter((f) => f.isPinned);
  const otherFindings = filtered.filter((f) => !f.isPinned);
  const unseenCount = data.findings.filter((f) => !seen.has(f.id)).length;

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[36px] font-bold text-[#000F1E]">Findings</h1>
          <p className="text-sm text-[#939598] mt-0.5">
            {data.findings.length} findings
            {unseenCount > 0 && <span className="text-[#E65100]"> · {unseenCount} new since your last visit</span>}
          </p>
        </div>
        <p className="text-sm text-[#939598] mt-2">Updated today at 8:14am</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#939598] uppercase tracking-wider mb-2">Filters</p>
        <div className="flex flex-wrap gap-2">
          {(['All', ...ALL_STATUSES] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                activeFilter === status
                  ? 'bg-[#000F1E] text-white border-[#000F1E]'
                  : 'bg-white text-[#464A4D] border-[#DAD9D6] hover:border-[#000F1E]'
              }`}
            >
              {status} ({counts[status] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Key findings (pinned) */}
      {pinnedFindings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[18px] font-semibold text-[#000F1E] mb-4">Key findings</h2>
          <div className="grid grid-cols-2 gap-4">
            {pinnedFindings.map((f) => (
              <FindingCard key={f.id} finding={f} slug={slug} isNew={!seen.has(f.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Remaining findings */}
      {otherFindings.length > 0 && (
        <section>
          {pinnedFindings.length > 0 && (
            <h2 className="text-[18px] font-semibold text-[#000F1E] mb-4">All findings</h2>
          )}
          <div className="grid grid-cols-2 gap-4">
            {otherFindings.map((f) => (
              <FindingCard key={f.id} finding={f} slug={slug} isNew={!seen.has(f.id)} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#939598]">
          <p className="text-sm">No findings match this filter.</p>
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding, slug, isNew }: { finding: Finding; slug: string; isNew: boolean }) {
  return (
    <Link href={`/view/${slug}/findings/${finding.id}`} className="block group">
      <div className="border border-[#DAD9D6] rounded-lg overflow-hidden bg-white hover:border-[#CACAC8] transition-colors">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {isNew && <StatusBadge status="New" />}
            <StatusBadge status={finding.status} />
          </div>
          <h3 className="text-[15px] font-semibold text-[#000F1E] leading-snug mb-2 group-hover:text-[#234474] transition-colors">
            {finding.title}
          </h3>
          <p className="text-[13px] text-[#939598] leading-relaxed line-clamp-2 mb-3">{finding.description}</p>
          {finding.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mb-3 h-28">
              {finding.images.slice(0, 2).map((img, i) => (
                <img key={i} src={img} alt="" className="w-full h-full object-cover rounded" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3 h-28">
              <div className="rounded overflow-hidden"><div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #EFF0F0 25%, transparent 25%), linear-gradient(-45deg, #EFF0F0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EFF0F0 75%), linear-gradient(-45deg, transparent 75%, #EFF0F0 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px', backgroundColor: '#F7F7F6' }} /></div>
              <div className="rounded overflow-hidden"><div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #EFF0F0 25%, transparent 25%), linear-gradient(-45deg, #EFF0F0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EFF0F0 75%), linear-gradient(-45deg, transparent 75%, #EFF0F0 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px', backgroundColor: '#F7F7F6' }} /></div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#939598]">Added {finding.dateAdded}</span>
            <span className="text-[13px] text-[#234474] font-medium group-hover:text-[#1A2D45]">View detail</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
