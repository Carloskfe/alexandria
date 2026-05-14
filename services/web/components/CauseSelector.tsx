'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Cause = {
  id: string;
  slug: string;
  name: string;
  description: string;
  statFact: string;
  icon: string;
};

interface Props {
  onSave: () => void;
  onSkip: () => void;
}

export default function CauseSelector({ onSave, onSkip }: Props) {
  const [causes, setCauses] = useState<Cause[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [random, setRandom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/causes').then(setCauses).catch(() => {});
  }, []);

  function toggle(id: string) {
    if (random) return;
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < 2
        ? [...prev, id]
        : prev,
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch('/causes/preferences', {
        method: 'POST',
        body: JSON.stringify({
          cause1Id: random ? null : (selected[0] ?? null),
          cause2Id: random ? null : (selected[1] ?? null),
          randomDistribution: random,
        }),
      });
      onSave();
    } catch {
      onSave(); // proceed even if preference save fails
    } finally {
      setSaving(false);
    }
  }

  const canSave = random || selected.length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">Causas Noetia</p>
        <h2 className="text-lg font-bold text-gray-900 mb-1">El 2,22% de tu pago va aquí</h2>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Elige hasta 2 causas que quieres apoyar, o distribúyelo aleatoriamente entre las tres.
        </p>

        {causes.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {causes.map((cause) => {
              const isSelected = selected.includes(cause.id);
              const isDisabled = !random && !isSelected && selected.length >= 2;
              return (
                <button
                  key={cause.id}
                  onClick={() => toggle(cause.id)}
                  disabled={isDisabled || random}
                  className={[
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition',
                    isSelected && !random ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white',
                    isDisabled ? 'opacity-40' : 'hover:border-slate-300',
                    random ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span className="text-2xl shrink-0">{cause.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cause.name}</p>
                    <p className="text-xs text-gray-400 leading-snug mt-0.5">{cause.description}</p>
                  </div>
                  {isSelected && !random && (
                    <span className="ml-auto text-blue-600 shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Random option */}
        <button
          onClick={() => { setRandom((r) => !r); setSelected([]); }}
          className={[
            'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition mb-5',
            random ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300',
          ].join(' ')}
        >
          <span className="text-2xl shrink-0">🎲</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Distribuir aleatoriamente</p>
            <p className="text-xs text-gray-400">Tu 2,22% se reparte equitativamente entre las tres causas.</p>
          </div>
          {random && (
            <span className="ml-auto text-emerald-600 shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </button>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition"
          >
            Ahora no
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 rounded-xl bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 transition"
          >
            {saving ? 'Guardando…' : 'Confirmar y continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
