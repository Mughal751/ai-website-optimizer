import { Sidebar } from '@/components/Sidebar';
import { MobileTopNav } from '@/components/MobileTopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileTopNav />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-content px-5 py-8 sm:px-8 sm:py-12">{children}</main>
      </div>
    </div>
  );
}
