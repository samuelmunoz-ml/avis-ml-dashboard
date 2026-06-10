'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutTemplate, FileText, Users, Type,
  RefreshCw, Link2, ExternalLink, LogOut,
} from 'lucide-react';

const sections = [
  { label: 'COMPOSE',  items: [{ label: 'Widget Builder', href: '/admin',              icon: LayoutTemplate }] },
  { label: 'CONTENT',  items: [
    { label: 'Findings',    href: '/admin/findings',    icon: FileText },
    { label: 'Team',        href: '/admin/team',        icon: Users    },
    { label: 'Text blocks', href: '/admin/text-blocks', icon: Type     },
  ]},
  { label: 'DATA',     items: [{ label: 'Source sync',  href: '/admin/source-sync',  icon: RefreshCw }] },
  { label: 'ACCESS',   items: [{ label: 'Share links',  href: '/admin/share-links',  icon: Link2     }] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <aside
      className="w-[220px] min-h-screen bg-white flex flex-col flex-shrink-0"
      style={{ borderRight: '1px solid rgba(0,15,30,0.06)', boxShadow: '1px 0 0 rgba(0,15,30,0.04)' }}
    >
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
                    <Icon size={14} strokeWidth={isActive ? 2 : 1.75}
                      className={isActive ? 'text-white' : 'text-[#9CA3AF] group-hover:text-[#4B5563]'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — user info + sign out */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(0,15,30,0.06)' }}>
        {/* View live */}
        <Link
          href="/view/james-adams"
          className="flex items-center gap-2 text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors px-3 py-2 rounded-[8px] hover:bg-[#F5F5F5] mb-2"
        >
          <ExternalLink size={12} strokeWidth={1.75} />
          View as stakeholder
        </Link>

        {/* Signed-in user */}
        {user && (
          <div className="px-3 py-2.5 rounded-[10px] mb-1" style={{ background: '#F9FAFB', border: '1px solid rgba(0,15,30,0.06)' }}>
            <div className="flex items-center gap-2.5">
              {user.image ? (
                <img src={user.image} alt={user.name ?? ''} className="w-7 h-7 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#000F1E] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#111827] truncate leading-none mb-0.5">
                  {user.name ?? 'Monstarlab user'}
                </p>
                <p className="text-[10.5px] text-[#9CA3AF] truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="w-full flex items-center gap-2 text-[12.5px] font-medium text-[#9CA3AF] hover:text-[#BE123C] transition-colors px-3 py-2 rounded-[8px] hover:bg-[#FFF1F2]"
        >
          <LogOut size={12} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
