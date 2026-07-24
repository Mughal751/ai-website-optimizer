import { ScanForm } from '@/components/ScanForm';
import { ScanHistory } from '@/components/ScanHistory';

export default function ScanPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-h2 font-extrabold text-gradient">Analyze a website</h1>
        <p className="mt-2 text-body text-white/60">
          Paste a URL to run a full SEO, performance, accessibility, mobile, security, and
          broken-link audit.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <ScanForm />
      </div>

      <div>
        <h2 className="mb-4 text-h4 font-semibold text-white">History</h2>
        <ScanHistory />
      </div>
    </div>
  );
}
