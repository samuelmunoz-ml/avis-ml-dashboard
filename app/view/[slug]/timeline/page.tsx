'use client';
import { use } from 'react';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  type GanttFeature,
} from '@/components/GanttChart';

// Phase colours aligned with the ML design system
const PHASE_COLORS: Record<string, string> = {
  'tp-1': '#3B82F6',
  'tp-2': '#8B5CF6',
  'tp-3': '#10B981',
  'tp-4': '#F97316',
  'tp-5': '#06B6D4',
};

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(str: string, year = 2026): Date {
  const [month, day] = str.split(' ');
  return new Date(year, MONTHS[month], parseInt(day));
}

export default function TimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data } = useData();

  // Convert timeline phases → GanttFeature[]
  const features: GanttFeature[] = data.timelinePhases.map((phase) => ({
    id: phase.id,
    name: phase.name,
    startAt: parseDate(phase.startDate),
    endAt: parseDate(phase.endDate),
    status: {
      id: phase.id,
      name: phase.name,
      color: PHASE_COLORS[phase.id] ?? '#6B7280',
    },
  }));

  return (
    <div className="p-8 max-w-[1200px]">
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

      {/* Engagement context */}
      <div
        className="bg-white rounded-[14px] p-5 mb-6 fade-up fade-up-1"
        style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}
      >
        <p className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.1em] mb-2">Engagement context</p>
        <p className="text-[13.5px] text-[#4B5563] leading-[1.7] max-w-[800px]">
          The engagement runs 16 weeks from May 18 to September 7, 2026. The team is currently in week 7 — midway through the experimentation phase. All discovery and analysis deliverables have been completed on schedule. The mid-engagement review on July 10 will serve as the primary checkpoint with ABG leadership before synthesis begins.
        </p>
      </div>

      {/* Gantt chart */}
      <div
        className="bg-white rounded-[14px] overflow-hidden mb-6 fade-up fade-up-2"
        style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)', height: '360px' }}
      >
        <GanttProvider range="monthly" zoom={80}>
          <GanttSidebar>
            <GanttSidebarGroup name="Engagement phases">
              {features.map((feature) => (
                <GanttSidebarItem key={feature.id} feature={feature} />
              ))}
            </GanttSidebarGroup>
          </GanttSidebar>

          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              <GanttFeatureListGroup>
                {features.map((feature) => (
                  <GanttFeatureItem key={feature.id} {...feature}>
                    {/* Custom bar content — coloured dot + phase name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: feature.status.color }}
                      />
                      <span
                        className="text-[11px] font-semibold truncate"
                        style={{ color: feature.status.color }}
                      >
                        {feature.name}
                      </span>
                    </div>
                  </GanttFeatureItem>
                ))}
              </GanttFeatureListGroup>
            </GanttFeatureList>
            <GanttToday />
          </GanttTimeline>
        </GanttProvider>
      </div>

      {/* Key milestones */}
      <section className="fade-up fade-up-3">
        <p className="text-[11.5px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-4">Key milestones</p>
        <div className="grid grid-cols-2 gap-4">
          {data.milestones.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-[14px] p-5 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)]"
              style={{
                boxShadow: '0 1px 3px rgba(0,15,30,0.06)',
                border: m.isHighlighted ? '1.5px solid #3B82F6' : '1px solid rgba(0,15,30,0.05)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={m.status} />
                {m.isHighlighted && (
                  <span className="text-[10.5px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                    Upcoming checkpoint
                  </span>
                )}
              </div>
              <h3
                className={`text-[13.5px] font-semibold leading-snug mb-1.5 ${
                  m.status === 'Complete' ? 'text-[#15803D]' :
                  m.isHighlighted ? 'text-[#1D4ED8]' : 'text-[#111827]'
                }`}
              >
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
