import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { pathToState, stateToPath } from './url';

/**
 * Keeps the browser URL in sync with the app's navigation state so the back
 * and forward buttons work. The store is initialized from the URL at creation
 * time (see useAppStore), so on mount the state already matches the URL and no
 * extra history entry is pushed.
 *
 * - State changes (clicking a nav tab, opening a lesson/session) push a new
 *   history entry via stateToPath.
 * - popstate (back/forward) parses the new URL and applies it to the store.
 *   Because popstate updates the URL first, the push effect sees a matching
 *   path and does not push again, avoiding loops.
 */
export function useUrlSync() {
  const view = useAppStore((s) => s.view);
  const lessonId = useAppStore((s) => s.selectedLessonId);
  const sessionId = useAppStore((s) => s.selectedSessionId);
  const setView = useAppStore((s) => s.setView);
  const setSelectedLessonId = useAppStore((s) => s.setSelectedLessonId);
  const setSelectedSessionId = useAppStore((s) => s.setSelectedSessionId);

  useEffect(() => {
    const onPopState = () => {
      const route = pathToState(window.location.pathname);
      setSelectedLessonId(route.lessonId);
      setSelectedSessionId(route.sessionId);
      setView(route.view);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setView, setSelectedLessonId, setSelectedSessionId]);

  useEffect(() => {
    const path = stateToPath(view, lessonId, sessionId);
    if (path !== window.location.pathname) {
      window.history.pushState(null, '', path);
    }
  }, [view, lessonId, sessionId]);
}
