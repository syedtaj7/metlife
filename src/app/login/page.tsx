'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SplitText from '@/components/SplitText';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setAuthError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setAuthError('');
    
    try {
      await signInWithEmail(email, password);
      console.log('Login successful');
      // Redirect to data extraction page
      router.push('/data-extraction');
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in. Please check your credentials.';
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError('');
    
    try {
      await signInWithGoogle();
      console.log('Google sign-in successful');
      // Redirect to data extraction page
      router.push('/data-extraction');
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Mountain Background */}
      <div className="flex-1 relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: `url('data:image/svg+xml;base64,${btoa(`
              <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#4c1d95;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#sky)"/>
                <polygon points="0,300 200,200 400,250 600,180 800,220 800,600 0,600" fill="#1f1b2e" opacity="0.9"/>
                <polygon points="100,350 300,280 500,320 700,260 800,280 800,600 0,600" fill="#2d1b45" opacity="0.8"/>
                <polygon points="0,400 150,350 350,380 550,340 750,360 800,350 800,600 0,600" fill="#3d2555" opacity="0.7"/>
              </svg>
            `)}`
          }}
        ></div>
        
        {/* Content */}
        <div className="absolute left-16 top-1/2 -translate-y-1/2 z-10 text-white">
          <SplitText 
            text="Improving Life"
            tag="h1"
            className="text-4xl md:text-5xl font-bold mb-2 leading-tight"
            textAlign="left"
            splitType="words, chars"
            delay={50}
            duration={0.8}
            from={{ opacity: 0, y: 50, rotationX: -90 }}
            to={{ opacity: 1, y: 0, rotationX: 0 }}
            ease="back.out(1.7)"
          />
          <SplitText 
            text="One Step At a Time"
            tag="h1"
            className="text-4xl md:text-5xl font-bold leading-tight"
            textAlign="left"
            splitType="words, chars"
            delay={100}
            duration={0.8}
            from={{ opacity: 0, y: 50, rotationX: -90 }}
            to={{ opacity: 1, y: 0, rotationX: 0 }}
            ease="back.out(1.7)"
          />
        </div>
      </div>

      
      <div className="flex-1 bg-slate-900 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <SplitText 
              text="Welcome back"
              tag="h2"
              className="text-3xl font-bold text-white mb-2"
              textAlign="center"
              splitType="chars"
              delay={30}
              duration={0.6}
              from={{ opacity: 0, scale: 0.5, y: 20 }}
              to={{ opacity: 1, scale: 1, y: 0 }}
              ease="power2.out"
            />
            <p className="text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/pages/login" className="text-white underline hover:no-underline">
                Create account
              </Link>
            </p>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 checked:bg-purple-600 checked:border-purple-600"
                />
                <label htmlFor="remember" className="text-sm text-slate-300">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-white hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-700 rounded-lg hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white w-full max-w-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}