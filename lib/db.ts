import { supabase } from './supabase';
import { UserError, UserProgress, UserStats } from '@/types';

// ── STATS ──────────────────────────────────────────────
export async function getStats(userId: string): Promise<UserStats> {
  const { data } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data || { total_xp: 0, streak: 0, last_day: '' };
}

export async function updateStats(userId: string, stats: Partial<UserStats>) {
  await supabase
    .from('user_stats')
    .upsert({ user_id: userId, ...stats, updated_at: new Date().toISOString() });
}

// ── PROGRESS ──────────────────────────────────────────
export async function getAllProgress(userId: string): Promise<Record<string, UserProgress>> {
  const { data } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  const map: Record<string, UserProgress> = {};
  (data || []).forEach((row) => {
    map[row.module_id] = {
      module_id: row.module_id,
      completed: row.completed,
      last_idx: row.last_idx,
      exercise_order: row.exercise_order || [],
      xp: row.xp,
    };
  });
  return map;
}

export async function saveProgress(userId: string, progress: UserProgress) {
  await supabase.from('user_progress').upsert({
    user_id: userId,
    module_id: progress.module_id,
    completed: progress.completed,
    last_idx: progress.last_idx,
    exercise_order: progress.exercise_order,
    xp: progress.xp,
    updated_at: new Date().toISOString(),
  });
}

// ── ERRORS ────────────────────────────────────────────
export async function getErrors(userId: string): Promise<UserError[]> {
  const { data } = await supabase
    .from('user_errors')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return (data || []).map((row) => ({
    id: row.id,
    module_id: row.module_id,
    question: row.question,
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    mastered: row.mastered,
    count: row.count,
    updated_at: row.updated_at,
  }));
}

export async function saveError(userId: string, error: Omit<UserError, 'id'>) {
  // Check if error already exists
  const { data: existing } = await supabase
    .from('user_errors')
    .select('id, count')
    .eq('user_id', userId)
    .eq('question', error.question)
    .single();

  if (existing) {
    await supabase
      .from('user_errors')
      .update({ count: existing.count + 1, mastered: false, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('user_errors').insert({
      user_id: userId,
      ...error,
    });
  }
}

export async function markErrorMastered(errorId: string) {
  await supabase
    .from('user_errors')
    .update({ mastered: true, updated_at: new Date().toISOString() })
    .eq('id', errorId);
}

export async function deleteError(errorId: string) {
  await supabase.from('user_errors').delete().eq('id', errorId);
}
