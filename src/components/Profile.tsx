import { useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getErrorMessage } from '../lib/errors';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp,image/gif';

function initialsFor(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/**
 * Dedicated profile page: avatar upload plus a summary of the account info
 * collected during onboarding. Name/email/password edits stay in the
 * existing onboarding wizard (opened via "Edit details") rather than being
 * duplicated here.
 */
export function Profile() {
  const { profile, uploadAvatar, removeAvatar, openOnboarding } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload image. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await removeAvatar();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove image. Please try again.'));
    } finally {
      setRemoving(false);
    }
  };

  const busy = uploading || removing;

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-[var(--c-text-strong)] tracking-tight">
          Your Profile
        </h1>
        <p className="text-sm text-[var(--c-text-muted)]">
          Update your photo and review your account details.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-[var(--c-surface)] border-2 border-[var(--c-border)] flex items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-[var(--c-text-muted)]">
                {initialsFor(profile?.display_name ?? null)}
              </span>
            )}
          </div>
          {busy && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {uploading ? 'Uploading…' : 'Removing…'}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            aria-label="Change photo"
            title="Change photo"
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center border-2 border-[var(--c-bg)] hover:bg-teal-500 transition disabled:opacity-50"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="text-xs font-medium text-[var(--c-accent)] hover:underline disabled:opacity-50"
          >
            Upload photo
          </button>
          {profile?.avatar_url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="text-xs font-medium text-[var(--c-text-muted)] hover:text-red-400 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>

      <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--c-text-muted)]">Name</p>
          <p className="text-sm text-[var(--c-text)]">{profile?.display_name || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--c-text-muted)]">Contact email</p>
          <p className="text-sm text-[var(--c-text)]">{profile?.contact_email || '—'}</p>
        </div>
        <button
          onClick={openOnboarding}
          className="text-xs font-medium text-[var(--c-accent)] hover:underline"
        >
          Edit name, key, or email →
        </button>
      </div>
    </div>
  );
}
