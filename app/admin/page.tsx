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
  ExternalLink, GripVertical, Plus, X, Trash2, Settings2,
  BarChart2, LayoutGrid, Table2, CalendarRange, Flag, ChevronRight,
  LayoutDashboard, AlertCircle, FlaskConical, CalendarDays, Search,
} from 'lucide-react';
import {
  GanttProvider, GanttSidebar, GanttSidebarGroup, GanttSidebarItem,
  GanttTimeline, GanttHeader, GanttFeatureList, GanttFeatureListGroup,
  GanttFeatureItem, GanttToday, type GanttFeature,
} from '@/components/GanttChart';

// ─── Types ────────────────────────────────────────────────────────────────────

type WidgetSize = 'full' | 'half';

interface MetricsConfig {
  visibleMetrics: { findings: boolean; experiments: boolean; anomaly: boolean; resolved: boolean };
  columns: 2 | 4;
}
interface FindingsConfig { count: 1 | 2 | 3; showBadge: boolean; showDescription: boolean; }
interface StatusTableConfig { rows: 4 | 6 | 10; showOwner: boolean; showLastUpdated: boolean; filterStatus: string; }
interface TimelineConfig { range: 'daily' | 'monthly' | 'quarterly'; zoom: number; showSidebar: boolean; }
interface MilestonesConfig { count: 2 | 4 | 6; filterStatus: 'all' | 'Complete' | 'Upcoming'; }
type WidgetConfig = MetricsConfig | FindingsConfig | StatusTableConfig | TimelineConfig | MilestonesConfig;

interface WidgetDef { id: string; catalogId: string; size: WidgetSize; config: Record<string, any>; }

// ─── Page types ───────────────────────────────────────────────────────────────

type PageKey = 'overview' | 'findings' | 'experiments' | 'timeline' | 'milestones';
interface PageDef { id: string; key: PageKey; label: string; }

const PAGE_META: Record<PageKey, { label: string; description: string; Icon: React.FC<any>; color: string }> = {
  overview:    { label: 'Overview',    description: 'Dashboard home — KPI metrics, widget layout, and pinned content', Icon: LayoutDashboard, color: '#000F1E' },
  findings:    { label: 'Findings',    description: 'Full findings list with filters, status badges, and detail cards',  Icon: AlertCircle,     color: '#8B5CF6' },
  experiments: { label: 'Experiments', description: 'Experiment pipeline — status summary, search, and full table',      Icon: FlaskConical,    color: '#3B82F6' },
  timeline:    { label: 'Timeline',    description: 'Interactive Gantt chart with engagement phases and milestones',      Icon: CalendarDays,    color: '#10B981' },
  milestones:  { label: 'Milestones',  description: 'Key engagement milestones with completion status and checkpoints',  Icon: Flag,            color: '#F97316' },
};

const DEFAULT_PAGES: PageDef[] = [
  { id: 'pg-overview',    key: 'overview',    label: 'Overview'    },
  { id: 'pg-findings',    key: 'findings',    label: 'Findings'    },
  { id: 'pg-experiments', key: 'experiments', label: 'Experiments' },
  { id: 'pg-timeline',    key: 'timeline',    label: 'Timeline'    },
];

// ─── Default configs ──────────────────────────────────────────────────────────

const DEFAULT_CONFIGS: Record<string, Record<string, any>> = {
  metrics:     { visibleMetrics: { findings: true, experiments: true, anomaly: true, resolved: true }, columns: 4 },
  findings:    { count: 3, showBadge: true, showDescription: true },
  statusTable: { rows: 4, showOwner: true, showLastUpdated: true, filterStatus: 'all' },
  timeline:    { range: 'monthly', zoom: 70, showSidebar: true },
  milestones:  { count: 4, filterStatus: 'all' },
};

// ─── Widget catalog ───────────────────────────────────────────────────────────

const WIDGET_CATALOG = [
  {
    id: 'metrics', title: 'Metric row', accent: '#3B82F6', defaultSize: 'full' as WidgetSize,
    icon: BarChart2,
    description: 'Four KPI cards: active findings, experiments running, anomaly rate, and resolved findings — each with trend indicators.',
    Preview: () => (
      <div className="grid grid-cols-4 gap-1.5 p-2.5">
        {['#F97316','#3B82F6','#F43F5E','#22C55E'].map((c,i) => (
          <div key={i} className="rounded-[6px] p-2" style={{ background:'#F9FAFB', border:'1px solid rgba(0,15,30,0.06)' }}>
            <div className="w-3 h-3 rounded-full mb-1.5" style={{ background:c+'22' }}><div className="w-1.5 h-1.5 rounded-full m-[3px]" style={{ background:c }}/></div>
            <div className="h-4 w-5 rounded bg-[#E5E7EB] mb-1"/><div className="h-1.5 w-8 rounded bg-[#E5E7EB]"/>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'findings', title: 'Finding cards', accent: '#8B5CF6', defaultSize: 'full' as WidgetSize,
    icon: LayoutGrid,
    description: 'Pinned findings displayed as visual cards with status badges, screenshots, and a direct link to full detail.',
    Preview: () => (
      <div className="grid grid-cols-3 gap-1.5 p-2.5">
        {[0,1,2].map(i => (
          <div key={i} className="rounded-[6px] overflow-hidden" style={{ border:'1px solid rgba(0,15,30,0.06)' }}>
            <div className="h-8" style={{ background:'repeating-linear-gradient(45deg,#F3F4F6 0,#F3F4F6 1px,#FAFAFA 1px,#FAFAFA 8px)' }}/>
            <div className="p-1.5 bg-white"><div className="h-1.5 w-full rounded bg-[#E5E7EB] mb-1"/><div className="h-1.5 w-2/3 rounded bg-[#F3F4F6]"/></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'statusTable', title: 'Status table', accent: '#10B981', defaultSize: 'half' as WidgetSize,
    icon: Table2,
    description: 'Experiment pipeline table showing name, status badge, and owner — good for a quick pipeline snapshot.',
    Preview: () => (
      <div className="p-2.5 space-y-1.5">
        {[['#3B82F6','Running'],['#F97316','Reported'],['#3B82F6','Running'],['#22C55E','Complete']].map(([c,l],i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 rounded bg-[#F3F4F6]"/>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background:c+'18' }}>
              <div className="w-1 h-1 rounded-full" style={{ background:c }}/><span className="text-[8px] font-semibold" style={{ color:c }}>{l}</span>
            </div>
            <div className="w-6 h-1.5 rounded bg-[#F3F4F6]"/>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'timeline', title: 'Timeline', accent: '#06B6D4', defaultSize: 'full' as WidgetSize,
    icon: CalendarRange,
    description: 'Interactive Gantt chart of the engagement phases with horizontal scroll, today marker, and phase colours.',
    Preview: () => (
      <div className="p-2.5 space-y-1.5">
        {[{w:'55%',l:'0%',c:'#3B82F6'},{w:'60%',l:'15%',c:'#8B5CF6'},{w:'40%',l:'20%',c:'#10B981'},{w:'35%',l:'55%',c:'#F97316'},{w:'20%',l:'78%',c:'#06B6D4'}].map((p,i)=>(
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-10 h-1.5 rounded bg-[#F3F4F6]"/>
            <div className="flex-1 h-4 rounded-[3px] relative bg-[#F3F4F6] overflow-hidden">
              <div className="absolute top-[3px] bottom-[3px] rounded-[2px]" style={{ left:p.l, width:p.w, background:p.c }}/>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'milestones', title: 'Milestones', accent: '#F97316', defaultSize: 'full' as WidgetSize,
    icon: Flag,
    description: 'Key engagement milestones as cards, with completion status and highlighted upcoming checkpoints.',
    Preview: () => (
      <div className="grid grid-cols-2 gap-1.5 p-2.5">
        {[{c:'#22C55E',h:false},{c:'#22C55E',h:false},{c:'#3B82F6',h:true},{c:'#9CA3AF',h:false}].map((m,i)=>(
          <div key={i} className="rounded-[6px] p-1.5" style={{ background:'#F9FAFB', border:m.h?'1.5px solid #3B82F6':'1px solid rgba(0,15,30,0.06)' }}>
            <div className="flex items-center gap-1 mb-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background:m.c }}/><div className="h-1 rounded w-8" style={{ background:m.c+'44' }}/></div>
            <div className="h-1.5 w-full rounded bg-[#E5E7EB] mb-0.5"/><div className="h-1 w-2/3 rounded bg-[#F3F4F6]"/>
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

const PHASE_COLORS: Record<string,string> = {
  'tp-1':'#3B82F6','tp-2':'#8B5CF6','tp-3':'#10B981','tp-4':'#F97316','tp-5':'#06B6D4',
};
const MONTHS: Record<string,number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
function parseDate(s: string): Date { const [m,d]=s.split(' '); return new Date(2026,MONTHS[m],parseInt(d)); }

// ─── Config modal sub-components ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] mb-2.5">{children}</p>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 transition-all duration-200"
      style={{ width: 36, height: 20 }}
    >
      <div
        className="absolute inset-0 rounded-full transition-all duration-200"
        style={{ background: value ? '#000F1E' : '#E5E7EB' }}
      />
      <div
        className="absolute top-[3px] rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ width: 14, height: 14, left: value ? 19 : 3 }}
      />
    </button>
  );
}

function ToggleRow({ label, sublabel, value, onChange }: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,15,30,0.05)' }}>
      <div>
        <p className="text-[13.5px] font-medium text-[#111827]">{label}</p>
        {sublabel && <p className="text-[12px] text-[#9CA3AF] mt-0.5">{sublabel}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function PillGroup<T extends string | number>({ options, value, onChange }: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(o => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className="px-3.5 h-8 rounded-[8px] text-[13px] font-medium transition-all duration-150"
          style={{
            background: value === o.value ? '#000F1E' : '#F3F4F6',
            color: value === o.value ? '#FFFFFF' : '#6B7280',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-1.5 group">
      <div
        className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: checked ? '#000F1E' : '#F3F4F6', border: checked ? 'none' : '1.5px solid #D1D5DB' }}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-[13.5px] text-[#374151] group-hover:text-[#111827] transition-colors select-none">{label}</span>
    </label>
  );
}

// ─── Per-widget config panels ─────────────────────────────────────────────────

function MetricsConfigPanel({ cfg, setCfg }: { cfg: MetricsConfig; setCfg: (c: MetricsConfig) => void }) {
  const vm = cfg.visibleMetrics;
  function setMetric(key: keyof typeof vm, v: boolean) {
    setCfg({ ...cfg, visibleMetrics: { ...vm, [key]: v } });
  }
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Visible metrics</SectionLabel>
        <div className="grid grid-cols-2 gap-x-4">
          <CheckboxRow label="Active findings"     checked={vm.findings}    onChange={v => setMetric('findings',v)} />
          <CheckboxRow label="Experiments running" checked={vm.experiments} onChange={v => setMetric('experiments',v)} />
          <CheckboxRow label="Anomaly rate"         checked={vm.anomaly}     onChange={v => setMetric('anomaly',v)} />
          <CheckboxRow label="Resolved findings"   checked={vm.resolved}    onChange={v => setMetric('resolved',v)} />
        </div>
      </div>
      <div>
        <SectionLabel>Layout</SectionLabel>
        <PillGroup
          options={[{ label: '2 columns', value: 2 as 2 }, { label: '4 columns', value: 4 as 4 }]}
          value={cfg.columns}
          onChange={v => setCfg({ ...cfg, columns: v })}
        />
      </div>
    </div>
  );
}

function FindingsConfigPanel({ cfg, setCfg }: { cfg: FindingsConfig; setCfg: (c: FindingsConfig) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Cards to display</SectionLabel>
        <PillGroup
          options={[{ label: '1 card', value: 1 as 1 }, { label: '2 cards', value: 2 as 2 }, { label: '3 cards', value: 3 as 3 }]}
          value={cfg.count}
          onChange={v => setCfg({ ...cfg, count: v })}
        />
      </div>
      <div>
        <SectionLabel>Display options</SectionLabel>
        <div>
          <ToggleRow label="Show 'New' badge"   sublabel="Highlights unseen findings"  value={cfg.showBadge}       onChange={v => setCfg({ ...cfg, showBadge: v })} />
          <ToggleRow label="Show description"   sublabel="2-line excerpt below title"  value={cfg.showDescription} onChange={v => setCfg({ ...cfg, showDescription: v })} />
        </div>
      </div>
    </div>
  );
}

function StatusTableConfigPanel({ cfg, setCfg }: { cfg: StatusTableConfig; setCfg: (c: StatusTableConfig) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Rows to display</SectionLabel>
        <PillGroup
          options={[{ label: '4 rows', value: 4 as 4 }, { label: '6 rows', value: 6 as 6 }, { label: 'All', value: 10 as 10 }]}
          value={cfg.rows}
          onChange={v => setCfg({ ...cfg, rows: v })}
        />
      </div>
      <div>
        <SectionLabel>Visible columns</SectionLabel>
        <CheckboxRow label="Owner"        checked={cfg.showOwner}       onChange={v => setCfg({ ...cfg, showOwner: v })} />
        <CheckboxRow label="Last updated" checked={cfg.showLastUpdated} onChange={v => setCfg({ ...cfg, showLastUpdated: v })} />
      </div>
      <div>
        <SectionLabel>Filter by status</SectionLabel>
        <PillGroup
          options={[
            { label: 'All', value: 'all' },
            { label: 'Running', value: 'Running' },
            { label: 'Planning', value: 'Planning' },
            { label: 'Complete', value: 'Complete' },
          ]}
          value={cfg.filterStatus}
          onChange={v => setCfg({ ...cfg, filterStatus: v })}
        />
      </div>
    </div>
  );
}

function TimelineConfigPanel({ cfg, setCfg }: { cfg: TimelineConfig; setCfg: (c: TimelineConfig) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Range</SectionLabel>
        <PillGroup
          options={[
            { label: 'Monthly',   value: 'monthly'   as const },
            { label: 'Quarterly', value: 'quarterly' as const },
            { label: 'Daily',     value: 'daily'     as const },
          ]}
          value={cfg.range}
          onChange={v => setCfg({ ...cfg, range: v })}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <SectionLabel>Zoom</SectionLabel>
          <span className="text-[12px] font-semibold text-[#374151] tabular-nums">{cfg.zoom}%</span>
        </div>
        <input
          type="range" min={50} max={130} step={5} value={cfg.zoom}
          onChange={e => setCfg({ ...cfg, zoom: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: '#000F1E', background: `linear-gradient(to right, #000F1E ${((cfg.zoom-50)/80)*100}%, #E5E7EB ${((cfg.zoom-50)/80)*100}%)` }}
        />
        <div className="flex justify-between text-[10.5px] text-[#9CA3AF] mt-1">
          <span>Compact</span><span>Expanded</span>
        </div>
      </div>
      <div>
        <SectionLabel>Display options</SectionLabel>
        <ToggleRow label="Show phase sidebar" sublabel="Phase names and durations on the left" value={cfg.showSidebar} onChange={v => setCfg({ ...cfg, showSidebar: v })} />
      </div>
    </div>
  );
}

function MilestonesConfigPanel({ cfg, setCfg }: { cfg: MilestonesConfig; setCfg: (c: MilestonesConfig) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Milestones to display</SectionLabel>
        <PillGroup
          options={[{ label: '2', value: 2 as 2 }, { label: '4', value: 4 as 4 }, { label: '6', value: 6 as 6 }]}
          value={cfg.count}
          onChange={v => setCfg({ ...cfg, count: v })}
        />
      </div>
      <div>
        <SectionLabel>Filter</SectionLabel>
        <PillGroup
          options={[{ label: 'All', value: 'all' as const }, { label: 'Complete only', value: 'Complete' as const }, { label: 'Upcoming only', value: 'Upcoming' as const }]}
          value={cfg.filterStatus}
          onChange={v => setCfg({ ...cfg, filterStatus: v })}
        />
      </div>
    </div>
  );
}

// ─── Widget config modal ──────────────────────────────────────────────────────

function WidgetConfigModal({
  widget, onSave, onClose,
}: {
  widget: WidgetDef;
  onSave: (id: string, config: Record<string, any>) => void;
  onClose: () => void;
}) {
  const catalog = WIDGET_CATALOG.find(c => c.id === widget.catalogId)!;
  const PreviewEl = catalog.Preview;
  const [localCfg, setLocalCfg] = useState<Record<string, any>>({ ...widget.config });
  const Icon = catalog.icon;

  function renderPanel() {
    switch (widget.catalogId) {
      case 'metrics':
        return <MetricsConfigPanel cfg={localCfg as MetricsConfig} setCfg={c => setLocalCfg(c as any)} />;
      case 'findings':
        return <FindingsConfigPanel cfg={localCfg as FindingsConfig} setCfg={c => setLocalCfg(c as any)} />;
      case 'statusTable':
        return <StatusTableConfigPanel cfg={localCfg as StatusTableConfig} setCfg={c => setLocalCfg(c as any)} />;
      case 'timeline':
        return <TimelineConfigPanel cfg={localCfg as TimelineConfig} setCfg={c => setLocalCfg(c as any)} />;
      case 'milestones':
        return <MilestonesConfigPanel cfg={localCfg as MilestonesConfig} setCfg={c => setLocalCfg(c as any)} />;
      default:
        return <p className="text-[#9CA3AF] text-sm">No configuration available.</p>;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,15,30,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-[20px] w-full flex overflow-hidden fade-up"
        style={{ maxWidth: 640, maxHeight: '88vh', boxShadow: '0 24px 64px rgba(0,15,30,0.18), 0 4px 12px rgba(0,15,30,0.08)' }}
      >
        {/* Left: preview */}
        <div className="w-52 flex-shrink-0 flex flex-col" style={{ background: '#F9FAFB', borderRight: '1px solid rgba(0,15,30,0.06)' }}>
          <div className="px-5 pt-5 pb-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center mb-3" style={{ background: catalog.accent + '18' }}>
              <Icon size={16} strokeWidth={1.75} style={{ color: catalog.accent }} />
            </div>
            <p className="text-[13px] font-bold text-[#111827] leading-snug">{catalog.title}</p>
            <p className="text-[11.5px] text-[#9CA3AF] mt-1 leading-relaxed">{catalog.description}</p>
          </div>
          {/* Preview thumbnail */}
          <div className="mx-3 mb-4 bg-white rounded-[10px] overflow-hidden" style={{ border: '1px solid rgba(0,15,30,0.07)' }}>
            <PreviewEl />
          </div>
          <div className="px-4 mt-auto pb-5">
            <div className="text-[10.5px] text-[#9CA3AF] space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
                Changes apply instantly
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] flex-shrink-0" />
                Saved per dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Right: settings */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-0.5">Widget · Configuration</p>
              <h2 className="text-[17px] font-bold text-[#111827] tracking-[-0.01em]">{catalog.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[8px] bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:bg-[#E5E7EB] transition-colors"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Settings body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {renderPanel()}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2.5 px-6 py-4"
            style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}
          >
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-[9px] text-[13px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              style={{ border: '1px solid rgba(0,15,30,0.1)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(widget.id, localCfg); onClose(); }}
              className="h-9 px-5 rounded-[9px] text-[13px] font-semibold text-white bg-[#000F1E] hover:bg-[#0D1E35] transition-colors flex items-center gap-1.5"
            >
              Apply changes <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add-widget modal ─────────────────────────────────────────────────────────

function AddWidgetModal({
  activeWidgetIds, onAdd, onClose,
}: {
  activeWidgetIds: string[];
  onAdd: (catalogId: string, size: WidgetSize) => void;
  onClose: () => void;
}) {
  const available = WIDGET_CATALOG.filter(w => !activeWidgetIds.includes(w.id));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,15,30,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[20px] w-full max-w-[680px] max-h-[85vh] overflow-hidden flex flex-col fade-up"
        style={{ boxShadow: '0 24px 64px rgba(0,15,30,0.18), 0 4px 12px rgba(0,15,30,0.08)' }}>
        <div className="flex items-start justify-between px-7 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
          <div>
            <h2 className="text-[18px] font-bold text-[#111827] tracking-[-0.02em]">Add a widget</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">
              {available.length === 0 ? 'All available widgets are already on the dashboard.' : 'Choose a widget to add to the dashboard.'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[8px] bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:bg-[#E5E7EB] transition-colors ml-4 flex-shrink-0">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="overflow-y-auto px-7 py-5">
          {available.length === 0 ? (
            <div className="text-center py-10 text-[#9CA3AF] text-[14px]">All widgets are already on the dashboard.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {available.map(widget => {
                const Icon = widget.icon;
                const PreviewEl = widget.Preview;
                return (
                  <button
                    key={widget.id}
                    onClick={() => onAdd(widget.id, widget.defaultSize)}
                    className="text-left bg-white rounded-[14px] overflow-hidden group transition-all duration-200 hover:shadow-[0_6px_20px_rgba(0,15,30,0.1)] hover:-translate-y-0.5"
                    style={{ border: '1.5px solid #E5E7EB' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = widget.accent)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                  >
                    <div className="border-b" style={{ borderColor: 'rgba(0,15,30,0.06)', background: '#FAFAFA' }}>
                      <PreviewEl />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-[6px] flex items-center justify-center" style={{ background: widget.accent + '18' }}>
                              <Icon size={13} strokeWidth={1.75} style={{ color: widget.accent }} />
                            </div>
                            <span className="text-[14px] font-bold text-[#111827]">{widget.title}</span>
                            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                              {widget.defaultSize === 'full' ? 'Full width' : 'Half width'}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-[#6B7280] leading-relaxed">{widget.description}</p>
                        </div>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:scale-110" style={{ background: widget.accent + '18', color: widget.accent }}>
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

// ─── Read-only page view banner ───────────────────────────────────────────────

function ReadOnlyBanner({ pageKey }: { pageKey: PageKey }) {
  const meta = PAGE_META[pageKey];
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] mb-6"
      style={{ background: meta.color + '0C', border: `1px solid ${meta.color}22` }}>
      <meta.Icon size={14} strokeWidth={1.75} style={{ color: meta.color }} className="flex-shrink-0" />
      <p className="text-[12.5px] font-medium" style={{ color: meta.color }}>
        <strong>Read-only preview</strong> — this is exactly what viewers see on the <strong>{meta.label}</strong> page.
        No modifications needed; the page is managed automatically from your data.
      </p>
    </div>
  );
}

// ─── Full page views (read-only) ──────────────────────────────────────────────

function FindingsPageView() {
  const { data } = useData();
  const [filter, setFilter] = useState('All');
  const statuses = ['All', 'Reported', 'Acknowledged', 'Fix in progress', 'Resolved'];
  const filtered = filter === 'All' ? data.findings : data.findings.filter(f => f.status === filter);
  const counts: Record<string, number> = { All: data.findings.length };
  statuses.slice(1).forEach(s => { counts[s] = data.findings.filter(f => f.status === s).length; });

  return (
    <div>
      <ReadOnlyBanner pageKey="findings" />
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-bold text-[#111827] tracking-[-0.02em]">Findings</h2>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">{data.findings.length} total findings</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-all duration-150"
            style={{ background: filter === s ? '#000F1E' : '#FFFFFF', color: filter === s ? '#fff' : '#4B5563', border: '1px solid', borderColor: filter === s ? '#000F1E' : '#E5E7EB' }}>
            {s} <span className="opacity-60">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(f => (
          <div key={f.id} className="bg-white rounded-[14px] p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
            <div className="flex gap-2 mb-2 flex-wrap">
              {f.isPinned && <span className="text-[11px] font-semibold bg-[#FFF7ED] text-[#C2410C] px-2 py-0.5 rounded-full">Pinned</span>}
              <StatusBadge status={f.status} />
            </div>
            <p className="text-[14.5px] font-bold text-[#111827] leading-snug mb-1.5">{f.title}</p>
            <p className="text-[12.5px] text-[#6B7280] leading-relaxed line-clamp-2 mb-3">{f.description}</p>
            <div className="flex items-center justify-between text-[11.5px] text-[#9CA3AF]">
              <span>{f.site} · {f.severity}</span>
              <span>Added {f.dateAdded}</span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-10 text-[#9CA3AF] text-[14px]">No findings match this filter.</p>}
    </div>
  );
}

function ExperimentsPageView() {
  const { data } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const statusConfig = [
    { key: 'Running', color: '#3B82F6' }, { key: 'Planning', color: '#9CA3AF' },
    { key: 'Complete', color: '#22C55E' }, { key: 'Blocked', color: '#F43F5E' },
  ];
  const filtered = data.experiments.filter(e => {
    const matchFilter = filter === 'All' || e.status === filter;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <ReadOnlyBanner pageKey="experiments" />
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-bold text-[#111827] tracking-[-0.02em]">Experiments</h2>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">{data.experiments.length} experiments</p>
        </div>
      </div>
      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {statusConfig.map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? 'All' : s.key)}
            className="bg-white rounded-[12px] p-4 text-left transition-all hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)]"
            style={{ boxShadow: filter === s.key ? `0 0 0 2px ${s.color}` : '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            </div>
            <p className="text-[26px] font-bold text-[#111827] tracking-[-0.02em] tabular-nums">
              {data.experiments.filter(e => e.status === s.key).length}
            </p>
            <p className="text-[12px] text-[#6B7280]">{s.key}</p>
          </button>
        ))}
      </div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search experiments…"
          className="w-full h-10 pl-9 pr-4 rounded-[10px] text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none bg-white"
          style={{ border: '1.5px solid #E5E7EB' }}
          onFocus={e => { e.target.style.border='1.5px solid #000F1E'; }}
          onBlur={e => { e.target.style.border='1.5px solid #E5E7EB'; }}
        />
      </div>
      {/* Table */}
      <div className="bg-white rounded-[14px] overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,15,30,0.06)', background: '#FAFAFA' }}>
              {['Experiment', 'Status', 'Owner', 'Last Updated'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.06em]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,15,30,0.04)' : 'none' }}
                className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-5 py-3.5 text-[13.5px] font-semibold text-[#111827]">{e.title}</td>
                <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                <td className="px-5 py-3.5 text-[13px] text-[#6B7280]">{e.owner}</td>
                <td className="px-5 py-3.5 text-[13px] text-[#6B7280]">{e.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-10 text-[#9CA3AF] text-[14px]">No results.</p>}
      </div>
    </div>
  );
}

function TimelinePageView() {
  const { data } = useData();
  const ENGAGEMENT_START = new Date('2026-05-18');
  const TOTAL_DAYS = (new Date('2026-09-07').getTime() - ENGAGEMENT_START.getTime()) / 86400000;
  const TODAY_PCT  = ((new Date('2026-06-10').getTime() - ENGAGEMENT_START.getTime()) / 86400000 / TOTAL_DAYS) * 100;
  const MONTHS2: Record<string,number> = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  function datePct(s: string) {
    const [m,d]=s.split(' '); const dt=new Date(2026,MONTHS2[m],parseInt(d));
    return Math.max(0,Math.min(100,((dt.getTime()-ENGAGEMENT_START.getTime())/86400000/TOTAL_DAYS)*100));
  }

  return (
    <div>
      <ReadOnlyBanner pageKey="timeline" />
      <h2 className="text-[22px] font-bold text-[#111827] tracking-[-0.02em] mb-1">Timeline</h2>
      <p className="text-[13px] text-[#9CA3AF] mb-6">May 18 – Sep 7, 2026 · 16 weeks</p>
      {/* Gantt */}
      <div className="bg-white rounded-[14px] p-5 mb-6"
        style={{ height: 300, boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: '1px solid rgba(0,15,30,0.05)' }}>
        <GanttProvider range="monthly" zoom={75}>
          <GanttSidebar>
            <GanttSidebarGroup name="Phases">
              {ganttFeaturesFromPhases(data.timelinePhases).map(f => <GanttSidebarItem key={f.id} feature={f}/>)}
            </GanttSidebarGroup>
          </GanttSidebar>
          <GanttTimeline>
            <GanttHeader/>
            <GanttFeatureList>
              <GanttFeatureListGroup>
                {ganttFeaturesFromPhases(data.timelinePhases).map(f => (
                  <GanttFeatureItem key={f.id} {...f}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:f.status.color}}/>
                      <span className="text-[11px] font-semibold truncate" style={{color:f.status.color}}>{f.name}</span>
                    </div>
                  </GanttFeatureItem>
                ))}
              </GanttFeatureListGroup>
            </GanttFeatureList>
            <GanttToday/>
          </GanttTimeline>
        </GanttProvider>
      </div>
      {/* Milestones */}
      <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">Key milestones</p>
      <div className="grid grid-cols-2 gap-3">
        {data.milestones.map(m => (
          <div key={m.id} className="bg-white rounded-[12px] p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: m.isHighlighted ? '1.5px solid #3B82F6' : '1px solid rgba(0,15,30,0.05)' }}>
            <StatusBadge status={m.status} className="mb-2"/>
            <p className={`text-[13px] font-bold leading-snug mb-1 ${m.status==='Complete'?'text-[#15803D]':m.isHighlighted?'text-[#1D4ED8]':'text-[#111827]'}`}>{m.title}</p>
            <p className="text-[11px] text-[#9CA3AF]">{m.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestonesPageView() {
  const { data } = useData();
  return (
    <div>
      <ReadOnlyBanner pageKey="milestones" />
      <h2 className="text-[22px] font-bold text-[#111827] tracking-[-0.02em] mb-1">Milestones</h2>
      <p className="text-[13px] text-[#9CA3AF] mb-6">{data.milestones.length} milestones</p>
      <div className="grid grid-cols-2 gap-4">
        {data.milestones.map(m => (
          <div key={m.id} className="bg-white rounded-[14px] p-5 transition-all hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)]"
            style={{ boxShadow: '0 1px 3px rgba(0,15,30,0.06)', border: m.isHighlighted ? '1.5px solid #3B82F6' : '1px solid rgba(0,15,30,0.05)' }}>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={m.status}/>
              {m.isHighlighted && <span className="text-[10.5px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full">Checkpoint</span>}
            </div>
            <p className={`text-[14px] font-bold leading-snug mb-1.5 ${m.status==='Complete'?'text-[#15803D]':m.isHighlighted?'text-[#1D4ED8]':'text-[#111827]'}`}>{m.title}</p>
            <p className="text-[12px] font-semibold text-[#9CA3AF] mb-2">{m.date}</p>
            <p className="text-[13px] text-[#6B7280] leading-relaxed">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper so timeline view can build gantt features without repeating the logic
function ganttFeaturesFromPhases(phases: { id: string; name: string; startDate: string; endDate: string; status: string }[]) {
  const MONTHS3: Record<string,number> = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  return phases.map(p => ({
    id: p.id, name: p.name,
    startAt: (() => { const [m,d]=p.startDate.split(' '); return new Date(2026,MONTHS3[m],parseInt(d)); })(),
    endAt:   (() => { const [m,d]=p.endDate.split(' ');   return new Date(2026,MONTHS3[m],parseInt(d)); })(),
    status:  { id: p.id, name: p.name, color: PHASE_COLORS[p.id] ?? '#6B7280' },
  }));
}

// ─── Add page modal ───────────────────────────────────────────────────────────

function AddPageModal({ existingKeys, onAdd, onClose }: {
  existingKeys: PageKey[];
  onAdd: (key: PageKey) => void;
  onClose: () => void;
}) {
  const available = (Object.keys(PAGE_META) as PageKey[]).filter(k => !existingKeys.includes(k));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,15,30,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[20px] w-full max-w-[520px] fade-up"
        style={{ boxShadow: '0 24px 64px rgba(0,15,30,0.18)' }}>
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
          <div>
            <h2 className="text-[17px] font-bold text-[#111827] tracking-[-0.02em]">Add a page</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">
              {available.length === 0 ? 'All available pages are already added.' : 'Choose which page to add to the dashboard.'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[8px] bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:bg-[#E5E7EB] transition-colors ml-4">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        {/* Options */}
        <div className="px-7 py-5 space-y-2.5">
          {available.length === 0
            ? <p className="text-center py-8 text-[#9CA3AF] text-[14px]">All pages are already on the dashboard.</p>
            : available.map(key => {
              const m = PAGE_META[key];
              return (
                <button key={key} onClick={() => onAdd(key)}
                  className="w-full flex items-center gap-4 p-4 rounded-[14px] text-left group transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,15,30,0.08)] hover:-translate-y-0.5"
                  style={{ border: '1.5px solid #E5E7EB', background: '#FAFAFA' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = m.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background: m.color + '14' }}>
                    <m.Icon size={18} strokeWidth={1.75} style={{ color: m.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#111827]">{m.label}</p>
                    <p className="text-[12.5px] text-[#6B7280] mt-0.5">{m.description}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} className="text-[#9CA3AF] group-hover:text-[#374151] transition-colors flex-shrink-0" />
                </button>
              );
            })
          }
        </div>
        <div className="px-7 pb-6">
          <button onClick={onClose} className="w-full h-10 rounded-[10px] text-[13.5px] font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors" style={{ border: '1px solid rgba(0,15,30,0.1)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable widget shell ────────────────────────────────────────────────────

function SortableWidget({
  widget, onSizeChange, onRemove, onConfigure, children, isDragOverlay = false,
}: {
  widget: WidgetDef;
  onSizeChange: (id: string, size: WidgetSize) => void;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
  children: React.ReactNode;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const catalog = WIDGET_CATALOG.find(c => c.id === widget.catalogId);
  const title = catalog?.title ?? widget.catalogId;

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
      <div
        className="flex items-center justify-between px-5 py-3 select-none"
        style={{ borderBottom: '1px solid rgba(0,15,30,0.05)', background: '#FAFAFA' }}
      >
        <div className="flex items-center gap-2.5">
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
            {(['full','half'] as WidgetSize[]).map(s => (
              <button
                key={s}
                onClick={() => onSizeChange(widget.id, s)}
                className={`px-2.5 h-[22px] rounded-[5px] text-[11px] font-semibold transition-all duration-150 ${widget.size === s ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,15,30,0.1)]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}
              >
                {s === 'full' ? 'Full' : '½'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRemove(widget.id)}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[#9CA3AF] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-all"
            title="Remove widget"
          >
            <Trash2 size={12} strokeWidth={1.75} />
          </button>

          {/* Configuration — secondary style */}
          <button
            onClick={() => onConfigure(widget.id)}
            className="h-7 px-3 rounded-[7px] text-[11.5px] font-semibold flex items-center gap-1.5 transition-all hover:bg-[#E5E7EB]"
            style={{ background: '#F3F4F6', color: '#374151', border: '1px solid rgba(0,15,30,0.08)' }}
          >
            <Settings2 size={12} strokeWidth={1.75} />
            Configure
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
    { id: 'w-metrics',     catalogId: 'metrics',     size: 'full', config: { ...DEFAULT_CONFIGS.metrics } },
    { id: 'w-findings',    catalogId: 'findings',    size: 'full', config: { ...DEFAULT_CONFIGS.findings } },
    { id: 'w-statusTable', catalogId: 'statusTable', size: 'half', config: { ...DEFAULT_CONFIGS.statusTable } },
  ]);
  const [activeId,      setActiveId]      = useState<string | null>(null);
  const [addModal,      setAddModal]      = useState(false);
  const [insertIndex,   setInsertIndex]   = useState<number | null>(null);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [pages,         setPages]         = useState<PageDef[]>(DEFAULT_PAGES);
  const [activePage,    setActivePage]    = useState<string>('pg-overview');
  const [addPageModal,  setAddPageModal]  = useState(false);

  function handleAddPage(key: PageKey) {
    const meta = PAGE_META[key];
    const newPage: PageDef = { id: `pg-${key}-${Date.now()}`, key, label: meta.label };
    setPages(prev => [...prev, newPage]);
    setActivePage(newPage.id);
    setAddPageModal(false);
  }

  function handleDeletePage(id: string) {
    setPages(prev => {
      const updated = prev.filter(p => p.id !== id);
      // If we deleted the active page, switch to overview
      if (activePage === id) setActivePage('pg-overview');
      return updated;
    });
  }

  const activePageDef = pages.find(p => p.id === activePage) ?? pages[0];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string); }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setWidgets(prev => {
        const oldIdx = prev.findIndex(w => w.id === active.id);
        const newIdx = prev.findIndex(w => w.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  function handleSizeChange(id: string, size: WidgetSize) {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w));
  }
  function handleRemove(id: string) { setWidgets(prev => prev.filter(w => w.id !== id)); }
  function handleSaveConfig(id: string, config: Record<string, any>) {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, config } : w));
  }
  function openAddModal(atIndex: number) { setInsertIndex(atIndex); setAddModal(true); }
  function handleAddWidget(catalogId: string, size: WidgetSize) {
    const newWidget: WidgetDef = {
      id: `w-${catalogId}-${Date.now()}`,
      catalogId, size,
      config: { ...(DEFAULT_CONFIGS[catalogId] ?? {}) },
    };
    setWidgets(prev => {
      if (insertIndex === null || insertIndex >= prev.length) return [...prev, newWidget];
      const next = [...prev];
      next.splice(insertIndex + 1, 0, newWidget);
      return next;
    });
    setAddModal(false);
  }

  const activeWidget     = widgets.find(w => w.id === activeId);
  const configuringWidget = widgets.find(w => w.id === configuringId);
  const activeCatalogIds = widgets.map(w => w.catalogId);

  // ── Widget renderers ────────────────────────────────────────────────────────

  const pinnedFindings   = data.findings.filter(f => f.isPinned);
  const activeFindings   = data.findings.filter(f => f.status !== 'Resolved').length;
  const runningExp       = data.experiments.filter(e => e.status === 'Running').length;
  const resolvedFindings = data.findings.filter(f => f.status === 'Resolved').length;

  const ganttFeatures: GanttFeature[] = data.timelinePhases.map(p => ({
    id: p.id, name: p.name,
    startAt: parseDate(p.startDate), endAt: parseDate(p.endDate),
    status: { id: p.id, name: p.name, color: PHASE_COLORS[p.id] ?? '#6B7280' },
  }));

  function renderWidget(w: WidgetDef): React.ReactNode {
    const cfg = w.config;
    switch (w.catalogId) {
      case 'metrics': {
        const c = cfg as MetricsConfig;
        const visible = [
          c.visibleMetrics?.findings    !== false && { label:'Active findings',     value:activeFindings,   sub:'↑ 3 since last week',     color:'#F97316' },
          c.visibleMetrics?.experiments !== false && { label:'Experiments running', value:runningExp,       sub:'2 completed this week',   color:'#9CA3AF' },
          c.visibleMetrics?.anomaly     !== false && { label:'Anomaly rate',         value:'9.7%',           sub:'↓ Highest since cutover', color:'#BE123C' },
          c.visibleMetrics?.resolved    !== false && { label:'Resolved findings',   value:resolvedFindings, sub:'✓ 2 resolved this week',   color:'#15803D' },
        ].filter(Boolean) as { label:string; value:any; sub:string; color:string }[];
        const cols = c.columns ?? 4;
        return (
          <div className={`grid gap-3`} style={{ gridTemplateColumns:`repeat(${cols},minmax(0,1fr))` }}>
            {visible.map(m => (
              <div key={m.label} className="rounded-[12px] p-4" style={{ background:'#F9FAFB', border:'1px solid rgba(0,15,30,0.05)' }}>
                <p className="text-[12px] text-[#6B7280] mb-2">{m.label}</p>
                <p className="text-[26px] font-bold text-[#111827] leading-none tracking-[-0.02em] tabular-nums mb-1">{m.value}</p>
                <p className="text-[11.5px] font-medium" style={{ color:m.color }}>{m.sub}</p>
              </div>
            ))}
          </div>
        );
      }

      case 'findings': {
        const c = cfg as FindingsConfig;
        const count = c.count ?? 3;
        return (
          <div className={`grid gap-3`} style={{ gridTemplateColumns:`repeat(${count},minmax(0,1fr))` }}>
            {pinnedFindings.slice(0, count).map(f => (
              <div key={f.id} className="rounded-[12px] overflow-hidden" style={{ border:'1px solid rgba(0,15,30,0.06)' }}>
                <div className="h-24 relative" style={{ background:'repeating-linear-gradient(45deg,#F3F4F6 0,#F3F4F6 1px,#FAFAFA 1px,#FAFAFA 16px)' }}>
                  {c.showBadge !== false && f.status === 'Reported' && <span className="absolute top-2 right-2 bg-[#C2410C] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>}
                </div>
                <div className="p-3 bg-white">
                  <p className="text-[13px] font-semibold text-[#111827] mb-1 line-clamp-2 leading-snug">{f.title}</p>
                  {c.showDescription !== false && <p className="text-[11.5px] text-[#6B7280] mb-1.5 line-clamp-1">{f.description}</p>}
                  <StatusBadge status={f.status} />
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'statusTable': {
        const c = cfg as StatusTableConfig;
        const rows = c.rows ?? 4;
        const filtered = c.filterStatus && c.filterStatus !== 'all'
          ? data.experiments.filter(e => e.status === c.filterStatus)
          : data.experiments;
        return (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(0,15,30,0.05)' }}>
                <th className="text-left pb-2.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.06em]">Experiment</th>
                <th className="text-left pb-2.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.06em]">Status</th>
                {c.showOwner       !== false && <th className="text-left pb-2.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.06em]">Owner</th>}
                {c.showLastUpdated !== false && <th className="text-left pb-2.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.06em]">Updated</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, rows).map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < Math.min(rows, filtered.length) - 1 ? '1px solid rgba(0,15,30,0.04)' : 'none' }}>
                  <td className="py-2.5 pr-3 text-[13px] text-[#111827] leading-snug">{e.title}</td>
                  <td className="py-2.5 pr-3"><StatusBadge status={e.status} /></td>
                  {c.showOwner       !== false && <td className="py-2.5 pr-3 text-[13px] text-[#6B7280]">{e.owner}</td>}
                  {c.showLastUpdated !== false && <td className="py-2.5 text-[13px] text-[#6B7280]">{e.lastUpdated}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case 'timeline': {
        const c = cfg as TimelineConfig;
        return (
          <div className="rounded-[12px] overflow-hidden" style={{ height:'260px', border:'1px solid rgba(0,15,30,0.06)' }}>
            <GanttProvider range={c.range ?? 'monthly'} zoom={c.zoom ?? 70}>
              {c.showSidebar !== false && (
                <GanttSidebar>
                  <GanttSidebarGroup name="Phases">
                    {ganttFeatures.map(f => <GanttSidebarItem key={f.id} feature={f} />)}
                  </GanttSidebarGroup>
                </GanttSidebar>
              )}
              <GanttTimeline>
                <GanttHeader />
                <GanttFeatureList>
                  <GanttFeatureListGroup>
                    {ganttFeatures.map(f => (
                      <GanttFeatureItem key={f.id} {...f}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor:f.status.color }}/>
                          <span className="text-[11px] font-semibold truncate" style={{ color:f.status.color }}>{f.name}</span>
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
      }

      case 'milestones': {
        const c = cfg as MilestonesConfig;
        const count = c.count ?? 4;
        const filtered = c.filterStatus && c.filterStatus !== 'all'
          ? data.milestones.filter(m => m.status === c.filterStatus)
          : data.milestones;
        return (
          <div className="grid grid-cols-2 gap-3">
            {filtered.slice(0, count).map(m => (
              <div key={m.id} className="rounded-[12px] p-4" style={{ background:'#F9FAFB', border:m.isHighlighted?'1.5px solid #3B82F6':'1px solid rgba(0,15,30,0.05)' }}>
                <StatusBadge status={m.status} className="mb-2" />
                <p className={`text-[13px] font-semibold leading-snug mb-1 ${m.status==='Complete'?'text-[#15803D]':m.isHighlighted?'text-[#1D4ED8]':'text-[#111827]'}`}>{m.title}</p>
                <p className="text-[11px] text-[#9CA3AF]">{m.date}</p>
              </div>
            ))}
          </div>
        );
      }

      default:
        return <div className="text-[13px] text-[#9CA3AF] py-4 text-center">Unknown widget type.</div>;
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
            <select value={previewSlug} onChange={e => setPreviewSlug(e.target.value)} className="text-[13px] font-medium text-[#111827] outline-none bg-transparent">
              <option value="">Select viewer…</option>
              {data.shareLinks.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
            </select>
          </div>
          {previewSlug && (
            <Link href={`/view/${previewSlug}/overview`} target="_blank"
              className="h-10 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#F3F4F6]"
              style={{ border:'1px solid rgba(0,15,30,0.1)', color:'#234474' }}>
              Preview <ExternalLink size={12} strokeWidth={2} />
            </Link>
          )}
          <button className="h-10 px-5 rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#0D1E35]" style={{ background:'#000F1E' }}>Done</button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex items-center gap-1 mb-6 fade-up fade-up-1">
        <div className="flex items-center gap-1 bg-white rounded-[12px] p-1 flex-wrap" style={CARD_STYLE}>
          {pages.map(page => {
            const isActive  = page.id === activePage;
            const isOverview = page.key === 'overview';
            const meta      = PAGE_META[page.key];
            return (
              <div key={page.id} className="relative group flex items-center">
                <button
                  onClick={() => setActivePage(page.id)}
                  className={`flex items-center gap-1.5 pl-3 h-8 rounded-[8px] text-[13px] font-medium transition-all ${
                    isActive ? 'bg-[#000F1E] text-white pr-3' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] pr-3'
                  } ${!isOverview && !isActive ? 'pr-7' : ''}`}
                >
                  <meta.Icon size={12} strokeWidth={isActive ? 2 : 1.75}
                    className={isActive ? 'text-white' : 'text-[#9CA3AF]'} />
                  {page.label}
                </button>
                {/* Delete button — visible on hover for non-overview tabs */}
                {!isOverview && (
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    className={`absolute right-1 w-5 h-5 rounded-[5px] flex items-center justify-center transition-all ${
                      isActive
                        ? 'text-white/60 hover:text-white hover:bg-white/20 opacity-100'
                        : 'text-[#9CA3AF] hover:text-[#BE123C] hover:bg-[#FFF1F2] opacity-0 group-hover:opacity-100'
                    }`}
                    title={`Remove ${page.label} page`}
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* Add page */}
        <button
          onClick={() => setAddPageModal(true)}
          className="flex items-center gap-1.5 h-10 px-3.5 rounded-[12px] text-[13px] font-semibold text-[#6B7280] hover:text-[#111827] hover:bg-white transition-all"
          style={{ border: '1.5px dashed #E5E7EB' }}
          title="Add a new page"
        >
          <Plus size={13} strokeWidth={2.5} /> Add page
        </button>
      </div>

      {/* Overview — widget builder */}
      {activePageDef?.key === 'overview' && (
        <>
          <p className="text-[12px] text-[#9CA3AF] mb-4 fade-up flex items-center gap-1.5">
            <GripVertical size={12} strokeWidth={1.75} className="inline" />
            Drag to reorder · Toggle <span className="font-semibold text-[#6B7280]">Full / ½</span> to resize · <Settings2 size={11} strokeWidth={1.75} className="inline" /> to configure
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-3" style={{ gridTemplateColumns:'repeat(2,minmax(0,1fr))' }}>
                {widgets.map((widget) => (
                  <SortableWidget
                    key={widget.id}
                    widget={widget}
                    onSizeChange={handleSizeChange}
                    onRemove={handleRemove}
                    onConfigure={id => setConfiguringId(id)}
                  >
                    {renderWidget(widget)}
                  </SortableWidget>
                ))}
                <AddWidgetZone span={2} onClick={() => openAddModal(widgets.length - 1)} />
                {lastWidgetIsHalf && <AddWidgetZone span={1} onClick={() => openAddModal(widgets.length - 1)} />}
              </div>
            </SortableContext>

        <DragOverlay dropAnimation={{ duration:180, easing:'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
          {activeWidget ? (
            <SortableWidget widget={activeWidget} onSizeChange={() => {}} onRemove={() => {}} onConfigure={() => {}} isDragOverlay>
              {renderWidget(activeWidget)}
            </SortableWidget>
          ) : null}
        </DragOverlay>
      </DndContext>
        </>
      )}

      {/* Other page views — read-only */}
      {activePageDef?.key === 'findings'    && <FindingsPageView />}
      {activePageDef?.key === 'experiments' && <ExperimentsPageView />}
      {activePageDef?.key === 'timeline'    && <TimelinePageView />}
      {activePageDef?.key === 'milestones'  && <MilestonesPageView />}

      {/* Add widget modal */}
      {addModal && (
        <AddWidgetModal
          activeWidgetIds={activeCatalogIds}
          onAdd={handleAddWidget}
          onClose={() => setAddModal(false)}
        />
      )}

      {/* Config modal */}
      {configuringWidget && (
        <WidgetConfigModal
          widget={configuringWidget}
          onSave={handleSaveConfig}
          onClose={() => setConfiguringId(null)}
        />
      )}

      {/* Add page modal */}
      {addPageModal && (
        <AddPageModal
          existingKeys={pages.map(p => p.key)}
          onAdd={handleAddPage}
          onClose={() => setAddPageModal(false)}
        />
      )}
    </div>
  );
}
