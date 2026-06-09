'use client';
import { use } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';

function MetricCard({
  label,
  value,
  subtext,
  subtextColor,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  subtextColor?: string;
}) {
  return (
    <div className="flex-1 min-w-0 border border-[#DAD9D6] rounded-lg p-5 bg-white">
      <p className="text-[13px] text-[#939598] mb-2">{label}</p>
      <p className="text-[32px] font-bold text-[#000F1E] leading-none mb-1.5">{value}</p>
      {subtext && (
        <p className={`text-[13px] ${subtextColor ?? 'text-[#939598]'}`}>{subtext}</p>
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
      <div className="border border-[#DAD9D6] rounded-lg overflow-hidden bg-white hover:border-[#CACAC8] transition-colors">
        <div className="relative h-36 bg-[#F7F7F6]">
          {finding.images[0] ? (
            <img src={finding.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #EFF0F0 25%, transparent 25%), linear-gradient(-45deg, #EFF0F0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EFF0F0 75%), linear-gradient(-45deg, transparent 75%, #EFF0F0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              />
            </div>
          )}
          {isNew && (
            <span className="absolute top-3 right-3 bg-[#E65100] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
              New
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-[15px] font-semibold text-[#000F1E] leading-snug mb-1.5 group-hover:text-[#234474] transition-colors">
            {finding.title}
          </h3>
          <p className="text-[13px] text-[#939598] leading-relaxed line-clamp-2 mb-3">{finding.description}</p>
          <StatusBadge status={finding.status} />
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
    <div className="p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-bold text-[#000F1E] leading-tight">Overview</h1>
          <p className="text-sm text-[#939598] mt-0.5">Avis Budget Group</p>
        </div>
        <p className="text-sm text-[#939598] mt-2">Updated today at 8:14am</p>
      </div>

      {/* Key metrics */}
      <section className="mb-10">
        <h2 className="text-[18px] font-semibold text-[#000F1E] mb-4">Key metrics</h2>
        <div className="flex gap-4">
          <MetricCard
            label="Active findings"
            value={activeFindings}
            subtext="↑ 3 since last week"
            subtextColor="text-[#2E7D32]"
          />
          <MetricCard
            label="Experiments running"
            value={runningExperiments}
            subtext="2 completed this week"
          />
          <MetricCard
            label="Anomaly rate"
            value="9.7%"
            subtext="↓ Highest since cutover"
            subtextColor="text-[#C62828]"
          />
          <MetricCard
            label="Resolved findings"
            value={resolvedFindings}
            subtext="✓ 2 resolved this week"
            subtextColor="text-[#2E7D32]"
          />
        </div>
      </section>

      {/* Key findings */}
      <section className="mb-10">
        <h2 className="text-[18px] font-semibold text-[#000F1E] mb-4">Key findings</h2>
        <div className="grid grid-cols-3 gap-4">
          {pinnedFindings.map((f) => (
            <FindingCard key={f.id} finding={f} slug={slug} isNew={!seen.has(f.id)} />
          ))}
        </div>
      </section>

      {/* Experiments */}
      <section className="mb-10">
        <h2 className="text-[18px] font-semibold text-[#000F1E] mb-4">Experiments</h2>
        <div className="border border-[#DAD9D6] rounded-lg overflow-hidden bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#DAD9D6] bg-[#F7F7F6]">
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Experiment</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Status</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Owner</th>
                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#234474]">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentExperiments.map((exp, i) => (
                <tr key={exp.id} className={`border-b border-[#DAD9D6] last:border-0 hover:bg-[#F7F7F6] transition-colors`}>
                  <td className="px-4 py-3.5">
                    <Link href={`/view/${slug}/experiments/${exp.id}`} className="text-sm text-[#000F1E] hover:text-[#234474] transition-colors">
                      {exp.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={exp.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#464A4D]">{exp.owner}</td>
                  <td className="px-4 py-3.5 text-sm text-[#464A4D]">{exp.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Timeline snapshot */}
      <section>
        <h2 className="text-[18px] font-semibold text-[#000F1E] mb-4">Timeline</h2>
        <div className="border border-[#DAD9D6] rounded-lg bg-white p-5">
          <div className="flex items-center gap-4 mb-4 text-[12px] text-[#939598]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-[#2E7D32] inline-block" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-[#1565C0] inline-block" /> In Progress</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-[#DAD9D6] inline-block" /> Upcoming</span>
            <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-[#C62828] inline-block" /> Today</span>
          </div>
          <div className="space-y-2.5">
            {data.timelinePhases.map((phase) => (
              <div key={phase.id} className="flex items-center gap-4">
                <span className="w-28 text-[13px] text-[#464A4D] text-right">{phase.name}</span>
                <div className="flex-1 h-5 bg-[#EFF0F0] rounded relative">
                  <div
                    className="h-full rounded"
                    style={{
                      width: phase.status === 'completed' ? '35%' : phase.status === 'in_progress' ? '22%' : '0%',
                      backgroundColor: phase.status === 'completed' ? '#2E7D32' : phase.status === 'in_progress' ? '#1565C0' : '#DAD9D6',
                    }}
                  />
                </div>
                <span className="w-32 text-[12px] text-[#939598]">{phase.startDate} – {phase.endDate}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <Link href={`/view/${slug}/timeline`} className="text-sm text-[#234474] font-medium hover:text-[#1A2D45] transition-colors">
            View full timeline →
          </Link>
        </div>
      </section>
    </div>
  );
}
