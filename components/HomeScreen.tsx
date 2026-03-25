'use client';
import { MODULES } from '@/data/modules';
import { useGameStore } from '@/lib/gameStore';

const SECTION_COLORS: Record<string, string> = {
  pres: '#58cc02',
  pc: '#1cb0f6',
};

const SECTIONS = [
  {
    key: 'pres',
    title: '🗣️ Présent',
    subtitle: 'Tempo presente dos 30 verbos essenciais',
    moduleIds: ['pres_b1', 'pres_b2', 'pres_b3'],
  },
  {
    key: 'pc',
    title: '⏪ Passé Composé',
    subtitle: 'Passado composto — ações concluídas',
    moduleIds: ['pc_b1', 'pc_b2'],
  },
];

interface Props {
  onStartModule: (moduleId: string) => void;
  onGoReview: () => void;
}

export default function HomeScreen({ onStartModule, onGoReview }: Props) {
  const { stats, progress, errors } = useGameStore();
  const pendingErrors = errors.filter((e) => !e.mastered).length;

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg,#0f1923 0%,#1a2f4e 50%,#0d2137 100%)' }}>
      <div className="flex-1 flex flex-col items-center px-4 pt-8 pb-24">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🇫🇷</div>
            <h1 className="text-3xl font-black text-white">
              French<span style={{ color: '#58cc02' }}>TCF</span>
            </h1>
            <p className="text-white/50 text-sm font-light">Aprenda francês para o TCF</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 mb-5">
            <div className="text-center">
              <div className="font-black text-xl" style={{ color: '#ffc800' }}>🔥 {stats.streak}</div>
              <div className="text-white/50 text-xs">dias</div>
            </div>
            <div className="text-center">
              <div className="font-black text-xl" style={{ color: '#58cc02' }}>⚡ {stats.total_xp}</div>
              <div className="text-white/50 text-xs">XP total</div>
            </div>
            {pendingErrors > 0 && (
              <div className="text-center">
                <div className="font-black text-xl" style={{ color: '#ff4b4b' }}>❌ {pendingErrors}</div>
                <div className="text-white/50 text-xs">para revisar</div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {pendingErrors > 0 && (
            <button onClick={onGoReview}
              className="w-full mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-left">
              <span className="text-2xl">🔁</span>
              <div>
                <p className="font-bold text-white text-sm">{pendingErrors} erros para revisar</p>
                <p className="text-white/50 text-xs">Clique para começar a revisão</p>
              </div>
            </button>
          )}

          {/* Learning Path */}
          <div className="flex flex-col gap-6">
            {SECTIONS.map((section) => {
              const color = SECTION_COLORS[section.key];
              const sectionModules = section.moduleIds
                .map((id) => MODULES.find((m) => m.id === id))
                .filter(Boolean) as typeof MODULES;

              return (
                <div key={section.key}>
                  {/* Section Header */}
                  <div className="mb-3 px-1">
                    <h2 className="text-white font-black text-lg">{section.title}</h2>
                    <p className="text-white/40 text-xs">{section.subtitle}</p>
                  </div>

                  {/* Module Cards */}
                  <div className="flex flex-col gap-2">
                    {sectionModules.map((mod, idx) => {
                      const prog = progress[mod.id];
                      const total = mod.exercises.length;
                      const done = prog?.completed ?? 0;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      const isLocked = false; // future: unlock logic

                      return (
                        <button
                          key={mod.id}
                          onClick={() => !isLocked && onStartModule(mod.id)}
                          disabled={isLocked}
                          className="w-full text-left px-4 py-3 rounded-2xl border flex items-center gap-3 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.07)', borderColor: color + '44' }}
                        >
                          <div className="text-3xl w-10 text-center flex-shrink-0">
                            {isLocked ? '🔒' : mod.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-white text-sm">{mod.name}</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                                style={{ background: color + '25', color }}>
                                {mod.level}
                              </span>
                            </div>
                            <p className="text-white/40 text-xs truncate">{mod.desc}</p>
                            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <p className="text-white/30 text-xs mt-1">{done}/{total} exercícios</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Coming soon placeholder */}
                  <div className="mt-2 px-4 py-3 rounded-2xl border border-dashed flex items-center gap-3 opacity-30"
                    style={{ borderColor: color + '55' }}>
                    <span className="text-2xl">➕</span>
                    <span className="text-white/50 text-sm">Mais blocos em breve...</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <button className="flex-1 py-3 flex flex-col items-center gap-1" style={{ color: '#58cc02' }}>
          <span className="text-xl">📚</span>
          <span className="text-xs font-bold">Lições</span>
        </button>
        <button onClick={onGoReview} className="flex-1 py-3 flex flex-col items-center gap-1 relative"
          style={{ color: '#afafaf' }}>
          <span className="text-xl">🔁</span>
          <span className="text-xs font-bold">Revisar</span>
          {pendingErrors > 0 && (
            <span className="absolute top-2 right-8 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {pendingErrors > 9 ? '9+' : pendingErrors}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
