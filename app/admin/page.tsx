'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import {
  ExternalLink, GripVertical, Plus, X, Trash2,
  BarChart2, LayoutGrid, Table2, CalendarRange, Flag, ChevronRight,
} from 'lucide-react';
import {
  GanttProvider, GanttSidebar, GanttSidebarGroup, GanttSidebarItem,
  GanttTimeline, GanttHeader, GanttFeatureList, GanttFeatureListGroup,
  GanttFeatureItem, GanttToday, type GanttFeature,
} from '@/components/GanttChart';

// ─── Types ────────────────────────────────────────────────────────────────────

type WidgetSize = 'full' | 'half';
interface WidgetDef { id: string; catalogId: string; size: WidgetSize; }

// ─── Widget catalog ───────────────────────────────────────────────────────────

const WIDGET_CATALOG = [
  {
    id: 'metrics',
    title: 'Metric row',
    description: 'Four KPI cards: active findings, experiments running, anomaly rate, and resolved findings — each with trend indicators.',
    icon: BarChart2,
    accent: '#3B82F6',
    defaultSize: 'full' as WidgetSize,
    Preview: () => (
      <div className="grid grid-cols-4 gap-1.5 p-2">
        {['#F97316','#3B82F6','#F43F5E','#22C55E'].map((c, i) => (
          <div key={i} className="rounded-[6px] p-2" style={{ background: '#F9FAFB', border: '1px solid rgba(0,15,30,0.06)' }}>
            <div className="w-3 h-3 rounded-full mb-1.5" style={{ background: c + '22' }}>
              <div className="w-1.5 h-1.5 rounded-full m-[3px]" style={{ background: c }} />
            </div>
            <div className="h-4 w-5 rounded bg-[#E5E7EB] mb-1" />
            <div className="h-1.5 w-8 rounded bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'findings',
    title: 'Finding cards',
    description: 'Pinned findings displayed as visual cards with status badges, screenshots, and a direct link to full detail.',
    icon: LayoutGrid,
    accent: '#8B5CF6',
    defaultSize: 'full' as WidgetSize,
    Preview: () => (
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[0,1,2].map((i) => (
          <div key={i} className="rounded-[6px] overflow-hidden" style={{ border: '1px solid rgba(0,15,30,0.06)' }}>
            <div className="h-7" style={{ background: 'repeating-linear-gradient(45deg,#F3F4F6 0,#F3F4F6 1px,#FAFAFA 1px,#FAFAFA 8px)' }} />
            <div className="p-1.5 bg-white">
              <div className="h-1.5 w-full rounded bg-[#E5E7EB] mb-1" />
              <div className="h-1.5 w-2/3 rounded bg-[#F3F4F6]" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'statusTable',
    title: 'Status table',
    description: 'Experiment pipeline table showing name, status badge, and owner — good for a quick pipeline snapshot.',
    icon: Table2,
    accent: '#10B981',
    defaultSize: 'half' as WidgetSize,
    Preview: () => (
      <div className="p-2 space-y-1">
        {[['#3B82F6','Running'],['#F97316','Reported'],['#3B82F6','Running'],['#22C55E','Complete']].map(([c, label], i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 rounded bg-[#F3F4F6]" />
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: c + '18' }}>
              <div className="w-1 h-1 rounded-full" style={{ background: c }} />
              <span className="text-[8px] font-semibold" style={{ color: c }}>{label}</span>
            </div>
            <div className="w-6 h-1.5 rounded bg-[#F3F4F6]" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Interactive Gantt chart of the engagement phases with horizontal scroll, today marker, and phase colours.',
    icon: CalendarRange,
    accent: '#06B6D4',
    defaultSize: 'full' as WidgetSize,
    Preview: () => (
      <div className="p-2 space-y-1.5">
        {[
          { w: '55%', l: '0%', c: '#3B82F6' },
          { w: '60%', l: '15%', c: '#8B5CF6' },
          { w: '40%', l: '20%', c: '#10B981' },
          { w: '35%', l: '55%', c: '#F97316' },
          { w: '20%', l: '78%', c: '#06B6D4' },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 rounded bg-[#F3F4F6]" />
            <div className="flex-1 h-4 rounded-[3px] relative bg-[#F3F4F6] overflow-hidden">
              <div className="absolute top-[3px] bottom-[3px] rounded-[2px]" style={{ left: p.l, width: p.w, background: p.c }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'milestones',
    title: 'Milestones',
    description: 'Key engagement milestones as cards, with completion status and highlighted upcoming checkpoints.',
    icon: Flag,
    accent: '#F97316',
    defaultSize: 'full' as WidgetSize,
    Preview: () => (
      <div className="grid grid-cols-2 gap-1.5 p-2">
        {[
          { c: '#22C55E', label: 'Complete' },
          { c: '#22C55E', label: 'Complete' },
          { c: '#3B82F6', label: 'Upcoming', highlight: true },
          { c: '#9CA3AF', label: 'Upcoming' },
        ].map((m, i) => (
          <div key={i} className="rounded-[6px] p-1.5" style={{ background: '#F9FAFB', border: m.highlight ? '1.5px solid #3B82F6' : '1px solid rgba(0,15,30,0.06)' }}>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.c }} />
              <div className="h-1 rounded w-8" style={{ background: m.c + '44' }} />
            </div>
            <div className="h-1.5 w-full rounded bg-[#E5E7EB] mb-0.5" />
            <div className="h-1 w-2/3 rounded bg-[#F3F4F6]" />
          </div>
        ))}
      </div>
    ),
  },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const CARD_STYLE = {
  boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)',
  border: '1px solid rgba(0,15,30,0.05)',
};

// ─── Phase helpers (for timeline widget) ─────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  'tp-1': '#3B82F6', 'tp-2': '#8B5CF6', 'tp-3': '#10B981',
  'tp-4': '#F97316', 'tp-5': '#06B6D4',
};
const MONTHS: Record<string, number> = {
  Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11,
};
function parseDate(str: string): Date {
  const [m, d] = str.split(' ');
  return new Date(2026, MONTHS[m], parseInt(d));
}

// ─── Add-widget modal ─────────────────────────────────────────────────────────

function AddWidgetModal({
  activeWidgetIds,
  onAdd,
  onClose,
}: {
  activeWidgetIds: string[];
  onAdd: (catalogId: string, size: WidgetSize) => void;
  onClose: () => void;
}) {
  const available = WIDGET_CATALOG.filter((w) => !activeWidgetIds.includes(w.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,15,30,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[680px] max-h-[85vh] overflow-hidden flex flex-col fade-up"
        style={{ boxShadow: '0 24px 64px rgba(0,15,30,0.18), 0 4px 12px rgba(0,15,30,0.08)' }}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
          <div>
            <h2 className="text-[18px] font-bold text-[#111827] tracking-[-0.02em]">Add a widget</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">
              Choose a widget to add to the dashboard.
              {available.length === 0 && ' All available widgets are already on the dashboard.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:bg-[#E5E7EB] transition-colors ml-4 flex-shrink-0"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Widget grid */}
        <div className="overflow-y-auto px-7 py-5">
          {available.length === 0 ? (
            <div className="text-center py-10 text-[#9CA3AF] text-[14px]">
              All widgets are already on the dashboard.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {available.map((widget) => {
                const Icon = widget.icon;
                const PreviewEl = widget.Preview;
                return (
                  <button
                    key={widget.id}
                    onClick={() => onAdd(widget.id, widget.defaultSize)}
                    className="text-left bg-white rounded-[14px] overflow-hidden group transition-all duration-200 hover:shadow-[0_6px_20px_rgba(0,15,30,0.1)] hover:-translate-y-0.5"
                    style={{ border: '1.5px solid #E5E7EB' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = widget.accent)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
                  >
                    {/* Mini preview */}
                    <div className="border-b" style={{ borderColor: 'rgba(0,15,30,0.06)', background: '#FAFAFA' }}>
                      <PreviewEl />
                    </div>

                    {/* Info row */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-[6px] flex items-center justify-center" style={{ background: widget.accent + '18' }}>
                              <Icon size={13} strokeWidth={1.75} style={{ color: widget.accent }} />
                            </div>
                            <span className="text-[14px] font-bold text-[#111827]">{widget.title}</span>
                            <span
                              className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: '#F3F4F6', color: '#6B7280' }}
                            >
                              {widget.defaultSize === 'full' ? 'Full width' : 'Half width'}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-[#6B7280] leading-relaxed">{widget.description}</p>
                        </div>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:scale-110"
                          style={{ background: widget.accent + '18', color: widget.accent }}
                        >
                          <ChevronRight size={13} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sortable widget shell ─────────────────────────────────────────────────────

function SortableWidget({
  widget, onSizeChange, onRemove, children, isDragOverlay = false,
}: {
  widget: WidgetDef;
  onSizeChange: (id: string, size: WidgetSize) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });

  const catalogItem = WIDGET_CATALOG.find((c) => c.id === widget.catalogId);
  const title = catalogItem?.title ?? widget.catalogId;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : 1,
    gridColumn: widget.size === 'full' ? 'span 2' : 'span 1',
    minHeight: 0,
  };

  const Shell = (
    <div
      className={`bg-white rounded-[14px] overflow-hidden h-full transition-shadow duration-200 ${isDragOverlay ? 'shadow-[0_20px_50px_rgba(0,15,30,0.18)] rotate-[0.8deg]' : ''}`}
      style={CARD_STYLE}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 select-none"
        style={{ borderBottom: '1px solid rgba(0,15,30,0.05)', background: '#FAFAFA' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Drag handle */}
          <button
            className="text-[#C4C9D0] hover:text-[#6B7280] transition-colors cursor-grab active:cursor-grabbing touch-none"
            {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
            aria-label="Drag to reorder"
          >
            <GripVertical size={15} strokeWidth={1.75} />
          </button>

          <span className="text-[13.5px] font-semibold text-[#111827]">{title}</span>

          {/* Full / ½ toggle */}
          <div className="flex gap-0.5 ml-0.5 bg-[#F3F4F6] rounded-[7px] p-[3px]">
            {(['full', 'half'] as WidgetSize[]).map((s) => (
              <button
                key={s}
                onClick={() => onSizeChange(widget.id, s)}
                className={`px-2.5 h-[22px] rounded-[5px] text-[11px] font-semibold transition-all duration-150 ${
                  widget.size === s
                    ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,15,30,0.1)]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                }`}
              >
                {s === 'full' ? 'Full' : '½'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Remove */}
          <button
            onClick={() => onRemove(widget.id)}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[#9CA3AF] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-all"
            title="Remove widget"
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
          <button
            className="h-7 px-3 rounded-[7px] text-[11.5px] font-semibold text-white hover:bg-[#0D1E35] transition-colors"
            style={{ background: '#000F1E' }}
          >
            Configuration
          </button>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );

  if (isDragOverlay) return Shell;
  return <div ref={setNodeRef} style={style}>{Shell}</div>;
}

// ─── Add-widget zone ──────────────────────────────────────────────────────────

function AddWidgetZone({ span = 2, onClick }: { span?: 1 | 2; onClick: () => void }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <button
        onClick={onClick}
        className="w-full py-3.5 rounded-[14px] border-2 border-dashed border-[#E5E7EB] text-[12.5px] font-semibold text-[#9CA3AF] hover:border-[#234474] hover:text-[#234474] hover:bg-[#EFF6FF] transition-all duration-200 flex items-center justify-center gap-1.5"
      >
        <Plus size={13} strokeWidth={2.5} /> Add widget here
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminWidgetBuilder() {
  const { data } = useData();
  const [previewSlug, setPreviewSlug] = useState('');
  const [widgets, setWidgets] = useState<WidgetDef[]>([
    { id: 'w-metrics',     catalogId: 'metrics',     size: 'full' },
    { id: 'w-findings',    catalogId: 'findings',    size: 'full' },
    { id: 'w-statusTable', catalogId: 'statusTable', size: 'half' },
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string); }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setWidgets((prev) => {
        const oldIdx = prev.findIndex((w) => w.id === active.id);
        const newIdx = prev.findIndex((w) => w.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  function handleSizeChange(id: string, size: WidgetSize) {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, size } : w));
  }

  function handleRemove(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }

  function openModal(atIndex: number) {
    setInsertIndex(atIndex);
    setModalOpen(true);
  }

  function handleAddWidget(catalogId: string, size: WidgetSize) {
    const newWidget: WidgetDef = {
      id: `w-${catalogId}-${Date.now()}`,
      catalogId,
      size,
    };
    setWidgets((prev) => {
      if (insertIndex === null || insertIndex >= prev.length) {
        return [...prev, newWidget];
      }
      const next = [...prev];
      next.splice(insertIndex + 1, 0, newWidget);
      return next;
    });
    setModalOpen(false);
  }

  const activeWidget = widgets.find((w) => w.id === activeId);
  const activeCatalogIds = widgets.map((w) => w.catalogId);

  // ── Widget content renderers ───────────────────────────────────────────────

  const activeFindings = data.findings.filter((f) => f.status !== 'Resolved').length;
  const runningExperiments = data.experiments.filter((e) => e.status === 'Running').length;
  const resolvedFindings = data.findings.filter((f) => f.status === 'Resolved').length;
  const pinnedFindings = data.findings.filter((f) => f.isPinned);

  const ganttFeatures: GanttFeature[] = data.timelinePhases.map((p) => ({
    id: p.id, name: p.name,
    startAt: parseDate(p.startDate), endAt: parseDate(p.endDate),
    status: { id: p.id, name: p.name, color: PHASE_COLORS[p.id] ?? '#6B7280' },
  }));

  function renderWidget(w: WidgetDef): React.ReactNode {
    switch (w.catalogId) {
      case 'metrics':
        return (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Active findings',     value: activeFindings,     sub: '↑ 3 since last week',     c: '#F97316' },
              { label: 'Experiments running', value: runningExperiments, sub: '2 completed this week',   c: '#9CA3AF' },
              { label: 'Anomaly rate',         value: '9.7%',             sub: '↓ Highest since cutover', c: '#BE123C' },
              { label: 'Resolved findings',   value: resolvedFindings,   sub: '✓ 2 resolved this week',  c: '#15803D' },
            ].map((m) => (
              <div key={m.label} className="rounded-[12px] p-4" style={{ background: '#F9FAFB', border: '1px solid rgba(0,15,30,0.05)' }}>
                <p className="text-[12px] text-[#6B7280] mb-2">{m.label}</p>
                <p className="text-[26px] font-bold text-[#111827] leading-none tracking-[-0.02em] tabular-nums mb-1">{m.value}</p>
                <p className="text-[11.5px] font-medium" style={{ color: m.c }}>{m.sub}</p>
              </div>
            ))}
          </div>
        );

      case 'findings':
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {pinnedFindings.slice(0, 3).map((f) => (
              <div key={f.id} className="rounded-[12px] overflow-hidden" style={{ border: '1px solid rgba(0,15,30,0.06)' }}>
                <div className="h-24 relative" style={{ background: 'repeating-linear-gradient(45deg,#F3F4F6 0,#F3F4F6 1px,#FAFAFA 1px,#FAFAFA 16px)' }}>
                  {f.status === 'Reported' && <span className="absolute top-2 right-2 bg-[#C2410C] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>}
                </div>
                <div className="p-3 bg-white">
                  <p className="text-[13px] font-semibold text-[#111827] mb-1 line-clamp-2 leading-snug">{f.title}</p>
                  <StatusBadge status={f.status} />
                </div>
              </div>
            ))}
          </div>
        );

      case 'statusTable':
        return (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,15,30,0.05)' }}>
                {['Experiment', 'Status', 'Owner'].map((h) => (
                  <th key={h} className="text-left pb-2.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.06em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.experiments.slice(0, 4).map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < 3 ? '1px solid rgba(0,15,30,0.04)' : 'none' }}>
                  <td className="py-2.5 pr-3 text-[13px] text-[#111827] leading-snug">{e.title}</td>
                  <td className="py-2.5"><StatusBadge status={e.status} /></td>
                  <td className="py-2.5 text-[13px] text-[#6B7280]">{e.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'timeline':
        return (
          <div className="rounded-[12px] overflow-hidden" style={{ height: '260px', border: '1px solid rgba(0,15,30,0.06)' }}>
            <GanttProvider range="monthly" zoom={70}>
              <GanttSidebar>
                <GanttSidebarGroup name="Phases">
                  {ganttFeatures.map((f) => <GanttSidebarItem key={f.id} feature={f} />)}
                </GanttSidebarGroup>
              </GanttSidebar>
              <GanttTimeline>
                <GanttHeader />
                <GanttFeatureList>
                  <GanttFeatureListGroup>
                    {ganttFeatures.map((f) => (
                      <GanttFeatureItem key={f.id} {...f}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.status.color }} />
                          <span className="text-[11px] font-semibold truncate" style={{ color: f.status.color }}>{f.name}</span>
                        </div>
                      </GanttFeatureItem>
                    ))}
                  </GanttFeatureListGroup>
                </GanttFeatureList>
                <GanttToday />
              </GanttTimeline>
            </GanttProvider>
          </div>
        );

      case 'milestones':
        return (
          <div className="grid grid-cols-2 gap-3">
            {data.milestones.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="rounded-[12px] p-4"
                style={{
                  background: '#F9FAFB',
                  border: m.isHighlighted ? '1.5px solid #3B82F6' : '1px solid rgba(0,15,30,0.05)',
                }}
              >
                <StatusBadge status={m.status} className="mb-2" />
                <p className={`text-[13px] font-semibold leading-snug mb-1 ${m.status === 'Complete' ? 'text-[#15803D]' : m.isHighlighted ? 'text-[#1D4ED8]' : 'text-[#111827]'}`}>
                  {m.title}
                </p>
                <p className="text-[11px] text-[#9CA3AF]">{m.date}</p>
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-[13px] text-[#9CA3AF] py-4 text-center">Unknown widget</div>;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const lastWidgetIsHalf = widgets[widgets.length - 1]?.size === 'half';

  return (
    <div className="p-8 max-w-[1080px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-7 fade-up">
        <div>
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Admin · Widget builder</p>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em]">Overview</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">Avis Budget Group</p>
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          <div className="flex items-center gap-2 bg-white rounded-[10px] px-3 h-10" style={CARD_STYLE}>
            <span className="text-[12.5px] text-[#6B7280]">Preview as:</span>
            <select value={previewSlug} onChange={(e) => setPreviewSlug(e.target.value)} className="text-[13px] font-medium text-[#111827] outline-none bg-transparent">
              <option value="">Select viewer…</option>
              {data.shareLinks.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
            </select>
          </div>
          {previewSlug && (
            <Link href={`/view/${previewSlug}/overview`} target="_blank"
              className="h-10 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#F3F4F6]"
              style={{ border: '1px solid rgba(0,15,30,0.1)', color: '#234474' }}>
              Preview <ExternalLink size={12} strokeWidth={2} />
            </Link>
          )}
          <button className="h-10 px-5 rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#0D1E35]" style={{ background: '#000F1E' }}>
            Done
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-[12px] p-1 w-fit fade-up fade-up-1" style={CARD_STYLE}>
        {['Overview', 'Findings', 'Experiments', 'Timeline'].map((tab, i) => (
          <button key={tab} className={`px-4 h-8 rounded-[8px] text-[13px] font-medium transition-all ${i === 0 ? 'bg-[#000F1E] text-white' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'}`}>
            {tab}
          </button>
        ))}
        <button className="px-4 h-8 rounded-[8px] text-[13px] font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors">+ Add page</button>
      </div>

      {/* Hint */}
      <p className="text-[12px] text-[#9CA3AF] mb-4 fade-up fade-up-1 flex items-center gap-1.5">
        <GripVertical size={12} strokeWidth={1.75} className="inline" />
        Drag to reorder · Toggle <span className="font-semibold text-[#6B7280]">Full / ½</span> to resize · <Trash2 size={11} strokeWidth={1.75} className="inline" /> to remove
      </p>

      {/* Sortable grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>

            {widgets.map((widget, index) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onSizeChange={handleSizeChange}
                onRemove={handleRemove}
              >
                {renderWidget(widget)}
              </SortableWidget>
            ))}

            {/* Bottom add zone — full width */}
            <AddWidgetZone span={2} onClick={() => openModal(widgets.length - 1)} />

            {/* Pair zone when last widget is ½ */}
            {lastWidgetIsHalf && (
              <AddWidgetZone span={1} onClick={() => openModal(widgets.length - 1)} />
            )}

          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
          {activeWidget ? (
            <SortableWidget widget={activeWidget} onSizeChange={() => {}} onRemove={() => {}} isDragOverlay>
              {renderWidget(activeWidget)}
            </SortableWidget>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add widget modal */}
      {modalOpen && (
        <AddWidgetModal
          activeWidgetIds={activeCatalogIds}
          onAdd={handleAddWidget}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
