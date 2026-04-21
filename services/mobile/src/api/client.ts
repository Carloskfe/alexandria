const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not set');
}

export const apiClient = {
  get: (path: string) =>
    fetch(`${BASE_URL}${path}`).then((res) => res.json()),

  post: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  patch: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  delete: (path: string) =>
    fetch(`${BASE_URL}${path}`, { method: 'DELETE' }).then((res) => res.json()),
};
