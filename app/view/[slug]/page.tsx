'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate, getShareLink } from '@/lib/store';

export default function PasswordGatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const link = getShareLink(slug);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = authenticate(slug, password);
    if (ok) {
      router.push(`/view/${slug}/overview`);
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center p-6">
      <div className="w-full max-w-[530px] space-y-4">
        {/* Header card */}
        <div className="bg-white border border-[#DAD9D6] rounded-lg p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-[#DA291C] font-bold text-xl tracking-tight">AVIS</span>
            <span className="text-[#DAD9D6] text-xl">·</span>
            <span className="text-[#000F1E] font-semibold text-sm">Monstarlab</span>
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-bold text-[#000F1E] leading-snug mb-3">
              Avis Budget Group/Monstarlab<br />Research Dashboard
            </h1>
            <p className="text-sm text-[#939598] leading-relaxed">
              This dashboard is prepared by the Monstarlab ML team for Avis Budget Group stakeholders. Enter your access code to continue.
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white border border-[#DAD9D6] rounded-lg p-8">
          <h2 className="text-lg font-semibold text-[#000F1E] mb-6">Enter your dashboard</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#000F1E] mb-1.5">Access code</label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your access code"
                  className={`flex-1 h-[42px] px-3.5 border rounded-[4px] text-sm text-[#000F1E] placeholder:text-[#B7B8B9] outline-none focus:border-[#000F1E] transition-colors ${
                    error ? 'border-[#C62828]' : 'border-[#DAD9D6]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="h-[42px] px-5 bg-[#000F1E] text-white text-sm font-medium rounded-[4px] hover:bg-[#0D1E35] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {loading ? 'Checking...' : 'Enter Dashboard →'}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-[#C62828]">
                  Incorrect access code. Please try again.
                </p>
              )}
            </div>
            <p className="text-sm text-[#939598]">
              Wrong code? Contact your Monstarlab project lead.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
