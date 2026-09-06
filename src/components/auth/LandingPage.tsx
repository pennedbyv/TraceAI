import React, { useState } from 'react';
import { signInWithGoogle } from '../../lib/firebase/client';
import type { UserProfile } from '../../types';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthenticated }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await signInWithGoogle();
      onAuthenticated(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fbf9f6] text-[#1b1c1a] flex flex-col items-center justify-center py-12 md:py-16 px-4 sm:px-6 overflow-hidden select-none">
      {/* Ambient background soft glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 flex items-center justify-center">
        <div
          className="absolute -top-24 w-[38rem] h-[38rem] rounded-full bg-[#f9b2d7]/15 blur-3xl mix-blend-multiply animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div className="absolute top-1/3 -right-20 w-[32rem] h-[32rem] rounded-full bg-[#cbe8ef]/20 blur-3xl mix-blend-multiply" />
        <div className="absolute -bottom-20 -left-20 w-[34rem] h-[34rem] rounded-full bg-[#ccead0]/25 blur-3xl mix-blend-multiply" />
      </div>

      <div className="w-full max-w-[760px] flex flex-col items-center">
        {/* Brand Emblem & Private Enclave Pill */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative group cursor-default">
            <div className="absolute -inset-2 rounded-full bg-[#cbe8ef]/40 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center h-12 w-auto px-4 gap-2.5">
              <img src="/assets/trace-logo.png" alt="Trace logo" className="w-10 h-10 rounded-xl object-contain shadow-xs" />
              <span className="font-serif text-3xl font-medium tracking-tight text-[#1b1c1a]">Trace</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3f0] shadow-xs border border-[#d4c2c9]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
            <span className="text-[10px] font-semibold text-[#504349] tracking-widest uppercase">
              Mindful Studio • Private Enclave
            </span>
          </div>
        </div>

        {/* Editorial Hero Title & Philosophy Statement */}
        <div className="text-center mb-10 max-w-[680px]">
          <h1 className="font-serif text-3xl sm:text-5xl text-[#1b1c1a] font-normal tracking-tight mb-5 leading-tight">
            Your thinking space for decisions, breakthroughs &amp; work that actually matters.
          </h1>
          <p className="font-serif text-base sm:text-lg text-[#504349] max-w-[600px] mx-auto leading-relaxed italic">
            Trace is a digital notebook crafted for contemplative minds.
          </p>
        </div>

        {/* Central Authentication Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 relative mb-12 border border-[#eae8e5]">
          {/* Top Decorative Archival Paper Binding Notch */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 rounded-full bg-white shadow-xs border border-[#f9b2d7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
            <span className="text-[10px] text-[#1b1c1a] font-semibold tracking-wider uppercase">
              Stationery Pass
            </span>
          </div>

          <div className="text-center mb-7 mt-1">
            <h2 className="font-serif text-xl font-medium text-[#1b1c1a]">Open your journal</h2>
            <p className="text-xs text-[#504349] mt-1">Resume unhurried reflections in private solitude</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In Actions */}
          <div className="flex flex-col gap-3.5">
            <button
              id="googleSignInBtn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-xl bg-[#f5f3f0] hover:bg-[#efeeeb] text-[#1b1c1a] transition-all duration-200 shadow-xs hover:shadow active:scale-[0.99] border border-[#d4c2c9]/40 disabled:opacity-75 cursor-pointer"
              type="button"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 text-xs font-semibold">
                  <span className="w-4 h-4 border-2 border-[#854c6c] border-t-transparent rounded-full animate-spin" />
                  Opening your private vault...
                </span>
              ) : (
                <>
                  <svg aria-hidden="true" className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" fill="#4285F4" />
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.13C3.26 21.36 7.34 24 12 24z" fill="#34A853" />
                    <path d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.17 0 9.97 0 12s.45 3.83 1.24 5.41l4.04-3.13z" fill="#FBBC05" />
                    <path d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.34 0 3.26 2.64 1.24 6.59l4.04 3.13c.95-2.84 3.6-4.95 6.72-4.95z" fill="#EA4335" />
                  </svg>
                  <span className="text-xs font-semibold text-[#1b1c1a]">Continue with Google</span>
                </>
              )}
            </button>

          </div>

          {/* Quiet Security Note */}
          <div className="mt-6 pt-5 flex items-center justify-center gap-2 text-center border-t border-[#eae8e5]/60">
            <ShieldCheck className="w-4 h-4 text-[#4a6550]" />
            <p className="text-xs text-[#504349]">
              End-to-end encrypted
            </p>
          </div>
        </div>

        {/* Editorial Quiet Footer */}
        <footer className="w-full pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left border-t border-[#d4c2c9]/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4a6550]" />
            {/* <p className="text-xs text-[#504349]">Archival integrity assured • Trace Private Journal</p> */}
          </div>
          {/* <nav className="flex items-center gap-6">
            <button onClick={() => alert('Trace Privacy Manifesto: Your thoughts never train AI models.')} className="text-xs text-[#504349] hover:text-[#1b1c1a] transition-colors cursor-pointer" type="button">
              Privacy Manifesto
            </button>
            <button onClick={() => alert('Security: Client path isolation enforced on Cloud Firestore.')} className="text-xs text-[#504349] hover:text-[#1b1c1a] transition-colors cursor-pointer" type="button">
              Security Architecture
            </button>
            <button onClick={() => alert('Data Isolation: Encrypted with personal tenant UID boundaries.')} className="text-xs text-[#504349] hover:text-[#1b1c1a] transition-colors cursor-pointer" type="button">
              Data Isolation
            </button>
          </nav> */}
        </footer>
      </div>
    </div>
  );
};
