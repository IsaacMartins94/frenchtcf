'use client';
import { useGameStore } from '@/lib/gameStore';

interface Props {
  onGoHome: () => void;
}

const MODULE_NAMES: Record<string, string> = {
  pres_b1: 'Présent — Bloco 1',
  pres_b2: 'Présent — Bloco 2',
  pres_b3: 'Présent — Bloco 3',
  pc_b1: 'Passé Composé — Bloco 1',
  pc_b2: 'Passé Composé — Bloco 2',
  // legacy
  present_er: 'Verbos -ER',
  present_irreg: 'Irregulares',
  negation: 'Negação',
  interrogative: 'Interrogativas',
  verbs_top_1: 'Verbos Top — P1',
  verbs_top_2: 'Verbos Top — P2',
  verbs_top_3: 'Verbos Top — P3',
};

export default function ReviewScreen({ onGoHome }: Props) {
  const { errors, masterError, deleteError } = useGameStore();
  const pending = errors.filter((e) => !e.mastered);
  const mastered = errors.filter((e) => e.mastered);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={onGoHome} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="font-black text-gray-900 text-lg">Revisão de Erros</h1>
      </div>

      <div className="flex-1 px-4 py-4 max-w-xl mx-auto w-full pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-xl font-black text-gray-900">{errors.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <div className="text-xl font-black text-red-500">{pending.length}</div>
            <div className="text-xs text-red-400">Pendentes</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <div className="text-xl font-black text-green-600">{mastered.length}</div>
            <div className="text-xs text-green-500">Dominados</div>
          </div>
        </div>

        {errors.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <p className="font-bold text-gray-700 text-lg">Nenhum erro!</p>
            <p className="text-gray-400 text-sm mt-1">Continue praticando para manter esse ritmo.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-5">
                <h2 className="font-bold text-gray-500 text-sm mb-3">PARA REVISAR ({pending.length})</h2>
                <div className="flex flex-col gap-3">
                  {pending.map((e) => (
                    <div key={e.id} className="bg-white rounded-xl p-4 border border-red-100">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-gray-900 text-sm flex-1">{e.question}</p>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                          {MODULE_NAMES[e.module_id] || e.module_id}
                        </span>
                      </div>
                      <p className="text-green-700 font-bold text-sm mb-1">✓ {e.correct_answer}</p>
                      <p className="text-gray-500 text-xs mb-3">{e.explanation}</p>
                      <div className="flex gap-2">
                        <button onClick={() => e.id && masterError(e.id)}
                          className="flex-1 py-2 rounded-lg font-bold text-sm text-white"
                          style={{ background: '#58cc02' }}>
                          Marcar como dominado
                        </button>
                        <button onClick={() => e.id && deleteError(e.id)}
                          className="px-3 py-2 rounded-lg font-bold text-sm text-gray-400 border border-gray-200">
                          🗑
                        </button>
                      </div>
                      {e.count > 1 && (
                        <p className="text-xs text-red-400 mt-2">Errou {e.count}x</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mastered.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-500 text-sm mb-3">DOMINADOS ({mastered.length})</h2>
                <div className="flex flex-col gap-2">
                  {mastered.map((e) => (
                    <div key={e.id} className="bg-green-50 rounded-xl p-3 border border-green-100 opacity-70">
                      <p className="font-bold text-gray-700 text-sm">{e.question}</p>
                      <p className="text-green-600 text-sm">✓ {e.correct_answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <button onClick={onGoHome} className="flex-1 py-3 flex flex-col items-center gap-1" style={{ color: '#afafaf' }}>
          <span className="text-xl">📚</span>
          <span className="text-xs font-bold">Lições</span>
        </button>
        <button className="flex-1 py-3 flex flex-col items-center gap-1" style={{ color: '#58cc02' }}>
          <span className="text-xl">🔁</span>
          <span className="text-xs font-bold">Revisar</span>
        </button>
      </div>
    </div>
  );
}
