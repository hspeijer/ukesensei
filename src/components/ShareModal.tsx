import { useCallback, useEffect, useState } from 'react';
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
  shareLinkUrl,
  type ShareLink,
} from '../storage/shareStore';

interface ShareModalProps {
  userId: string;
  sessionId: string;
  onClose: () => void;
}

export function ShareModal({ userId, sessionId, onClose }: ShareModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLinks(await listShareLinks(sessionId));
    } catch {
      setError('Could not load share links.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const link = await createShareLink(userId, sessionId);
      setLinks((prev) => [link, ...prev]);
    } catch {
      setError('Could not create a share link. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(shareLinkUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((id) => (id === link.id ? null : id)), 1500);
    } catch {
      /* clipboard may be unavailable — the link is still shown for manual copy */
    }
  };

  const handleRevoke = async (link: ShareLink) => {
    try {
      await revokeShareLink(link.id);
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, revokedAt: new Date().toISOString() } : l)));
    } catch {
      setError('Could not revoke that link.');
    }
  };

  const activeLinks = links.filter((l) => !l.revokedAt);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--c-text-strong)]">Share this recording</h3>
          <button onClick={onClose} className="text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition p-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-[var(--c-text-muted)]">
          Anyone with the link can listen — no account needed. Revoke a link any time to cut off access.
        </p>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create new share link'}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {loading ? (
          <p className="text-xs text-[var(--c-text-muted)] text-center py-4">Loading…</p>
        ) : activeLinks.length === 0 ? (
          <p className="text-xs text-[var(--c-text-muted)] text-center py-4">No active share links yet.</p>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {activeLinks.map((link) => (
              <div
                key={link.id}
                className="bg-[var(--c-bg)] rounded-lg border border-[var(--c-border)] p-2.5 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareLinkUrl(link.token)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 bg-transparent text-xs text-[var(--c-text-muted)] truncate outline-none"
                  />
                  <button
                    onClick={() => handleCopy(link)}
                    className="text-xs font-medium text-teal-400 hover:underline shrink-0"
                  >
                    {copiedId === link.id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--c-text-muted)]">
                  <span>{link.viewCount} view{link.viewCount === 1 ? '' : 's'}</span>
                  <button
                    onClick={() => handleRevoke(link)}
                    className="text-red-400/80 hover:text-red-400 font-medium"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
