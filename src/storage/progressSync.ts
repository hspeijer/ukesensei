import { getSupabase } from '../lib/supabase';
import { saveLessonComplete, clearLessonProgress } from './cloudProgressStore';
import { useAppStore } from '../store/useAppStore';

async function getUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function syncCompleteLesson(lessonId: string): Promise<void> {
  useAppStore.getState().completeLesson(lessonId);
  const userId = await getUserId();
  if (userId) {
    try {
      await saveLessonComplete(userId, lessonId);
    } catch (err) {
      console.warn('Failed to sync lesson progress:', err);
    }
  }
}

export async function syncResetLessonProgress(): Promise<void> {
  useAppStore.getState().resetLessonProgress();
  const userId = await getUserId();
  if (userId) {
    try {
      await clearLessonProgress(userId);
    } catch (err) {
      console.warn('Failed to clear lesson progress:', err);
    }
  }
}
