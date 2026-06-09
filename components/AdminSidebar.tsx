'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { label: 'COMPOSE', items: [{ label: 'Widget Builder', href: '/admin' }] },
  {
    label: 'CONTENT',
    items: [
      { label: 'Findings', href: '/admin/findings' },
      { label: 'Team', href: '/admin/team' },
      { label: 'Text blocks', href: '/admin/text-blocks' },
    ],
  },
  { label: 'DATA', items: [{ label: 'Source sync', href: '/admin/source-sync' }] },
  { label: 'ACCESS', items: [{ label: 'Share link', href: '/admin/share-links' }] },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[#DAD9D6] flex flex-col flex-shrink-0">
      <div className="px-4 pt-6 pb-4 border-b border-[#DAD9D6]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#DA291C] font-bold text-lg tracking-tight">AVIS</span>
          <span className="text-[8px] text-[#DA291C] font-medium mt-0.5">®</span>
        </div>
        <p className="text-xs text-[#939598]">Monstarlab Research Dashboard</p>
      </div>
      <nav className="flex-1 px-2 pt-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-medium text-[#939598] tracking-widest uppercase">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-[#EFF0F0] text-[#000F1E] font-medium'
                        : 'text-[#464A4D] hover:bg-[#F7F7F6] hover:text-[#000F1E]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
