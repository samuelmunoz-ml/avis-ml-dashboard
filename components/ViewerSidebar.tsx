'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUnseenCount, getShareLink } from '@/lib/store';

interface Props {
  slug: string;
}

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
    <aside className="w-64 min-h-screen bg-white border-r border-[#DAD9D6] flex flex-col flex-shrink-0">
      <div className="px-4 pt-6 pb-4 border-b border-[#DAD9D6]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#DA291C] font-bold text-lg tracking-tight">AVIS</span>
          <span className="text-[8px] text-[#DA291C] font-medium mt-0.5">®</span>
        </div>
        <p className="text-xs text-[#939598]">Monstarlab Research Dashboard</p>
      </div>
      <nav className="flex-1 px-2 pt-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-[#EFF0F0] text-[#000F1E] font-medium'
                  : 'text-[#464A4D] hover:bg-[#F7F7F6] hover:text-[#000F1E]'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="bg-[#E65100] text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
