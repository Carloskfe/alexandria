'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, saveToken } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      saveToken(data.accessToken);
      router.push('/library');
    } catch (err: any) {
      setError('root', { message: err.message ?? 'Login failed' });
    }
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-center">Sign in to Alexandria</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register('password')}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {errors.root && (
          <p className="text-red-500 text-sm">{errors.root.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-2 text-gray-400 text-sm">
        <span className="flex-1 h-px bg-gray-200" />
        or
        <span className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="space-y-2">
        <a
          href={`${API_URL}/auth/google`}
          className="flex items-center justify-center gap-2 w-full border rounded-lg py-2 hover:bg-gray-50 transition text-sm"
        >
          Continue with Google
        </a>
        <a
          href={`${API_URL}/auth/facebook`}
          className="flex items-center justify-center gap-2 w-full border rounded-lg py-2 hover:bg-gray-50 transition text-sm"
        >
          Continue with Facebook
        </a>
        <a
          href={`${API_URL}/auth/apple`}
          className="flex items-center justify-center gap-2 w-full border rounded-lg py-2 hover:bg-gray-50 transition text-sm"
        >
          Continue with Apple
        </a>
      </div>

      <p className="text-center text-sm mt-6 text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}
