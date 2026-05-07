'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, saveUserType } from '@/lib/api';

const TYPES = [
  {
    value: 'personal',
    label: 'Lector personal',
    description: 'Leo para mi crecimiento personal, aprender o disfrutar.',
    icon: '📖',
  },
  {
    value: 'author',
    label: 'Autor',
    description: 'Escribo libros y quiero compartir mi trabajo con lectores.',
    icon: '✍️',
  },
  {
    value: 'editorial',
    label: 'Casa editorial',
    description: 'Represento una editorial o casa publicadora.',
    icon: '🏢',
  },
] as const;

type UserType = (typeof TYPES)[number]['value'];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ userType: selected }),
      });
      saveUserType(selected);
      router.push(selected === 'personal' ? '/onboarding/preferences' : '/library');
    } catch (err: any) {
      if (err.status === 401) { router.replace('/login'); return; }
      setError(err.message ?? 'Algo salió mal. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-2">Bienvenido a Noetia</h1>
        <p className="text-gray-500 text-center mb-8">¿Cómo usarás Noetia?</p>

        <div className="space-y-3 mb-8">
          {TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelected(type.value)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition ${
                selected === type.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl mt-0.5">{type.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{type.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition"
        >
          {loading ? 'Guardando…' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
