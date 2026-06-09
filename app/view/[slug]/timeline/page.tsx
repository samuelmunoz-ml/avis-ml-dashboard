'use client';
import { use } from 'react';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';

// Gantt helpers
const ENGAGEMENT_START = new Date('2026-05-18');
const ENGAGEMENT_END = new Date('2026-09-07');
const TOTAL_DAYS = (ENGAGEMENT_END.getTime() - ENGAGEMENT_START.getTime()) / (1000 * 60 * 60 * 24);
const TODAY = new Date('2026-06-09');

function dateToPercent(dateStr: string): number {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const [mon, day] = dateStr.split(' ');
  const d = new Date(2026, months[mon], parseInt(day));
  return Math.max(0, Math.min(100, ((d.getTime() - ENGAGEMENT_START.getTime()) / (1000 * 60 * 60 * 24) / TOTAL_DAYS) * 100));
}

const todayPercent = ((TODAY.getTime() - ENGAGEMENT_START.getTime()) / (1000 * 60 * 60 * 24) / TOTAL_DAYS) * 100;

const PHASE_COLORS: Record<string, string> = {
  'tp-1': '#234474',
  'tp-2': '#7C3AED',
  'tp-3': '#059669',
  'tp-4': '#EA580C',
  'tp-5': '#0891B2',
};

const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep'];

export default function TimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();

  const completeMilestones = data.milestones.filter((m) => m.status === 'Complete');
  const upcomingMilestones = data.milestones.filter((m) => m.status !== 'Complete');

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[36px] font-bold text-[#000F1E]">Timeline</h1>
          <p className="text-sm text-[#939598] mt-0.5">May 18 – Sep 7, 2026 · 16 weeks · Week 7 of 16</p>
        </div>
        <p className="text-sm text-[#939598] mt-2">Updated today at 8:14am</p>
      </div>

      {/* Engagement context */}
      <div className="mb-8">
        <p className="text-[12px] font-semibold text-[#000F1E] uppercase tracking-widest mb-2">ENGAGEMENT CONTEXT</p>
        <p className="text-sm text-[#464A4D] leading-relaxed max-w-[800px]">
          The engagement runs 16 weeks from May 18 to September 7, 2026. The team is currently in week 7 — midway through the experimentation phase. All discovery and analysis deliverables have been completed on schedule. The mid-engagement review on July 10 will serve as the primary checkpoint with ABG leadership before synthesis begins.
        </p>
      </div>

      {/* Gantt chart */}
      <div className="border border-[#DAD9D6] rounded-lg bg-white p-6 mb-8">
        <p className="text-[12px] text-[#939598] mb-4 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Click on a week number to zoom in
        </p>

        {/* Month headers */}
        <div className="flex mb-1 ml-36">
          {MONTHS.map((m) => (
            <div key={m} className="flex-1 text-[12px] text-[#939598] text-center border-r border-[#EFF0F0] last:border-0 pb-1">
              {m}
            </div>
          ))}
        </div>

        {/* Week numbers */}
        <div className="flex mb-3 ml-36 border-b border-[#EFF0F0] pb-2">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="flex-1 text-[10px] text-[#B7B8B9] text-center">W{i + 1}</div>
          ))}
        </div>

        {/* Phases */}
        <div className="space-y-3">
          {data.timelinePhases.map((phase) => {
            const startPct = dateToPercent(phase.startDate);
            const endPct = dateToPercent(phase.endDate);
            const width = endPct - startPct;
            const color = PHASE_COLORS[phase.id] ?? '#234474';

            return (
              <div key={phase.id} className="flex items-center gap-4">
                <div className="w-36 flex-shrink-0 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <p className="text-[13px] font-medium text-[#000F1E]">{phase.name}</p>
                    <p className="text-[11px] text-[#939598]">{phase.startDate} - {phase.endDate}</p>
                  </div>
                </div>
                <div className="flex-1 relative h-7 bg-[#EFF0F0] rounded overflow-hidden">
                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#C62828] z-10"
                    style={{ left: `${todayPercent}%` }}
                  />
                  {/* Phase bar */}
                  <div
                    className="absolute top-0 bottom-0 rounded transition-all"
                    style={{
                      left: `${startPct}%`,
                      width: `${width}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key milestones */}
      <section>
        <h2 className="text-[18px] font-semibold text-[#000F1E] mb-5">Key milestones</h2>
        <div className="grid grid-cols-2 gap-4">
          {data.milestones.map((m) => (
            <div
              key={m.id}
              className={`border rounded-lg p-4 bg-white ${m.isHighlighted ? 'border-[#234474]' : 'border-[#DAD9D6]'}`}
            >
              <div className="mb-2">
                <StatusBadge status={m.status} />
              </div>
              <h3 className={`text-[14px] font-semibold mb-1 leading-snug ${m.status === 'Complete' ? 'text-[#2E7D32]' : m.isHighlighted ? 'text-[#234474]' : 'text-[#000F1E]'}`}>
                {m.title}
              </h3>
              <p className="text-[12px] text-[#939598] mb-2">{m.date}</p>
              <p className="text-[13px] text-[#464A4D] leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
