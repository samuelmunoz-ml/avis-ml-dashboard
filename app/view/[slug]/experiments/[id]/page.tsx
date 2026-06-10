'use client';
import { use } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { ChevronRight, ArrowUpRight } from 'lucide-react';

export default function ExperimentDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { data } = useData();
  const experiment = data.experiments.find((e) => e.id === id);

  if (!experiment) return (
    <div className="p-8 text-center">
      <p className="text-[#6B7280] text-[15px]">Experiment not found.</p>
      <Link href={`/view/${slug}/experiments`} className="text-[#234474] text-[13px] mt-2 inline-block font-medium">← Back</Link>
    </div>
  );

  const relatedFindings = data.findings.filter((f) => experiment.relatedFindingIds.includes(f.id));

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 mb-6 text-[12.5px] fade-up">
        <Link href={`/view/${slug}/experiments`} className="text-[#234474] font-medium hover:text-[#000F1E] transition-colors">Experiments</Link>
        <ChevronRight size={13} className="text-[#D1D5DB]" />
        <span className="text-[#9CA3AF] truncate max-w-[280px]">{experiment.title}</span>
      </nav>

      <div className="flex gap-7">
        {/* Main */}
        <div className="flex-1 min-w-0 fade-up fade-up-1">
          <StatusBadge status={experiment.status} className="mb-4" />
          <h1 className="text-[26px] font-bold text-[#111827] tracking-[-0.02em] leading-tight mb-2">{experiment.title}</h1>
          <p className="text-[12.5px] text-[#9CA3AF] mb-8">Started {experiment.startDate} · Updated {experiment.lastUpdated}</p>

          {/* Hypothesis */}
          <div
            className="rounded-[12px] p-5 mb-8"
            style={{ background: '#F0F7FF', border: '1px solid #DBEAFE', borderLeft: '3px solid #3B82F6' }}
          >
            <p className="text-[10.5px] font-bold text-[#1D4ED8] uppercase tracking-[0.14em] mb-2">Hypothesis</p>
            <p className="text-[14px] text-[#1E3A8A] leading-relaxed">{experiment.hypothesis}</p>
          </div>

          {/* Approach */}
          <div className="mb-8">
            <p className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.1em] mb-3">Approach</p>
            <p className="text-[14px] text-[#4B5563] leading-[1.75]">{experiment.approach}</p>
          </div>

          {/* Metrics */}
          <div className="mb-8">
            <p className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.1em] mb-4">Outcome metrics</p>
            <div className="grid grid-cols-3 gap-3">
              {experiment.metrics.map((m, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[12px] p-4"
                  style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}
                >
                  <p className="text-[26px] font-bold text-[#111827] leading-none tracking-[-0.02em] tabular-nums mb-1.5">{m.value}</p>
                  <p className="text-[12px] text-[#6B7280] mb-1.5 leading-snug">{m.label}</p>
                  {m.subtext && (
                    <p className={`text-[11.5px] font-medium ${m.inProgress ? 'text-[#9CA3AF]' : (m.subtext.startsWith('↓') || m.subtext.startsWith('↑')) ? 'text-[#15803D]' : 'text-[#9CA3AF]'}`}>
                      {m.subtext}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div
            className="bg-white rounded-[12px] p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.1em]">Outcome</p>
              <StatusBadge status={experiment.outcomeStatus} />
            </div>
            <p className="text-[14px] text-[#4B5563] leading-relaxed">{experiment.outcome}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[260px] flex-shrink-0 space-y-4 fade-up fade-up-2">
          <div className="bg-white rounded-[14px] p-5" style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
            <p className="text-[11.5px] font-bold text-[#374151] mb-4 uppercase tracking-[0.06em]">Metadata</p>
            <dl className="space-y-3.5">
              {[
                { label: 'STATUS', value: <StatusBadge status={experiment.status} /> },
                { label: 'SITE', value: experiment.site },
                { label: 'CATEGORY', value: experiment.category },
                { label: 'SEVERITY', value: <span className={`font-semibold text-[13px] ${experiment.severity === 'High' ? 'text-[#BE123C]' : 'text-[#C2410C]'}`}>{experiment.severity}</span> },
                { label: 'ADDED BY', value: experiment.addedBy },
                { label: 'DATE ADDED', value: experiment.startDate },
                { label: 'LAST UPDATED', value: experiment.lastUpdated },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.06em] mt-0.5">{label}</dt>
                  <dd className="text-[12.5px] text-[#111827] font-medium text-right max-w-[140px]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {relatedFindings.length > 0 && (
            <div className="bg-white rounded-[14px] p-5" style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
              <p className="text-[11.5px] font-bold text-[#374151] mb-4 uppercase tracking-[0.06em]">Related findings</p>
              {relatedFindings.map((rf) => (
                <div key={rf.id}>
                  <p className="text-[13.5px] font-semibold text-[#111827] mb-2 leading-snug">{rf.title}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status="New" />
                    <StatusBadge status={rf.status} />
                  </div>
                  <Link href={`/view/${slug}/findings/${rf.id}`} className="text-[12.5px] font-semibold text-[#234474] hover:text-[#000F1E] flex items-center gap-0.5 transition-colors">
                    View detail <ArrowUpRight size={12} strokeWidth={2} />
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
