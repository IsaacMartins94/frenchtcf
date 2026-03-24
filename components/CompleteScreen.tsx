'use client';

interface Props {
  xp: number;
  correct: number;
  total: number;
  streak: number;
  onHome: () => void;
  onRetry: () => void;
}

export default function CompleteScreen({ xp, correct, total, streak, onHome, onRetry }: Props) {
  const pct = Math.round((correct / total) * 100);
  const trophy = pct >= 90 ? '🏆' : pct >= 70 ? '🥈' : '🎓';
  const msg = pct >= 90 ? 'Incrível! Você arrasou!' : pct >= 70 ? 'Muito bem! Continue assim!' : 'Bom esforço! Pratique mais.';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-sm w-full">
        <div className="text-7xl mb-4">{trophy}</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Lição Completa!</h1>
        <p className="text-gray-500 mb-8">{msg}</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-yellow-50 rounded-2xl p-4">
            <div className="text-2xl font-black text-yellow-600">+{xp}</div>
            <div className="text-xs text-yellow-500 font-bold mt-1">XP</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4">
            <div className="text-2xl font-black text-green-600">{pct}%</div>
            <div className="text-xs text-green-500 font-bold mt-1">Acertos</div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4">
            <div className="text-2xl font-black text-purple-600">🔥{streak}</div>
            <div className="text-xs text-purple-500 font-bold mt-1">Sequência</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onHome}
            className="w-full py-4 rounded-xl font-black text-white"
            style={{ background: '#58cc02', boxShadow: '0 4px 0 #46a302' }}>
            Voltar ao Início
          </button>
          <button onClick={onRetry}
            className="w-full py-4 rounded-xl font-black border-2 border-gray-200 text-gray-600 bg-white">
            Repetir Lição
          </button>
        </div>
      </div>
    </div>
  );
}
