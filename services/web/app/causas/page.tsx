'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

type Cause = {
  id: string;
  slug: string;
  name: string;
  description: string;
  statFact: string;
  icon: string;
};

export default function CausasPage() {
  const [causes, setCauses] = useState<Cause[]>([]);

  useEffect(() => {
    apiFetch('/causes').then(setCauses).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0D1B2A] text-white px-6 py-16 text-center">
        <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase mb-3">Causas Noetia</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-snug">
          Con cada página,<br />construimos algo más.
        </h1>
        <p className="text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
          El <strong className="text-white">2,22%</strong> de cada pago que realizas en Noetia se destina
          directamente a causas sociales que transforman vidas en América Latina.
          Juntos hacemos posible lo que ninguno podría solo.
        </p>
      </section>

      {/* Percentage callout */}
      <section className="bg-slate-50 border-b border-slate-100 px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="shrink-0">
            <span className="text-5xl font-black text-[#0D1B2A]">2,22%</span>
            <p className="text-sm text-slate-500 mt-1">de cada pago</p>
          </div>
          <div className="sm:border-l sm:border-slate-200 sm:pl-6">
            <p className="text-slate-700 leading-relaxed">
              No de las ganancias — del total de cada transacción.
              Esto significa que cada suscripción y cada compra activa tu aporte de forma inmediata,
              sin condiciones ni letra pequeña.
            </p>
          </div>
        </div>
      </section>

      {/* Causes */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Las causas que apoyamos</h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          Actualmente trabajamos con tres categorías de impacto. Puedes elegir hasta dos favoritas.
        </p>

        {causes.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-[#0D1B2A] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {causes.map((cause) => (
              <div key={cause.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
                <div className="text-4xl mb-4">{cause.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{cause.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{cause.description}</p>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-600 italic leading-relaxed">"{cause.statFact}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-t border-slate-100 px-6 py-14">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-8">¿Cómo funciona?</h2>
          <div className="space-y-6 text-left">
            {[
              { step: '1', text: 'Realizas un pago en Noetia — suscripción o compra de título.' },
              { step: '2', text: 'El 2,22% de ese pago se asigna automáticamente a causas sociales.' },
              { step: '3', text: 'Tú decides cómo distribuirlo: eliges hasta 2 causas favoritas o lo distribuyes al azar entre las tres.' },
              { step: '4', text: 'Publicamos un informe de impacto transparente para que veas exactamente a dónde va cada peso.' },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0D1B2A] text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </div>
                <p className="text-gray-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + contact */}
      <section className="max-w-2xl mx-auto px-6 py-14 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-3">¿Lideras una causa social?</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-lg mx-auto">
          Si representas una organización sin fines de lucro o emprendimiento social que trabaja en
          bienestar animal, niñez, juventud o conservación ambiental en América Latina,
          queremos conocerte.
        </p>
        <a
          href="mailto:causas@noetia.app"
          className="inline-block bg-[#0D1B2A] text-white font-semibold px-8 py-3 rounded-xl hover:bg-slate-800 transition"
        >
          Escríbenos a causas@noetia.app
        </a>
        <p className="text-xs text-slate-400 mt-8">
          Noetia evalúa y selecciona socios aliados basándose en transparencia, impacto demostrable
          y alineación con nuestra comunidad de lectores.
        </p>
      </section>

      {/* Back link */}
      <div className="border-t border-slate-100 px-6 py-6 text-center">
        <Link href="/library" className="text-sm text-slate-400 hover:text-slate-600 transition">
          ← Volver a la biblioteca
        </Link>
      </div>
    </main>
  );
}
