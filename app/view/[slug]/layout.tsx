'use client';
import { use, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/store';
import ViewerSidebar from '@/components/ViewerSidebar';

export default function ViewerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const isGatePage = pathname === `/view/${slug}`;
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (isGatePage) {
      setChecked(true);
      return;
    }
    const ok = isAuthenticated(slug);
    if (!ok) {
      router.replace(`/view/${slug}`);
    } else {
      setAuthed(true);
    }
    setChecked(true);
  }, [slug, isGatePage, router]);

  if (!checked) return null;

  if (isGatePage) return <>{children}</>;

  if (!authed) return null;

  return (
    <div className="flex min-h-screen bg-[#F7F7F6]">
      <ViewerSidebar slug={slug} />
      <main className="flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
