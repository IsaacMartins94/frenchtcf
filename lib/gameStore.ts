'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserError, UserProgress, UserStats } from '@/types';
import * as db from './db';

interface GameState {
  userId: string | null;
  stats: UserStats;
  progress: Record<string, UserProgress>;
  errors: UserError[];
  loaded: boolean;

  setUserId: (id: string | null) => void;
  loadAll: (userId: string) => Promise<void>;

  updateStats: (s: Partial<UserStats>) => Promise<void>;
  saveProgress: (p: UserProgress) => Promise<void>;
  addError: (e: Omit<UserError, 'id'>) => Promise<void>;
  masterError: (id: string) => Promise<void>;
  deleteError: (id: string) => Promise<void>;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      userId: null,
      stats: { total_xp: 0, streak: 0, last_day: '' },
      progress: {},
      errors: [],
      loaded: false,

      setUserId: (id) => set({ userId: id }),

      loadAll: async (userId) => {
        const [stats, progress, errors] = await Promise.all([
          db.getStats(userId),
          db.getAllProgress(userId),
          db.getErrors(userId),
        ]);
        set({ stats, progress, errors, loaded: true, userId });
      },

      updateStats: async (s) => {
        const { userId, stats } = get();
        const next = { ...stats, ...s };
        set({ stats: next });
        if (userId) await db.updateStats(userId, next);
      },

      saveProgress: async (p) => {
        const { userId } = get();
        set((state) => ({ progress: { ...state.progress, [p.module_id]: p } }));
        if (userId) await db.saveProgress(userId, p);
      },

      addError: async (e) => {
        const { userId } = get();
        set((state) => {
          const exists = state.errors.find((x) => x.question === e.question);
          if (exists) {
            return {
              errors: state.errors.map((x) =>
                x.question === e.question ? { ...x, count: x.count + 1, mastered: false } : x
              ),
            };
          }
          return { errors: [{ ...e, id: crypto.randomUUID() }, ...state.errors].slice(0, 100) };
        });
        if (userId) await db.saveError(userId, e);
      },

      masterError: async (id) => {
        set((state) => ({
          errors: state.errors.map((e) => (e.id === id ? { ...e, mastered: true } : e)),
        }));
        await db.markErrorMastered(id);
      },

      deleteError: async (id) => {
        set((state) => ({ errors: state.errors.filter((e) => e.id !== id) }));
        await db.deleteError(id);
      },
    }),
    { name: 'french-tcf-game' }
  )
);
