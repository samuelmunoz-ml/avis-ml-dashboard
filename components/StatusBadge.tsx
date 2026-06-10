type Status = string;

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Reported:         { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  Acknowledged:     { bg: '#F9FAFB', text: '#4B5563', dot: '#9CA3AF' },
  'Fix in progress':{ bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  Resolved:         { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  Running:          { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  Planning:         { bg: '#F9FAFB', text: '#4B5563', dot: '#9CA3AF' },
  Complete:         { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  Blocked:          { bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E' },
  Pending:          { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  Confirmed:        { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  Failed:           { bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E' },
  New:              { bg: '#C2410C', text: '#FFFFFF', dot: '#FFFFFF' },
  Upcoming:         { bg: '#F9FAFB', text: '#4B5563', dot: '#9CA3AF' },
  'In Progress':    { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
};

export default function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  const cfg = statusConfig[status] ?? { bg: '#F9FAFB', text: '#4B5563', dot: '#9CA3AF' };
  const isNew = status === 'New';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 h-[26px] rounded-full text-[12px] font-semibold whitespace-nowrap ${className}`}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {!isNew && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      )}
      {status}
    </span>
  );
}
