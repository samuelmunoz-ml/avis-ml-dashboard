'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { ExternalLink, GripVertical, Plus } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type WidgetSize = 'full' | 'half';

interface WidgetDef {
  id: string;
  title: string;
  size: WidgetSize;
}

const INITIAL_WIDGETS: WidgetDef[] = [
  { id: 'metrics',     title: 'Metric row',    size: 'full' },
  { id: 'findings',    title: 'Finding cards', size: 'full' },
  { id: 'statusTable', title: 'Status table',  size: 'half' },
];

const CARD_STYLE = {
  boxShadow: '0 1px 3px rgba(0,15,30,0.06), 0 1px 2px rgba(0,15,30,0.04)',
  border: '1px solid rgba(0,15,30,0.05)',
};

// ─── Sortable widget wrapper ─────────────────────────────────────────────────

function SortableWidget({
  widget,
  onSizeChange,
  children,
  isDragOverlay = false,
}: {
  widget: WidgetDef;
  onSizeChange: (id: string, size: WidgetSize) => void;
  children: React.ReactNode;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.35 : 1,
    gridColumn: widget.size === 'full' ? 'span 2' : 'span 1',
    // Keep a min-height so half-width slots don't collapse during drag
    minHeight: 0,
  };

  const Shell = (
    <div
      className={`bg-white rounded-[14px] overflow-hidden h-full transition-shadow duration-200 ${
        isDragOverlay ? 'shadow-[0_16px_40px_rgba(0,15,30,0.18)] rotate-[0.8deg]' : ''
      }`}
      style={isDragOverlay ? CARD_STYLE : CARD_STYLE}
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

          <span className="text-[13.5px] font-semibold text-[#111827]">{widget.title}</span>

          {/* Size toggle */}
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
                {s === 'full' ? 'Full' : '1/2'}
              </button>
            ))}
          </div>
        </div>

        <button
          className="h-7 px-3 rounded-[7px] text-[11.5px] font-semibold text-white hover:bg-[#0D1E35] transition-colors"
          style={{ background: '#000F1E' }}
        >
          Configuration
        </button>
      </div>

      {/* Content */}
      <div className="p-5">{children}</div>
    </div>
  );

  if (isDragOverlay) return Shell;

  return (
    <div ref={setNodeRef} style={style}>
      {Shell}
    </div>
  );
}

// ─── Add-widget zone ─────────────────────────────────────────────────────────

function AddWidgetZone({ span = 2 }: { span?: 1 | 2 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <button className="w-full py-3.5 rounded-[14px] border-2 border-dashed border-[#E5E7EB] text-[12.5px] font-semibold text-[#9CA3AF] hover:border-[#234474] hover:text-[#234474] hover:bg-[#EFF6FF] transition-all duration-200 flex items-center justify-center gap-1.5">
        <Plus size={13} strokeWidth={2.5} /> Add widget here
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminWidgetBuilder() {
  const { data } = useData();
  const [previewSlug, setPreviewSlug] = useState('');
  const [widgets, setWidgets] = useState<WidgetDef[]>(INITIAL_WIDGETS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((prev) => {
        const oldIndex = prev.findIndex((w) => w.id === active.id);
        const newIndex = prev.findIndex((w) => w.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function handleSizeChange(id: string, size: WidgetSize) {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, size } : w));
  }

  const activeWidget = widgets.find((w) => w.id === activeId);

  // ── Widget content renderers ──────────────────────────────────────────────

  const pinnedFindings = data.findings.filter((f) => f.isPinned);
  const activeFindings = data.findings.filter((f) => f.status !== 'Resolved').length;
  const runningExperiments = data.experiments.filter((e) => e.status === 'Running').length;
  const resolvedFindings = data.findings.filter((f) => f.status === 'Resolved').length;

  const widgetContent: Record<string, React.ReactNode> = {
    metrics: (
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Active findings',     value: activeFindings,     sub: '↑ 3 since last week',     subColor: '#15803D' },
          { label: 'Experiments running', value: runningExperiments, sub: '2 completed this week',   subColor: '#9CA3AF' },
          { label: 'Anomaly rate',         value: '9.7%',             sub: '↓ Highest since cutover', subColor: '#BE123C' },
          { label: 'Resolved findings',   value: resolvedFindings,   sub: '✓ 2 resolved this week',  subColor: '#15803D' },
        ].map((m) => (
          <div key={m.label} className="rounded-[12px] p-4" style={{ background: '#F9FAFB', border: '1px solid rgba(0,15,30,0.05)' }}>
            <p className="text-[12px] text-[#6B7280] mb-2">{m.label}</p>
            <p className="text-[26px] font-bold text-[#111827] leading-none tracking-[-0.02em] tabular-nums mb-1">{m.value}</p>
            <p className="text-[11.5px] font-medium" style={{ color: m.subColor }}>{m.sub}</p>
          </div>
        ))}
      </div>
    ),

    findings: (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {pinnedFindings.slice(0, 3).map((f) => (
          <div key={f.id} className="rounded-[12px] overflow-hidden" style={{ border: '1px solid rgba(0,15,30,0.06)' }}>
            <div
              className="h-24 relative"
              style={{ background: 'repeating-linear-gradient(45deg,#F3F4F6 0px,#F3F4F6 1px,#FAFAFA 1px,#FAFAFA 16px)' }}
            >
              {f.status === 'Reported' && (
                <span className="absolute top-2 right-2 bg-[#C2410C] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>
              )}
            </div>
            <div className="p-3 bg-white">
              <p className="text-[13px] font-semibold text-[#111827] mb-1 line-clamp-2 leading-snug">{f.title}</p>
              <p className="text-[11.5px] text-[#6B7280] mb-2 line-clamp-1">{f.description}</p>
              <StatusBadge status={f.status} />
            </div>
          </div>
        ))}
      </div>
    ),

    statusTable: (
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
    ),
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
            <select
              value={previewSlug}
              onChange={(e) => setPreviewSlug(e.target.value)}
              className="text-[13px] font-medium text-[#111827] outline-none bg-transparent"
            >
              <option value="">Select viewer…</option>
              {data.shareLinks.map((l) => (
                <option key={l.id} value={l.slug}>{l.name}</option>
              ))}
            </select>
          </div>
          {previewSlug && (
            <Link
              href={`/view/${previewSlug}/overview`}
              target="_blank"
              className="h-10 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#F3F4F6]"
              style={{ border: '1px solid rgba(0,15,30,0.1)', color: '#234474' }}
            >
              Preview <ExternalLink size={12} strokeWidth={2} />
            </Link>
          )}
          <button
            className="h-10 px-5 rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#0D1E35]"
            style={{ background: '#000F1E' }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 mb-7 bg-white rounded-[12px] p-1 w-fit fade-up fade-up-1" style={CARD_STYLE}>
        {['Overview', 'Findings', 'Experiments', 'Timeline'].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 h-8 rounded-[8px] text-[13px] font-medium transition-all ${
              i === 0 ? 'bg-[#000F1E] text-white' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {tab}
          </button>
        ))}
        <button className="px-4 h-8 rounded-[8px] text-[13px] font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
          + Add page
        </button>
      </div>

      {/* Hint */}
      <p className="text-[12px] text-[#9CA3AF] mb-4 fade-up fade-up-1 flex items-center gap-1.5">
        <GripVertical size={12} strokeWidth={1.75} className="inline" />
        Drag widgets to reorder · Toggle <span className="font-semibold text-[#6B7280]">Full / 1/2</span> to set width
      </p>

      {/* DnD grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
          >
            {widgets.map((widget, index) => (
              <>
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  onSizeChange={handleSizeChange}
                  isDragOverlay={false}
                >
                  {widgetContent[widget.id] ?? null}
                </SortableWidget>

                {/* Add zone after every widget (full-width) */}
                {index === widgets.length - 1 && (
                  <AddWidgetZone key={`add-${index}`} span={2} />
                )}
              </>
            ))}

            {/* Inline add zone for pairing with a half-width slot */}
            {widgets[widgets.length - 1]?.size === 'half' && (
              <AddWidgetZone key="add-pair" span={1} />
            )}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeWidget ? (
            <SortableWidget
              widget={activeWidget}
              onSizeChange={() => {}}
              isDragOverlay
            >
              {widgetContent[activeWidget.id] ?? null}
            </SortableWidget>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
