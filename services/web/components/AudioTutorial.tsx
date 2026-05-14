'use client';

import { markAudioTutorialSeen } from '@/lib/tutorial-flags';

interface Props {
  onDismiss: () => void;
}

export default function AudioTutorial({ onDismiss }: Props) {
  function dismiss() {
    markAudioTutorialSeen();
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-6 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label="Modo Escucha Activa"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Modo Escucha Activa</h2>
            <p className="text-xs text-gray-400">Lee y escucha al mismo tiempo</p>
          </div>
        </div>

        <div className="space-y-4 mb-7">
          {[
            {
              icon: '🔵',
              title: 'Frase a frase',
              body: 'La frase activa se resalta en azul mientras el audio avanza. Nunca pierdes el hilo.',
            },
            {
              icon: '👆',
              title: 'Toca para saltar',
              body: 'Toca cualquier frase y el audio salta directamente a ese punto.',
            },
            {
              icon: '⚡',
              title: 'Controla la velocidad',
              body: 'Ajusta la velocidad de reproducción — 0.75×, 1×, 1.25× o 1.5× — según tu ritmo.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="text-base mt-0.5 w-6 shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Explorar modo escucha
        </button>
      </div>
    </div>
  );
}
