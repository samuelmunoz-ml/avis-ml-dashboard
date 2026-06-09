import { FindingStatus, ExperimentStatus } from '@/lib/types';

type Status = FindingStatus | ExperimentStatus | 'New' | 'Pending' | 'Confirmed' | 'Failed' | string;

const statusStyles: Record<string, string> = {
  Reported: 'bg-[#FFF3E0] text-[#E65100]',
  Acknowledged: 'bg-[#EFF0F0] text-[#464A4D]',
  'Fix in progress': 'bg-[#E3F2FD] text-[#1565C0]',
  Resolved: 'bg-[#E8F5E9] text-[#2E7D32]',
  Running: 'bg-[#E3F2FD] text-[#1565C0]',
  Planning: 'bg-[#EFF0F0] text-[#464A4D]',
  Complete: 'bg-[#E8F5E9] text-[#2E7D32]',
  Blocked: 'bg-[#FFEBEE] text-[#C62828]',
  Pending: 'bg-[#FFF3E0] text-[#E65100]',
  Confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
  Failed: 'bg-[#FFEBEE] text-[#C62828]',
  New: 'bg-[#E65100] text-white',
  Upcoming: 'bg-[#EFF0F0] text-[#464A4D]',
  'In Progress': 'bg-[#E3F2FD] text-[#1565C0]',
};

export default function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  const style = statusStyles[status] ?? 'bg-[#EFF0F0] text-[#464A4D]';
  return (
    <span
      className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-medium whitespace-nowrap ${style} ${className}`}
    >
      {status}
    </span>
  );
}
