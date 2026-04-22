const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'Request failed'), { status: res.status, data });
  return data;
}

export function saveToken(token: string) {
  sessionStorage.setItem('access_token', token);
}

export function clearToken() {
  sessionStorage.removeItem('access_token');
}

export function saveUserType(userType: string | null) {
  if (userType) sessionStorage.setItem('user_type', userType);
  else sessionStorage.removeItem('user_type');
}

export function getUserType(): string | null {
  return typeof window !== 'undefined' ? sessionStorage.getItem('user_type') : null;
}

export function postAuthRedirect(userType: string | null): string {
  return userType ? '/library' : '/onboarding';
}
