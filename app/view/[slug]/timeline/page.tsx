'use client';
import { use } from 'react';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';

const ENGAGEMENT_START = new Date('2026-05-18');
const ENGAGEMENT_END = new Date('2026-09-07');
const TOTAL_DAYS = (ENGAGEMENT_END.getTime() - ENGAGEMENT_START.getTime()) / 86400000;
const TODAY = new Date('2026-06-10');
const todayPct = Math.min(100, ((TODAY.getTime() - ENGAGEMENT_START.getTime()) / 86400000 / TOTAL_DAYS) * 100);

const MONTH_LABELS = [
  { label: 'May', pct: 0 },
  { label: 'Jun', pct: (13 / TOTAL_DAYS) * 100 },
  { label: 'Jul', pct: (44 / TOTAL_DAYS) * 100 },
  { label: 'Aug', pct: (75 / TOTAL_DAYS) * 100 },
  { label: 'Sep', pct: (107 / TOTAL_DAYS) * 100 },
];

const MONTHS: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
function datePct(str: string) {
  const [m, d] = str.split(' ');
  const dt = new Date(2026, MONTHS[m], parseInt(d));
  return Math.max(0, Math.min(100, ((dt.getTime() - ENGAGEMENT_START.getTime()) / 86400000 / TOTAL_DAYS) * 100));
}

const PHASE_COLORS: Record<string, string> = {
  'tp-1': '#3B82F6',
  'tp-2': '#8B5CF6',
  'tp-3': '#10B981',
  'tp-4': '#F97316',
  'tp-5': '#06B6D4',
};

const MILESTONE_BADGE: Record<string, string> = {
  Complete: '#22C55E',
  'In Progress': '#3B82F6',
  Upcoming: '#9CA3AF',
};

export default function TimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Research dashboard</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Timeline</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-1">May 18 – Sep 7, 2026 · 16 weeks · Week 7 of 16</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <p className="text-[12.5px] text-[#9CA3AF]">Updated today at 8:14am</p>
        </div>
      </div>

      {/* Context */}
      <div className="bg-white rounded-[14px] p-5 mb-7 fade-up fade-up-1" style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
        <p className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.1em] mb-2">Engagement context</p>
        <p className="text-[13.5px] text-[#4B5563] leading-[1.7]">
          The engagement runs 16 weeks from May 18 to September 7, 2026. The team is currently in week 7 — midway through the experimentation phase. All discovery and analysis deliverables have been completed on schedule. The mid-engagement review on July 10 will serve as the primary checkpoint with ABG leadership before synthesis begins.
        </p>
      </div>

      {/* Gantt */}
      <div className="bg-white rounded-[14px] p-6 mb-7 fade-up fade-up-2" style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
        <p className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.1em] mb-5">Phase timeline</p>

        {/* Month ruler */}
        <div className="ml-36 relative h-5 mb-1">
          {MONTH_LABELS.map((m) => (
            <span
              key={m.label}
              className="absolute text-[11px] text-[#9CA3AF] font-medium -translate-x-1/2"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Grid lines */}
        <div className="ml-36 relative h-px bg-[#F3F4F6] mb-4">
          {MONTH_LABELS.map((m) => (
            <div key={m.label} className="absolute top-0 w-px h-2 bg-[#E5E7EB] -translate-x-px" style={{ left: `${m.pct}%` }} />
          ))}
        </div>

        {/* Phases */}
        <div className="space-y-3">
          {data.timelinePhases.map((phase) => {
            const startPct = datePct(phase.startDate);
            const endPct = datePct(phase.endDate);
            const width = endPct - startPct;
            const color = PHASE_COLORS[phase.id] ?? '#6B7280';

            return (
              <div key={phase.id} className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#374151]">{phase.name}</p>
                    <p className="text-[10.5px] text-[#9CA3AF]">{phase.startDate} – {phase.endDate}</p>
                  </div>
                </div>
                <div className="flex-1 relative h-8 bg-[#F3F4F6] rounded-lg overflow-hidden">
                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 w-[2px] z-10" style={{ left: `${todayPct}%`, background: '#F43F5E' }}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
                  </div>
                  {/* Phase bar */}
                  <div
                    className="absolute top-[6px] bottom-[6px] rounded-md transition-all duration-700"
                    style={{
                      left: `${startPct}%`,
                      width: `${width}%`,
                      background: phase.status === 'upcoming' ? '#E5E7EB' : color,
                      opacity: phase.status === 'upcoming' ? 0.5 : 1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}>
          {[
            { label: 'Completed', color: '#22C55E' },
            { label: 'In progress', color: '#3B82F6' },
            { label: 'Upcoming', color: '#E5E7EB' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11.5px] text-[#6B7280]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11.5px] text-[#6B7280]">
            <span className="w-0.5 h-3 rounded bg-[#F43F5E]" />
            Today
          </span>
        </div>
      </div>

      {/* Milestones */}
      <section className="fade-up fade-up-3">
        <p className="text-[11.5px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-4">Key milestones</p>
        <div className="grid grid-cols-2 gap-4">
          {data.milestones.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-[14px] p-5 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)]"
              style={{
                boxShadow: '0 1px 3px rgba(0,15,30,0.06)',
                border: m.isHighlighted ? `1.5px solid #3B82F6` : '1px solid rgba(0,15,30,0.05)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={m.status} />
                {m.isHighlighted && (
                  <span className="text-[10.5px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full">Upcoming checkpoint</span>
                )}
              </div>
              <h3 className={`text-[13.5px] font-semibold leading-snug mb-1.5 ${
                m.status === 'Complete' ? 'text-[#15803D]' :
                m.isHighlighted ? 'text-[#1D4ED8]' : 'text-[#111827]'
              }`}>
                {m.title}
              </h3>
              <p className="text-[11.5px] font-medium text-[#9CA3AF] mb-2">{m.date}</p>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
