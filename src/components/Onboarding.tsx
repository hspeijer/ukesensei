import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CHROMATIC_NOTES, displayNote, type NoteName } from '../theory/notes';

export function Onboarding() {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [preferredKey, setPreferredKey] = useState<NoteName>('C');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding(displayName, preferredKey);
    } catch {
      setError('Could not save your profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] p-6 sm:p-8">
        <div className="flex gap-2 mb-8">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-teal-500' : 'bg-[var(--c-border)]'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--c-text-strong)]">Who are you?</h1>
              <p className="text-sm text-[var(--c-text-muted)] mt-2">
                Pick a name we&apos;ll use to greet you in the app.
              </p>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={40}
              className="w-full px-4 py-3 rounded-xl bg-[var(--c-bg)] border border-[var(--c-border)] text-[var(--c-text)] text-lg placeholder:text-[var(--c-text-muted)]"
            />
            <button
              onClick={() => setStep(1)}
              disabled={!displayName.trim()}
              className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-500 transition disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--c-text-strong)]">
                What is the key?
              </h1>
              <p className="text-sm text-[var(--c-text-muted)] mt-2">
                Hi {displayName.trim()}! Choose your home key — we&apos;ll use it as your default for exercises and free play.
              </p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {CHROMATIC_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => setPreferredKey(note)}
                  className={`
                    py-3 rounded-xl text-sm font-semibold transition-all
                    ${preferredKey === note
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-[var(--c-bg)] text-[var(--c-text-muted)] border border-[var(--c-border)] hover:border-teal-500/50'
                    }
                  `}
                >
                  {displayNote(note)}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-3 rounded-xl text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-500 transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Start playing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
