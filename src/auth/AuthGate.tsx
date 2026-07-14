import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthProvider';
import { SignInScreen } from '../components/SignInScreen';
import { Onboarding } from '../components/Onboarding';

function AuthGateInner({ children }: { children: ReactNode }) {
  const { configured, loading, user, profile } = useAuth();

  if (!configured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <p className="text-[var(--c-text-muted)]">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  if (!profile?.onboarding_complete) {
    return <Onboarding />;
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGateInner>{children}</AuthGateInner>
    </AuthProvider>
  );
}
