const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchWithToken(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<any> {
  let res = await fetchWithToken(path, init);

  // Auto-refresh expired access token once, then retry
  if (res.status === 401 && !path.startsWith('/auth/')) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      saveToken(refreshData.accessToken);
      res = await fetchWithToken(path, init);
    } else {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw Object.assign(new Error('Session expired'), { status: 401 });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'Request failed'), { status: res.status, data });
  return data;
}

export function saveToken(token: string) {
  localStorage.setItem('access_token', token);
}

export function clearToken() {
  localStorage.removeItem('access_token');
}

export function saveUserType(userType: string | null) {
  if (userType) localStorage.setItem('user_type', userType);
  else localStorage.removeItem('user_type');
}

export function getUserType(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
}

export function postAuthRedirect(userType: string | null): string {
  return userType ? '/library' : '/onboarding';
}
