'use client';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { ArrowRight, Shield } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/admin';
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn('google', { callbackUrl });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 50%, #EFF6FF 100%)' }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #000F1E 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #234474 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[400px] fade-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="text-[#DA291C] font-bold text-2xl tracking-[-0.03em]">AVIS</span>
            <span className="text-[#D1D5DB] text-xl font-light">×</span>
            <span className="text-[#000F1E] font-bold text-base tracking-[-0.01em]">Monstarlab</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-[-0.02em] leading-snug mb-2">
            Research Dashboard
          </h1>
          <p className="text-[14px] text-[#6B7280]">Admin access</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[18px] p-8"
          style={{ boxShadow: '0 8px 32px rgba(0,15,30,0.08), 0 2px 8px rgba(0,15,30,0.04)', border: '1px solid rgba(0,15,30,0.06)' }}
        >
          {/* Access note */}
          <div className="flex items-start gap-3 mb-6 p-3.5 rounded-[10px]" style={{ background: '#F0F7FF', border: '1px solid #DBEAFE' }}>
            <Shield size={15} strokeWidth={1.75} className="text-[#1D4ED8] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-[#1E3A8A]">Restricted access</p>
              <p className="text-[12px] text-[#3B82F6] mt-0.5">
                Only <strong>@monstar-lab.com</strong> accounts are authorised.
              </p>
            </div>
          </div>

          {/* Google sign-in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 rounded-[10px] flex items-center justify-center gap-3 text-[14px] font-semibold transition-all duration-200 disabled:opacity-60 group"
            style={{
              background: loading ? '#F9FAFB' : '#FFFFFF',
              border: '1.5px solid #E5E7EB',
              color: '#111827',
              boxShadow: '0 1px 3px rgba(0,15,30,0.06)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,15,30,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,15,30,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; }}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <GoogleIcon />
            )}
            <span>{loading ? 'Redirecting to Google…' : 'Continue with Google'}</span>
            {!loading && (
              <div className="ml-auto w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#E5E7EB] transition-colors">
                <ArrowRight size={12} strokeWidth={2.5} className="text-[#6B7280]" />
              </div>
            )}
          </button>
        </div>

        <p className="text-center text-[12px] text-[#9CA3AF] mt-5">
          Secure sign-in via Google · Monstarlab ML team
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
