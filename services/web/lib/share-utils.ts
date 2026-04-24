import { apiFetch } from './api';

export type SharePlatform = 'linkedin' | 'instagram' | 'facebook' | 'whatsapp';

export const SHARE_PLATFORMS: { id: SharePlatform; label: string }[] = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export async function shareFragment(fragmentId: string, platform: SharePlatform): Promise<string> {
  const data = await apiFetch(`/fragments/${fragmentId}/share`, {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
  return data.url as string;
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
