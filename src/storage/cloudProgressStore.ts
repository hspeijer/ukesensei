import { getSupabase } from '../lib/supabase';

export async function fetchLessonProgress(userId: string): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((r) => r.lesson_id);
}

export async function saveLessonComplete(userId: string, lessonId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({ user_id: userId, lesson_id: lessonId });

  if (error) throw error;
}

export async function clearLessonProgress(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('lesson_progress')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
