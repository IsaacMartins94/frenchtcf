'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserError, UserProgress, UserStats } from '@/types';

interface GameState {
  stats: UserStats;
  progress: Record<string, UserProgress>;
  errors: UserError[];
  strengths: Record<string, number>; // question → 0-5

  updateStats: (s: Partial<UserStats>) => void;
  saveProgress: (p: UserProgress) => void;
  addError: (e: Omit<UserError, 'id'>) => void;
  masterError: (id: string) => void;
  deleteError: (id: string) => void;
  updateStrength: (question: string, correct: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      stats: { total_xp: 0, streak: 0, last_day: '' },
      progress: {},
      errors: [],
      strengths: {},

      updateStats: (s) => set((state) => ({ stats: { ...state.stats, ...s } })),

      saveProgress: (p) => set((state) => ({ progress: { ...state.progress, [p.module_id]: p } })),

      addError: (e) => set((state) => {
        const exists = state.errors.find((x) => x.question === e.question);
        if (exists) {
          return {
            errors: state.errors.map((x) =>
              x.question === e.question ? { ...x, count: x.count + 1, mastered: false } : x
            ),
          };
        }
        return { errors: [{ ...e, id: crypto.randomUUID() }, ...state.errors].slice(0, 100) };
      }),

      masterError: (id) => set((state) => ({
        errors: state.errors.map((e) => e.id === id ? { ...e, mastered: true } : e),
      })),

      deleteError: (id) => set((state) => ({
        errors: state.errors.filter((e) => e.id !== id),
      })),

      updateStrength: (question, correct) => set((state) => {
        const cur = state.strengths[question] ?? 2;
        const next = correct ? Math.min(5, cur + 1) : Math.max(0, cur - 1);
        return { strengths: { ...state.strengths, [question]: next } };
      }),
    }),
    { name: 'french-tcf-v1' }
  )
);
