import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

export function SignInScreen() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    const result = await signInWithEmail(email.trim());
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage('Check your email for a sign-in link.');
    }
    setSending(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setMessage('Google sign-in failed. Is it enabled in Supabase?');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] p-6 sm:p-8 shadow-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">🎸</span>
          <h1 className="text-2xl font-bold text-[var(--c-text-strong)] mt-3">Uke Sensei</h1>
          <p className="text-sm text-[var(--c-text-muted)] mt-2">
            Sign in to save your progress and recordings across devices.
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-800 font-medium text-sm hover:bg-gray-100 transition disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--c-border)]" />
          <span className="text-xs text-[var(--c-text-muted)]">or</span>
          <div className="flex-1 h-px bg-[var(--c-border)]" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--c-bg)] border border-[var(--c-border)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-text-muted)]"
          />
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-500 transition disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>

        {message && (
          <p className="text-xs text-center text-[var(--c-text-muted)] mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}
