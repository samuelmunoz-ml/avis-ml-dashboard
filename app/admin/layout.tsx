import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F6]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
