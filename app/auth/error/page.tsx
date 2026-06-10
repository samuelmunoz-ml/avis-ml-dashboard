'use client';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ShieldX, ArrowRight, LogOut } from 'lucide-react';

const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  AccessDenied: {
    title: 'Access denied',
    body: 'Your Google account is not authorised to access the admin panel. Only @monstar-lab.com accounts are allowed.',
  },
  OAuthSignin:    { title: 'Sign-in failed',    body: 'Something went wrong starting the Google sign-in. Please try again.' },
  OAuthCallback:  { title: 'Sign-in failed',    body: 'Something went wrong during the Google callback. Please try again.' },
  OAuthCreateAccount: { title: 'Account error', body: 'Could not create a session for your account. Please try again.' },
  Default:        { title: 'Authentication error', body: 'An unexpected error occurred. Please try signing in again.' },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const errorCode  = searchParams.get('error') ?? 'Default';
  const { title, body } = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default;
  const isAccessDenied = errorCode === 'AccessDenied';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 50%, #FFF1F2 100%)' }}
    >
      <div className="relative w-full max-w-[400px] fade-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="text-[#DA291C] font-bold text-2xl tracking-[-0.03em]">AVIS</span>
            <span className="text-[#D1D5DB] text-xl font-light">×</span>
            <span className="text-[#000F1E] font-bold text-base tracking-[-0.01em]">Monstarlab</span>
          </div>
        </div>

        {/* Error card */}
        <div
          className="bg-white rounded-[18px] p-8"
          style={{ boxShadow: '0 8px 32px rgba(0,15,30,0.08), 0 2px 8px rgba(0,15,30,0.04)', border: '1px solid rgba(0,15,30,0.06)' }}
        >
          {/* Icon */}
          <div className="w-12 h-12 bg-[#FFF1F2] rounded-[14px] flex items-center justify-center mb-5">
            <ShieldX size={22} strokeWidth={1.75} className="text-[#BE123C]" />
          </div>

          <h2 className="text-[18px] font-bold text-[#111827] tracking-[-0.02em] mb-2">{title}</h2>
          <p className="text-[14px] text-[#6B7280] leading-relaxed mb-6">{body}</p>

          {/* Show which account tried */}
          {isAccessDenied && session?.user?.email && (
            <div className="mb-6 px-4 py-3 rounded-[10px]" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
              <p className="text-[12px] text-[#92400E]">
                Signed in as <strong className="font-mono">{session.user.email}</strong>
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {/* Try different account */}
            <button
              onClick={() => signIn('google', { callbackUrl: '/admin' })}
              className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#0D1E35]"
              style={{ background: '#000F1E' }}
            >
              Try a different account
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <ArrowRight size={12} strokeWidth={2.5} />
              </div>
            </button>

            {/* Sign out if already signed in */}
            {session && (
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 text-[14px] font-semibold text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all"
                style={{ border: '1px solid rgba(0,15,30,0.08)' }}
              >
                <LogOut size={14} strokeWidth={1.75} />
                Sign out
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[12px] text-[#9CA3AF] mt-5">
          Need access? Contact your Monstarlab project lead.
        </p>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
