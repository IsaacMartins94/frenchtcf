export type ExerciseType = 'MCQ' | 'MCQ_Trans' | 'WordOrder' | 'FillIn';

export interface Exercise {
  type: ExerciseType;
  question: string;
  sub?: string;
  choices?: string[];
  answer: string;
  explanation: string;
  audio?: string;
  translation?: string;
  words?: string[];
}

export interface Module {
  id: string;
  icon: string;
  name: string;
  desc: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  exercises: Exercise[];
}

export interface UserProgress {
  module_id: string;
  completed: number;
  last_idx: number;
  exercise_order: number[];
  xp: number;
}

export interface UserError {
  id?: string;
  module_id: string;
  question: string;
  correct_answer: string;
  explanation: string;
  mastered: boolean;
  count: number;
  updated_at?: string;
}

export interface UserStats {
  total_xp: number;
  streak: number;
  last_day: string;
}

export interface DB {
  totalXP: number;
  streak: number;
  lastDay: string;
  progress: Record<string, UserProgress>;
  errors: UserError[];
}
