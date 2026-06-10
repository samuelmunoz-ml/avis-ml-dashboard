'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutTemplate,
  FileText,
  Users,
  Type,
  RefreshCw,
  Link2,
  ExternalLink,
} from 'lucide-react';

const sections = [
  {
    label: 'COMPOSE',
    items: [{ label: 'Widget Builder', href: '/admin', icon: LayoutTemplate }],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Findings', href: '/admin/findings', icon: FileText },
      { label: 'Team', href: '/admin/team', icon: Users },
      { label: 'Text blocks', href: '/admin/text-blocks', icon: Type },
    ],
  },
  { label: 'DATA', items: [{ label: 'Source sync', href: '/admin/source-sync', icon: RefreshCw }] },
  { label: 'ACCESS', items: [{ label: 'Share links', href: '/admin/share-links', icon: Link2 }] },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] min-h-screen bg-white flex flex-col flex-shrink-0" style={{ borderRight: '1px solid rgba(0,15,30,0.06)', boxShadow: '1px 0 0 rgba(0,15,30,0.04)' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[#DA291C] font-bold text-[17px] tracking-[-0.02em]">AVIS</span>
          <span className="text-[9px] text-[#DA291C] font-semibold mt-[-4px]">®</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[#9CA3AF] font-medium">Monstarlab Research</p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#F5F5F5] text-[#6B7280]">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#9CA3AF] tracking-[0.12em] uppercase">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium group transition-all duration-200 ${
                      isActive
                        ? 'bg-[#000F1E] text-white'
                        : 'text-[#6B7280] hover:bg-[#F5F5F5] hover:text-[#111827]'
                    }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={isActive ? 2 : 1.75}
                      className={isActive ? 'text-white' : 'text-[#9CA3AF] group-hover:text-[#4B5563]'}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* View live */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}>
        <Link
          href="/view/james-adams"
          className="flex items-center gap-2 text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ExternalLink size={12} strokeWidth={1.75} />
          View as stakeholder
        </Link>
      </div>
    </aside>
  );
}
