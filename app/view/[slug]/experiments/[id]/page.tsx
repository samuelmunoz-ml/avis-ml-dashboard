'use client';
import { use } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';

export default function ExperimentDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { data } = useData();
  const experiment = data.experiments.find((e) => e.id === id);

  if (!experiment) {
    return (
      <div className="p-8 text-center text-[#939598]">
        <p>Experiment not found.</p>
        <Link href={`/view/${slug}/experiments`} className="text-[#234474] text-sm mt-2 inline-block">← Back to experiments</Link>
      </div>
    );
  }

  const relatedFindings = data.findings.filter((f) => experiment.relatedFindingIds.includes(f.id));

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[13px]">
        <Link href={`/view/${slug}/experiments`} className="text-[#234474] hover:text-[#1A2D45]">Experiments</Link>
        <span className="text-[#939598]">›</span>
        <span className="text-[#939598] truncate max-w-[300px]">{experiment.title}</span>
      </div>

      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[32px] font-bold text-[#000F1E] leading-tight mb-3">{experiment.title}</h1>
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={experiment.status} />
          </div>
          <p className="text-[13px] text-[#939598] mb-8">
            Started {experiment.startDate} — Updated {experiment.lastUpdated}
          </p>

          {/* Hypothesis */}
          <div className="border-l-[3px] border-[#234474] pl-4 mb-8 bg-[#F7F7F6] py-4 pr-4 rounded-r-lg">
            <p className="text-[12px] font-semibold text-[#234474] uppercase tracking-widest mb-2">HYPOTHESIS</p>
            <p className="text-sm text-[#464A4D] leading-relaxed">{experiment.hypothesis}</p>
          </div>

          {/* Approach */}
          <div className="mb-8">
            <h2 className="text-[13px] font-semibold text-[#000F1E] uppercase tracking-widest mb-3">APPROACH</h2>
            <p className="text-sm text-[#464A4D] leading-relaxed">{experiment.approach}</p>
          </div>

          {/* Outcome metrics */}
          <div className="mb-8">
            <h2 className="text-[13px] font-semibold text-[#000F1E] uppercase tracking-widest mb-4">OUTCOME METRICS</h2>
            <div className="grid grid-cols-3 gap-4">
              {experiment.metrics.map((m, i) => (
                <div key={i} className="border border-[#DAD9D6] rounded-lg p-4 bg-white">
                  <p className="text-[28px] font-bold text-[#000F1E] leading-none mb-1">{m.value}</p>
                  <p className="text-[13px] text-[#939598] mb-1.5">{m.label}</p>
                  {m.subtext && (
                    <p className={`text-[12px] ${m.inProgress ? 'text-[#939598]' : m.subtext.startsWith('↓') || m.subtext.startsWith('↑') ? 'text-[#2E7D32]' : 'text-[#939598]'}`}>
                      {m.subtext}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-[13px] font-semibold text-[#000F1E] uppercase tracking-widest">OUTCOME</h2>
              <StatusBadge status={experiment.outcomeStatus} />
            </div>
            <p className="text-sm text-[#464A4D] leading-relaxed">{experiment.outcome}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-6">
          <div className="border border-[#DAD9D6] rounded-lg p-5 bg-white">
            <h3 className="text-[15px] font-semibold text-[#000F1E] mb-4">Metadata</h3>
            <dl className="space-y-3">
              <div className="flex justify-between items-start">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">STATUS</dt>
                <dd><StatusBadge status={experiment.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">SITE</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{experiment.site}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">CATEGORY</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium text-right max-w-[140px]">{experiment.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">SEVERITY</dt>
                <dd className={`text-[13px] font-semibold ${experiment.severity === 'High' ? 'text-[#C62828]' : experiment.severity === 'Medium' ? 'text-[#E65100]' : 'text-[#2E7D32]'}`}>
                  {experiment.severity}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">ADDED BY</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{experiment.addedBy}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">DATE ADDED</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{experiment.startDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[12px] font-medium text-[#939598] uppercase tracking-wide">LAST UPDATED</dt>
                <dd className="text-[13px] text-[#000F1E] font-medium">{experiment.lastUpdated}</dd>
              </div>
            </dl>
          </div>

          {relatedFindings.length > 0 && (
            <div className="border border-[#DAD9D6] rounded-lg p-5 bg-white">
              <h3 className="text-[15px] font-semibold text-[#000F1E] mb-4">Related findings</h3>
              {relatedFindings.map((rf) => (
                <div key={rf.id} className="mb-4 last:mb-0">
                  <p className="text-[14px] font-medium text-[#000F1E] mb-2">{rf.title}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status="New" />
                    <StatusBadge status={rf.status} />
                  </div>
                  <Link href={`/view/${slug}/findings/${rf.id}`} className="text-[13px] text-[#234474] font-medium hover:text-[#1A2D45]">
                    View detail
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
