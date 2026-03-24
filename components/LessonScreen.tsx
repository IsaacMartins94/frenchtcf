'use client';
import { useState, useEffect, useCallback } from 'react';
import { Exercise, Module } from '@/types';
import { useGameStore } from '@/lib/gameStore';

// ── Audio helpers ──────────────────────────────────────
function playSound(type: 'correct' | 'wrong' | 'complete') {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const notes = type === 'correct' ? [523, 659, 784] : type === 'wrong' ? [300, 220] : [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = 'sine';
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.25);
    });
  } catch {}
}

function speak(text: string) {
  if (typeof window === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR'; u.rate = 0.85; u.pitch = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function getMCQAudio(question: string, answer: string): string | null {
  const match = question.match(/"([^"]+)"/);
  if (!match) return null;
  return match[1].replace(/___/g, answer);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  module: Module;
  onBack: () => void;
  onComplete: (xp: number, correct: number, total: number) => void;
}

export default function LessonScreen({ module, onBack, onComplete }: Props) {
  const { progress, saveProgress, addError, updateStats, stats } = useGameStore();

  const prog = progress[module.id];
  const [[exercises, exerciseIndices]] = useState<[Exercise[], number[]]>(() => {
    if (prog?.exercise_order?.length) {
      const exs = prog.exercise_order.map((i) => module.exercises[i]);
      return [exs, prog.exercise_order];
    }
    const indices = shuffle([...Array(module.exercises.length).keys()]);
    const exs = indices.map((i) => module.exercises[i]);
    return [exs, indices];
  });

  const [current, setCurrent] = useState(prog?.last_idx || 0);
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);

  // Wrong exercises collected during main session for in-session retry
  const [wrongExercises, setWrongExercises] = useState<Exercise[]>([]);
  const [mode, setMode] = useState<'main' | 'retry'>('main');
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);

  // Per-exercise state
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [wordOrder, setWordOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const activeExercises = mode === 'retry' ? wrongExercises : exercises;
  const ex = activeExercises[current];
  const progressPct = Math.round(((current + 1) / activeExercises.length) * 100);

  // Init exercise + auto-play audio
  useEffect(() => {
    if (ex?.type === 'WordOrder') {
      setAvailableWords(shuffle(ex.words || []));
      setWordOrder([]);
    }
    setSelected(null);
    setTypedAnswer('');
    setAnswered(false);
    setIsCorrect(false);
    if (ex?.type === 'MCQ_Trans' && ex.audio) {
      const timer = setTimeout(() => speak(ex.audio!), 400);
      return () => clearTimeout(timer);
    }
  }, [current, mode]);

  const canVerify = () => {
    if (!ex) return false;
    if (ex.type === 'MCQ' || ex.type === 'MCQ_Trans') return selected !== null;
    if (ex.type === 'WordOrder') return wordOrder.length > 0;
    if (ex.type === 'FillIn') return typedAnswer.trim().length > 0;
    return false;
  };

  const finishSession = useCallback((finalXp: number, finalCorrect: number) => {
    const totalPct = Math.round((finalCorrect / exercises.length) * 100);
    const today = new Date().toDateString();
    if (totalPct >= 70) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = stats.last_day === yesterday || stats.last_day === today
        ? stats.streak + (stats.last_day !== today ? 1 : 0)
        : 1;
      updateStats({ total_xp: stats.total_xp + finalXp, streak: newStreak, last_day: today });
    } else {
      updateStats({ total_xp: stats.total_xp + finalXp });
    }
    onComplete(finalXp, finalCorrect, exercises.length);
  }, [exercises.length, stats, updateStats, onComplete]);

  const startRetry = () => {
    setMode('retry');
    setCurrent(0);
    setShowRetryPrompt(false);
  };

  const verify = useCallback(() => {
    if (answered) {
      // Advance to next or finish
      if (current >= activeExercises.length - 1) {
        if (mode === 'retry') {
          finishSession(xp, correct);
          return;
        }
        // Main session done — offer retry if there were errors
        if (wrongExercises.length > 0) {
          setShowRetryPrompt(true);
        } else {
          finishSession(xp, correct);
        }
        return;
      }
      setCurrent((c) => c + 1);
      return;
    }

    let userAnswer = '';
    if (ex.type === 'MCQ' || ex.type === 'MCQ_Trans') userAnswer = selected || '';
    if (ex.type === 'WordOrder') userAnswer = wordOrder.join(' ');
    if (ex.type === 'FillIn') userAnswer = typedAnswer.trim();

    const norm = (s: string) => s.replace(/ [?!]$/, '').replace(/[.?!]$/, '').trim();
    const ok = userAnswer === ex.answer || norm(userAnswer) === norm(ex.answer);

    setAnswered(true);
    setIsCorrect(ok);

    if (ok) {
      playSound('correct');
      setXp((v) => v + 10);
      setCorrect((v) => v + 1);
    } else {
      playSound('wrong');
      setShakeKey((k) => k + 1);
      addError({
        module_id: module.id,
        question: ex.question,
        correct_answer: ex.answer,
        explanation: ex.explanation,
        mastered: false,
        count: 1,
      });
      // Collect for in-session retry (main mode only, no duplicates)
      if (mode === 'main') {
        setWrongExercises((prev) =>
          prev.some((e) => e.question === ex.question) ? prev : [...prev, ex]
        );
      }
    }

    // Save progress (main mode only)
    if (mode === 'main') {
      saveProgress({
        module_id: module.id,
        completed: Math.max(prog?.completed || 0, current + (ok ? 1 : 0)),
        last_idx: current,
        exercise_order: exerciseIndices,
        xp: xp + (ok ? 10 : 0),
      });
    }
  }, [answered, ex, selected, wordOrder, typedAnswer, current, activeExercises, correct, xp, wrongExercises, mode, finishSession]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Enter' && canVerify()) verify(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [verify]);

  // ── Retry prompt screen ─────────────────────────────
  if (showRetryPrompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center max-w-sm w-full">
          <div className="text-6xl mb-4">🔁</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {wrongExercises.length} {wrongExercises.length === 1 ? 'erro' : 'erros'} nesta sessão
          </h2>
          <p className="text-gray-400 mb-8">Quer praticar agora os exercícios que você errou?</p>
          <button onClick={startRetry}
            className="w-full py-4 rounded-xl font-black text-white mb-3"
            style={{ background: '#58cc02', boxShadow: '0 4px 0 #46a302' }}>
            Refazer os erros ({wrongExercises.length})
          </button>
          <button onClick={() => finishSession(xp, correct)}
            className="w-full py-4 rounded-xl font-black border-2 border-gray-200 text-gray-600 bg-white">
            Encerrar sessão
          </button>
        </div>
      </div>
    );
  }

  // ── Main exercise screen ────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-300 hover:text-gray-600 text-xl p-1">✕</button>
        <div className="flex-1 bg-gray-100 h-4 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: mode === 'retry' ? '#ff9600' : '#58cc02' }} />
        </div>
        <span className="text-gray-500 font-bold text-sm min-w-fit tabular-nums">
          {mode === 'retry' && <span className="mr-1 text-orange-400">🔁</span>}
          {current + 1}/{activeExercises.length}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-6 max-w-xl mx-auto w-full flex flex-col">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {ex.type === 'MCQ' ? 'Múltipla escolha' :
           ex.type === 'MCQ_Trans' ? 'Ouça e traduza' :
           ex.type === 'WordOrder' ? 'Monte a frase' : 'Complete'}
        </p>

        {/* Audio + frase (MCQ_Trans e WordOrder) */}
        {ex.audio && (ex.type === 'MCQ_Trans' || ex.type === 'WordOrder') && (
          <button onClick={() => speak(ex.audio!)}
            className="flex items-center gap-3 mb-4 text-left w-full p-3 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 bg-blue-500 text-white">
              🔊
            </div>
            <p className="font-bold text-gray-900 text-lg leading-snug">{ex.audio}</p>
          </button>
        )}

        {/* Botão de áudio para MCQ — esconde o texto antes de responder */}
        {ex.type === 'MCQ' && (() => {
          const audioText = ex.audio || getMCQAudio(ex.question, ex.answer);
          if (!audioText) return null;
          return (
            <button onClick={() => speak(audioText)}
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors">
              <span>🔊</span> <span className="text-gray-700">{answered ? audioText : 'Ouvir a frase'}</span>
            </button>
          );
        })()}

        <p className="font-black text-gray-900 text-xl mb-1 leading-snug">{ex.question}</p>

        {/* Tradução/dica */}
        {ex.translation && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
            <span className="text-yellow-500">🇧🇷</span>
            <p className="text-yellow-800 font-bold text-sm">{ex.translation}</p>
          </div>
        )}

        {/* MCQ choices */}
        {(ex.type === 'MCQ' || ex.type === 'MCQ_Trans') && (
          <div className="flex flex-col gap-3 mt-2" key={shakeKey}>
            {ex.choices?.map((choice) => {
              const isSelected = selected === choice;
              let bg = 'bg-white border-gray-200';
              if (answered) {
                if (choice === ex.answer) bg = 'bg-green-50 border-green-400';
                else if (isSelected && choice !== ex.answer) bg = 'bg-red-50 border-red-400 animate-shake';
              } else if (isSelected) {
                bg = 'border-blue-400 bg-blue-50';
              }
              return (
                <button key={choice} disabled={answered}
                  onClick={() => setSelected(choice)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-bold transition-all ${bg}`}>
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {/* Word Order */}
        {ex.type === 'WordOrder' && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="min-h-14 p-3 rounded-xl border-2 border-dashed flex flex-wrap gap-2"
              style={{ borderColor: answered ? (isCorrect ? '#58cc02' : '#ff4b4b') : '#e5e5e5' }}>
              {wordOrder.map((w, i) => (
                <button key={`${w}-${i}`} disabled={answered}
                  onClick={() => {
                    setWordOrder((prev) => prev.filter((_, idx) => idx !== i));
                    setAvailableWords((prev) => [...prev, w]);
                  }}
                  className="px-3 py-1.5 rounded-lg font-bold text-white"
                  style={{ background: '#1cb0f6' }}>
                  {w}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableWords.map((w, i) => (
                <button key={`${w}-${i}`} disabled={answered}
                  onClick={() => {
                    setWordOrder((prev) => [...prev, w]);
                    setAvailableWords((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                  className="px-3 py-1.5 rounded-lg border-2 border-b-4 font-bold bg-white border-gray-200">
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fill In */}
        {ex.type === 'FillIn' && (
          <input
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            disabled={answered}
            placeholder="Sua resposta..."
            className="mt-2 w-full px-4 py-3 rounded-xl border-2 font-bold outline-none focus:border-blue-400"
            style={{ borderColor: answered ? (isCorrect ? '#58cc02' : '#ff4b4b') : '#e5e5e5' }}
          />
        )}

        {/* Feedback */}
        {answered && (
          <div className={`mt-4 p-4 rounded-xl ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`font-black mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
              {isCorrect ? '✓ Correto!' : `✗ Correto: ${ex.answer}`}
            </p>
            <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{ex.explanation}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <button
          disabled={!canVerify()}
          onClick={verify}
          className="w-full py-4 rounded-xl font-black text-white text-lg transition-all disabled:opacity-40"
          style={{
            background: answered ? (isCorrect ? '#58cc02' : '#ff4b4b') : '#58cc02',
            boxShadow: answered ? (isCorrect ? '0 4px 0 #46a302' : '0 4px 0 #c63b3b') : '0 4px 0 #46a302',
          }}>
          {!answered ? 'VERIFICAR' : current >= activeExercises.length - 1 ? 'CONCLUIR' : 'CONTINUAR'}
        </button>
      </div>
    </div>
  );
}
