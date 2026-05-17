'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(values),
    }).catch(() => {});
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-bold mb-4 text-center">Revisa tu correo</h1>
        <p className="text-gray-600 text-sm text-center mb-6">
          Si existe una cuenta con ese correo recibirás un enlace para restablecer tu contraseña en breve.
        </p>
        <Link href="/login" className="block text-center text-blue-600 hover:underline text-sm">
          Volver a iniciar sesión
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-center">¿Olvidaste tu contraseña?</h1>
      <p className="text-gray-500 text-sm text-center mb-6">
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input
            type="email"
            {...register('email')}
            placeholder="tu@correo.com"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>

      <p className="text-center text-sm mt-6 text-gray-500">
        <Link href="/login" className="text-indigo-600 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}
