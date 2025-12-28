import { deleteStoredItem, getStoredItem, setStoredItem } from './storage';

const FALLBACK_BASE_URL = 'http://10.0.2.2:4000';
const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? FALLBACK_BASE_URL;

const KEY_API_BASE_URL = 'bb_api_base_url';

export async function getApiBaseUrl(): Promise<string> {
  const stored = await getStoredItem(KEY_API_BASE_URL);
  const raw = String(stored ?? '').trim();
  const base = raw || String(DEFAULT_BASE_URL).trim();
  return base.replace(/\/$/, '');
}

export async function setApiBaseUrl(next: string): Promise<void> {
  const v = String(next ?? '').trim().replace(/\/$/, '');
  if (!v) {
    await deleteStoredItem(KEY_API_BASE_URL);
    return;
  }
  await setStoredItem(KEY_API_BASE_URL, v);
}

async function readJson(res: Response) {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(
      `Invalid response from server (${res.status}). Check API base URL. First bytes: ${raw.slice(0, 120)}`
    );
  }
}

type ApiJsonOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  token?: string | null;
};

export async function apiJson(path: string, options: ApiJsonOptions = {}) {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (!headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const token = options.token;
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await readJson(res);

  if (!res.ok) {
    const msg = String((data as any)?.error ?? (data as any)?.message ?? `Request failed (${res.status})`);
    throw new Error(msg);
  }

  return data;
}
