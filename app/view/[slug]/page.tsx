'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/store';
import { Lock, ArrowRight } from 'lucide-react';

export default function PasswordGatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 50%, #EFF6FF 100%)' }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #000F1E 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #234474 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[420px] fade-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-[#DA291C] font-bold text-2xl tracking-[-0.03em]">AVIS</span>
            <span className="text-[#D1D5DB] text-xl">×</span>
            <span className="text-[#000F1E] font-semibold text-base">Monstarlab</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-snug mb-2">
            Research Dashboard
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-[320px] mx-auto">
            Prepared by the Monstarlab ML team for Avis Budget Group stakeholders.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[18px] p-8"
          style={{ boxShadow: '0 8px 32px rgba(0, 15, 30, 0.08), 0 2px 8px rgba(0, 15, 30, 0.04)', border: '1px solid rgba(0,15,30,0.06)' }}
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-[#F3F4F6] rounded-[8px] flex items-center justify-center">
              <Lock size={14} strokeWidth={1.75} className="text-[#6B7280]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Access required</p>
              <p className="text-[11px] text-[#9CA3AF]">Enter your access code to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-[0.01em]">
                Access code
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your access code"
                autoFocus
                className="w-full h-11 px-4 rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all duration-200"
                style={{
                  background: '#F9FAFB',
                  border: error ? '1.5px solid #F43F5E' : '1.5px solid #E5E7EB',
                  boxShadow: error ? '0 0 0 3px rgba(244,63,94,0.08)' : 'none',
                }}
                onFocus={(e) => {
                  if (!error) e.target.style.border = '1.5px solid #000F1E';
                  e.target.style.background = '#FFFFFF';
                  e.target.style.boxShadow = error ? '0 0 0 3px rgba(244,63,94,0.08)' : '0 0 0 3px rgba(0,15,30,0.06)';
                }}
                onBlur={(e) => {
                  e.target.style.border = error ? '1.5px solid #F43F5E' : '1.5px solid #E5E7EB';
                  e.target.style.background = '#F9FAFB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {error && (
                <p className="mt-1.5 text-[12px] text-[#BE123C] flex items-center gap-1">
                  <span>Incorrect code.</span>
                  <span className="text-[#9CA3AF]">Contact your Monstarlab project lead.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 rounded-[10px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
              style={{ background: '#000F1E', boxShadow: '0 1px 3px rgba(0,15,30,0.2)' }}
              onMouseEnter={(e) => { if (!loading && password) (e.target as HTMLElement).style.background = '#0D1E35'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#000F1E'; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  Enter dashboard
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight size={13} strokeWidth={2} />
                  </div>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#9CA3AF] mt-5">
          Protected by Monstarlab · Avis Budget Group
        </p>
      </div>
    </div>
  );
}
