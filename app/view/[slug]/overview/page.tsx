'use client';
import { use } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ChevronRight } from 'lucide-react';

function MetricCard({
  label,
  value,
  subtext,
  trend,
  accentColor,
  delay,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor: string;
  delay?: number;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#15803D' : trend === 'down' ? '#BE123C' : '#6B7280';

  return (
    <div
      className="bg-white rounded-[14px] p-5 fade-up flex flex-col gap-3 transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,15,30,0.10)] hover:-translate-y-0.5"
      style={{
        boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)',
        border: '1px solid rgba(0,15,30,0.05)',
        animationDelay: `${delay ?? 0}ms`,
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[12.5px] font-medium text-[#6B7280]">{label}</p>
        <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: accentColor + '18' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
        </div>
      </div>
      <div>
        <p className="text-[32px] font-bold text-[#111827] leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      </div>
      {subtext && (
        <div className="flex items-center gap-1.5">
          <TrendIcon size={13} strokeWidth={2} style={{ color: trendColor }} />
          <span className="text-[12px] font-medium" style={{ color: trendColor }}>{subtext}</span>
        </div>
      )}
    </div>
  );
}

function FindingCard({
  finding,
  slug,
  isNew,
}: {
  finding: { id: string; title: string; description: string; status: string; images: string[] };
  slug: string;
  isNew: boolean;
}) {
  return (
    <Link href={`/view/${slug}/findings/${finding.id}`} className="block group">
      <div
        className="bg-white rounded-[14px] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,15,30,0.10)] hover:-translate-y-0.5"
        style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)', border: '1px solid rgba(0,15,30,0.05)' }}
      >
        {/* Thumbnail */}
        <div className="relative h-[130px] overflow-hidden" style={{ background: '#F3F4F6' }}>
          {finding.images[0] ? (
            <img src={finding.images[0]} alt={finding.title} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  #E5E7EB 0px,
                  #E5E7EB 1px,
                  transparent 1px,
                  transparent 50%
                )`,
                backgroundSize: '18px 18px',
                background: 'repeating-linear-gradient(45deg, #F3F4F6 0px, #F3F4F6 1px, #FAFAFA 1px, #FAFAFA 18px)',
              }}
            />
          )}
          {isNew && (
            <span className="absolute top-3 right-3 bg-[#C2410C] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              New
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-[14px] font-semibold text-[#111827] leading-snug mb-1.5 group-hover:text-[#234474] transition-colors line-clamp-2">
            {finding.title}
          </h3>
          <p className="text-[12.5px] text-[#6B7280] leading-relaxed line-clamp-2 mb-3">{finding.description}</p>
          <div className="flex items-center justify-between">
            <StatusBadge status={finding.status} />
            <span className="text-[12px] font-medium text-[#9CA3AF] flex items-center gap-0.5 group-hover:text-[#234474] transition-colors">
              View <ArrowUpRight size={11} strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function OverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();
  const seen = new Set(data.seenFindings[slug] ?? []);
  const pinnedFindings = data.findings.filter((f) => f.isPinned).slice(0, 3);
  const recentExperiments = data.experiments.slice(0, 4);

  const activeFindings = data.findings.filter((f) => f.status !== 'Resolved').length;
  const runningExperiments = data.experiments.filter((e) => e.status === 'Running').length;
  const resolvedFindings = data.findings.filter((f) => f.status === 'Resolved').length;

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Avis Budget Group</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Overview</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <p className="text-[12.5px] text-[#9CA3AF]">Updated today at 8:14am</p>
        </div>
      </div>

      {/* Key metrics */}
      <section className="mb-8">
        <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">Key metrics</p>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Active findings" value={activeFindings} subtext="3 since last week" trend="up" accentColor="#F97316" delay={0} />
          <MetricCard label="Experiments running" value={runningExperiments} subtext="2 completed this week" trend="neutral" accentColor="#3B82F6" delay={60} />
          <MetricCard label="Anomaly rate" value="9.7%" subtext="Highest since cutover" trend="down" accentColor="#F43F5E" delay={120} />
          <MetricCard label="Resolved findings" value={resolvedFindings} subtext="2 resolved this week" trend="up" accentColor="#22C55E" delay={180} />
        </div>
      </section>

      {/* Key findings */}
      <section className="mb-8 fade-up fade-up-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em]">Key findings</p>
          <Link href={`/view/${slug}/findings`} className="text-[12.5px] font-medium text-[#234474] hover:text-[#000F1E] flex items-center gap-0.5 transition-colors">
            View all <ChevronRight size={13} strokeWidth={2} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {pinnedFindings.map((f) => (
            <FindingCard key={f.id} finding={f} slug={slug} isNew={!seen.has(f.id)} />
          ))}
        </div>
      </section>

      {/* Experiments */}
      <section className="mb-8 fade-up fade-up-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em]">Experiments</p>
          <Link href={`/view/${slug}/experiments`} className="text-[12.5px] font-medium text-[#234474] hover:text-[#000F1E] flex items-center gap-0.5 transition-colors">
            View all <ChevronRight size={13} strokeWidth={2} />
          </Link>
        </div>
        <div
          className="bg-white rounded-[14px] overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)', border: '1px solid rgba(0,15,30,0.05)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,15,30,0.06)', background: '#FAFAFA' }}>
                {['Experiment', 'Status', 'Owner', 'Last Updated'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11.5px] font-semibold text-[#6B7280] tracking-[0.04em] uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentExperiments.map((exp, i) => (
                <tr
                  key={exp.id}
                  style={{ borderBottom: i < recentExperiments.length - 1 ? '1px solid rgba(0,15,30,0.04)' : 'none' }}
                  className="hover:bg-[#FAFAFA] transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <Link href={`/view/${slug}/experiments/${exp.id}`} className="text-[13.5px] font-medium text-[#111827] group-hover:text-[#234474] transition-colors">
                      {exp.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={exp.status} /></td>
                  <td className="px-5 py-3.5 text-[13px] text-[#6B7280]">{exp.owner}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#6B7280]">{exp.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Timeline snapshot */}
      <section className="fade-up fade-up-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em]">Timeline</p>
          <Link href={`/view/${slug}/timeline`} className="text-[12.5px] font-medium text-[#234474] hover:text-[#000F1E] flex items-center gap-0.5 transition-colors">
            Full timeline <ChevronRight size={13} strokeWidth={2} />
          </Link>
        </div>
        <div
          className="bg-white rounded-[14px] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)', border: '1px solid rgba(0,15,30,0.05)' }}
        >
          <div className="flex items-center gap-4 mb-5 text-[11.5px] text-[#9CA3AF]">
            {[
              { label: 'Completed', color: '#22C55E' },
              { label: 'In Progress', color: '#3B82F6' },
              { label: 'Upcoming', color: '#E5E7EB' },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-0.5 h-3 bg-[#F43F5E] rounded" />
              Today
            </span>
          </div>
          <div className="space-y-2.5">
            {data.timelinePhases.map((phase) => (
              <div key={phase.id} className="flex items-center gap-4">
                <span className="w-28 text-[12.5px] font-medium text-[#374151] text-right shrink-0">{phase.name}</span>
                <div className="flex-1 h-[6px] bg-[#F3F4F6] rounded-full relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: phase.status === 'completed' ? '100%' : phase.status === 'in_progress' ? '45%' : '0%',
                      background: phase.status === 'completed' ? '#22C55E' : phase.status === 'in_progress' ? '#3B82F6' : '#E5E7EB',
                    }}
                  />
                </div>
                <span className="w-32 text-[11px] text-[#9CA3AF] shrink-0">{phase.startDate} – {phase.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
