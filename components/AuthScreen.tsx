'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg,#0f1923 0%,#1a2f4e 50%,#0d2137 100%)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4 animate-bounce-slow">🇫🇷</div>
        <h1 className="text-4xl font-black text-white mb-1">
          French<span style={{ color: '#58cc02' }}>TCF</span>
        </h1>
        <p className="text-white/60 mb-8 font-light">Aprenda francês, passe no TCF</p>

        {sent ? (
          <div className="bg-white/10 rounded-2xl p-6 text-white">
            <div className="text-4xl mb-3">📧</div>
            <p className="font-bold text-lg">Verifique seu email!</p>
            <p className="text-white/70 text-sm mt-2">Enviamos um link mágico para <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: loading ? '#333' : '#58cc02', boxShadow: '0 4px 0 #46a302' }}
            >
              {loading ? 'Enviando...' : 'Entrar com email'}
            </button>
            <p className="text-white/40 text-xs mt-2">Sem senha. Enviamos um link mágico no email.</p>
          </form>
        )}
      </div>
    </div>
  );
}
