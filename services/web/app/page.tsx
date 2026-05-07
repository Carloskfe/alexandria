'use client';

import { useState } from 'react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
    title: 'Modo Escucha Activa',
    desc: 'Lee y escucha al mismo tiempo. Cada frase se resalta en tiempo real mientras el audio la narra — nunca más pierdas el hilo.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 11.25v5.25a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 015.25 4.5h5.25" />
      </svg>
    ),
    title: 'Captura fragmentos',
    desc: 'Selecciona el texto que más te impacta con un toque. Todos tus fragmentos en un solo lugar, organizados por libro.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    title: 'Comparte en segundos',
    desc: 'Convierte cualquier fragmento en una tarjeta visual lista para LinkedIn, Instagram o Pinterest — con tu estilo.',
  },
];

export default function LandingPage() {
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

  return (
    <main className="min-h-screen bg-[#0D1B2A] text-white">

      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="text-xl font-bold tracking-widest">NOETIA</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-slate-300 hover:text-white transition">Iniciar sesión</Link>
          <Link href="/register" className="bg-white text-[#0D1B2A] px-4 py-1.5 rounded-full font-semibold hover:bg-slate-100 transition text-sm">
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Beta próximamente — únete a la lista de espera
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
          Lee. Escucha.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Comparte lo que importa.
          </span>
        </h1>

        <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Noetia sincroniza texto y audio frase por frase. Captura las ideas que más te mueven y
          conviértelas en contenido visual para tus redes — en segundos.
        </p>

        {/* Waitlist form */}
        {status === 'success' ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-8 max-w-md mx-auto">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="font-semibold text-lg mb-1">¡Ya estás en la lista!</p>
            <p className="text-slate-300 text-sm">
              Te avisaremos por correo cuando tu acceso beta esté disponible.
            </p>
          </div>
        ) : (
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
              <p className="text-amber-400 text-sm">Este correo ya está en la lista. ¡Te avisamos pronto!</p>
            )}
            {status === 'error' && (
              <p className="text-red-400 text-sm">Algo salió mal. Intenta de nuevo.</p>
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
        )}
      </section>

      {/* Features */}
      <section className="bg-white/5 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-center text-slate-400 text-sm font-medium uppercase tracking-widest mb-10">
            Qué hace Noetia diferente
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For authors */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Para autores y editoriales</p>
            <h2 className="text-xl font-bold text-white mb-2">Publica tu libro. Llega a miles de lectores.</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sube tu texto y audio. Noetia ofrece el Modo Escucha Activa para todos tus lectores,
              con analytics en tiempo real de lecturas, fragmentos y compartidos.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/upload-guide"
              className="inline-block bg-white text-[#0D1B2A] font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition text-sm whitespace-nowrap"
            >
              Ver guía de publicación →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span className="font-bold tracking-widest text-slate-400">NOETIA</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-300 transition">Iniciar sesión</Link>
            <Link href="/upload-guide" className="hover:text-slate-300 transition">Para autores</Link>
            <a href="mailto:hola@noetia.app" className="hover:text-slate-300 transition">Contacto</a>
          </div>
          <span>© {new Date().getFullYear()} Noetia</span>
        </div>
      </footer>

    </main>
  );
}
