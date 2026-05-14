'use client';

import { useEffect, useState } from 'react';
import { hasSeenFragmentsTutorial, markFragmentsTutorialSeen } from '@/lib/tutorial-flags';

export default function FragmentsTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasSeenFragmentsTutorial()) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    markFragmentsTutorialSeen();
    setShow(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={dismiss} aria-hidden="true" />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-2xl shadow-2xl px-6 pt-5 pb-8 max-w-lg mx-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial de Fragmentos"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="text-lg font-bold text-gray-900 mb-1">Tus Fragmentos</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Los fragmentos son los pasajes que guardas mientras lees. Aquí encontrarás todo lo que te ha inspirado.
        </p>

        <div className="space-y-4 mb-8">
          {[
            {
              icon: '✍️',
              title: 'Cómo crear un fragmento',
              body: 'En el lector, mantén presionado o arrastra sobre cualquier texto y toca "Guardar fragmento".',
            },
            {
              icon: '✏️',
              title: 'Editar antes de compartir',
              body: 'Toca un fragmento para editarlo, añadir una nota o ajustar el texto antes de crear una tarjeta.',
            },
            {
              icon: '📲',
              title: 'Convertirlo en tarjeta visual',
              body: 'Toca "Compartir" en cualquier fragmento para crear una imagen lista para LinkedIn, Instagram y más.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="text-xl mt-0.5 w-7 shrink-0">{icon}</span>
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
          Entendido
        </button>
      </div>
    </>
  );
}
