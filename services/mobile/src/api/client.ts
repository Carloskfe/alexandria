import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

async function buildHeaders(withBody = false): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('noetia_access_token');
  return {
    ...(withBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    throw Object.assign(new Error((data['message'] as string) ?? 'Request failed'), {
      status: res.status,
      data,
    });
  }
  return data as T;
}

export const apiClient = {
  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { headers: await buildHeaders() });
    return handle<T>(res);
  },

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: await buildHeaders(true),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handle<T>(res);
  },

  async patch<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: await buildHeaders(true),
      body: JSON.stringify(body),
    });
    return handle<T>(res);
  },

  async delete<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });
    return handle<T>(res);
  },
};
