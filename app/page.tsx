'use client';
import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { MODULES } from '@/data/modules';
import { Module } from '@/types';
import HomeScreen from '@/components/HomeScreen';
import LessonScreen from '@/components/LessonScreen';
import CompleteScreen from '@/components/CompleteScreen';
import ReviewScreen from '@/components/ReviewScreen';

type Screen = 'home' | 'lesson' | 'complete' | 'review';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [lastResult, setLastResult] = useState({ xp: 0, correct: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const { stats } = useGameStore();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#0f1923 0%,#1a2f4e 50%,#0d2137 100%)' }}>
      <div className="text-6xl animate-bounce-slow">🇫🇷</div>
    </div>
  );

  const startModule = (moduleId: string) => {
    const mod = MODULES.find((m) => m.id === moduleId);
    if (mod) { setActiveModule(mod); setScreen('lesson'); }
  };

  const handleComplete = (xp: number, correct: number, total: number) => {
    setLastResult({ xp, correct, total });
    setScreen('complete');
  };

  if (screen === 'review') return <ReviewScreen onGoHome={() => setScreen('home')} />;
  if (screen === 'home') return <HomeScreen onStartModule={startModule} onGoReview={() => setScreen('review')} />;
  if (screen === 'lesson' && activeModule) return (
    <LessonScreen module={activeModule} onBack={() => setScreen('home')} onComplete={handleComplete} />
  );
  if (screen === 'complete') return (
    <CompleteScreen
      xp={lastResult.xp} correct={lastResult.correct} total={lastResult.total} streak={stats.streak}
      onHome={() => setScreen('home')}
      onRetry={() => { if (activeModule) setScreen('lesson'); }}
    />
  );
  return null;
}
