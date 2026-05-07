'use client';

import { useState } from 'react';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isAuthor, setIsAuthor] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, isAuthor }),
      });
      if (res.status === 409) { setStatus('duplicate'); return; }
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-8 max-w-md mx-auto">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-green-400" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-semibold text-lg mb-1 text-white">¡Ya estás en la lista!</p>
        <p className="text-slate-300 text-sm">
          Te avisaremos por correo cuando tu acceso beta esté disponible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
      <input
        type="text"
        placeholder="Tu nombre (opcional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      />
      <input
        type="email"
        placeholder="Tu correo electrónico *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      />
      <label className="flex items-center gap-3 cursor-pointer group py-1">
        <input
          type="checkbox"
          checked={isAuthor}
          onChange={(e) => setIsAuthor(e.target.checked)}
          className="w-4 h-4 rounded accent-blue-500"
        />
        <span className="text-sm text-slate-300 group-hover:text-white transition">
          Soy autor o editorial — quiero publicar en Noetia
        </span>
      </label>

      {status === 'duplicate' && (
        <p className="text-amber-400 text-sm" role="alert">Este correo ya está en la lista. ¡Te avisamos pronto!</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm" role="alert">Algo salió mal. Intenta de nuevo.</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 text-sm"
      >
        {status === 'loading' ? 'Enviando…' : 'Unirme a la lista de espera →'}
      </button>
      <p className="text-slate-500 text-xs text-center">Sin spam. Te escribimos solo cuando tu acceso esté listo.</p>
    </form>
  );
}
