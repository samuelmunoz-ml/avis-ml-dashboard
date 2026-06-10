'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUnseenCount, getShareLink } from '@/lib/store';
import {
  LayoutDashboard,
  AlertCircle,
  FlaskConical,
  CalendarDays,
} from 'lucide-react';

interface Props { slug: string }

const NAV_ICONS = {
  overview: LayoutDashboard,
  findings: AlertCircle,
  experiments: FlaskConical,
  timeline: CalendarDays,
};

export default function ViewerSidebar({ slug }: Props) {
  const pathname = usePathname();
  const [unseenCount, setUnseenCount] = useState(0);
  const [sections, setSections] = useState({ overview: true, findings: true, experiments: true, timeline: true });

  useEffect(() => {
    setUnseenCount(getUnseenCount(slug));
    const link = getShareLink(slug);
    if (link) setSections(link.sections);
  }, [slug, pathname]);

  const navItems = [
    { label: 'Overview', href: `/view/${slug}/overview`, key: 'overview' },
    { label: 'Findings', href: `/view/${slug}/findings`, key: 'findings', badge: unseenCount > 0 ? unseenCount : undefined },
    { label: 'Experiments', href: `/view/${slug}/experiments`, key: 'experiments' },
    { label: 'Timeline', href: `/view/${slug}/timeline`, key: 'timeline' },
  ].filter((item) => sections[item.key as keyof typeof sections]);

  return (
    <aside className="w-[220px] min-h-screen bg-white flex flex-col flex-shrink-0" style={{ borderRight: '1px solid rgba(0,15,30,0.06)', boxShadow: '1px 0 0 rgba(0,15,30,0.04)' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(0,15,30,0.06)' }}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[#DA291C] font-bold text-[17px] tracking-[-0.02em]">AVIS</span>
          <span className="text-[9px] text-[#DA291C] font-semibold mt-[-4px]">®</span>
        </div>
        <p className="text-[11px] text-[#9CA3AF] font-medium tracking-[0.01em]">Monstarlab Research</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = NAV_ICONS[item.key as keyof typeof NAV_ICONS];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium group transition-all duration-200 ${
                isActive
                  ? 'bg-[#000F1E] text-white'
                  : 'text-[#6B7280] hover:bg-[#F5F5F5] hover:text-[#111827]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  size={15}
                  strokeWidth={isActive ? 2 : 1.75}
                  className={isActive ? 'text-white' : 'text-[#9CA3AF] group-hover:text-[#4B5563]'}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? 'bg-white/20 text-white' : 'bg-[#E65100] text-white'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}>
        <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
          Prepared by Monstarlab ML team<br />for Avis Budget Group
        </p>
      </div>
    </aside>
  );
}
