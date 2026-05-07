'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type WaitlistEntry = {
  id: string;
  email: string;
  name: string | null;
  isAuthor: boolean;
  message: string | null;
  invitedAt: string | null;
  createdAt: string;
};

type WaitlistStats = { total: number; authors: number; invited: number };

type UploadCode = {
  id: string;
  code: string;
  notes: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CodeStatusBadge({ code }: { code: UploadCode }) {
  const expired = code.expiresAt && new Date(code.expiresAt) < new Date();
  if (code.usedBy) return <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">Usado</span>;
  if (expired) return <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">Expirado</span>;
  return <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Disponible</span>;
}

const CATEGORIES = [
  { value: 'leadership', label: 'Liderazgo' },
  { value: 'personal-development', label: 'Desarrollo Personal' },
  { value: 'business', label: 'Negocios' },
  { value: 'classic', label: 'Clásico' },
];

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  uploadedBy?: { id: string; name: string | null; email: string | null } | null;
};

export default function AdminPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Book[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [actionError, setActionError] = useState('');

  // Waitlist state
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistStats, setWaitlistStats] = useState<WaitlistStats | null>(null);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);

  // Codes state
  const [codes, setCodes] = useState<UploadCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [codeCount, setCodeCount] = useState(1);
  const [codeNotes, setCodeNotes] = useState('');
  const [codeExpiry, setCodeExpiry] = useState('');
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? sessionStorage.getItem('access_token') ?? '' : '';

  const fetchWaitlist = useCallback(async () => {
    try {
      const [entries, stats] = await Promise.all([
        apiFetch('/waitlist'),
        apiFetch('/waitlist/stats'),
      ]);
      setWaitlist(entries);
      setWaitlistStats(stats);
    } catch { /* ignore */ } finally { setWaitlistLoading(false); }
  }, []);

  async function handleInvite(id: string) {
    setInviting(id);
    try {
      await apiFetch(`/waitlist/${id}/invite`, { method: 'POST' });
      fetchWaitlist();
    } catch { /* ignore */ } finally { setInviting(null); }
  }

  const fetchCodes = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/codes');
      setCodes(data);
    } catch { /* ignore */ } finally { setCodesLoading(false); }
  }, []);

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    setGeneratingCodes(true);
    try {
      const body: Record<string, any> = { count: codeCount };
      if (codeNotes.trim()) body.notes = codeNotes.trim();
      if (codeExpiry) body.expiresAt = new Date(codeExpiry).toISOString();
      await apiFetch('/admin/codes', { method: 'POST', body: JSON.stringify(body) });
      setCodeNotes(''); setCodeExpiry(''); setCodeCount(1);
      fetchCodes();
    } catch { /* ignore */ } finally { setGeneratingCodes(false); }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await fetch('/api/books/pending', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setPending(await res.json());
    } catch {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('access_token')) {
      router.replace('/login');
      return;
    }
    fetchPending();
    fetchCodes();
    fetchWaitlist();
  }, [router, fetchPending, fetchCodes, fetchWaitlist]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? `Upload failed (${res.status})`);
      setSuccess(`Libro "${data.title}" creado con ID ${data.id}`);
      formRef.current?.reset();
      fetchPending();
    } catch (err: any) {
      setError(err.message ?? 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id: string) {
    setActionError('');
    try {
      const res = await fetch(`/api/books/${id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      fetchPending();
    } catch (err: any) {
      setActionError(err.message ?? 'Error al publicar');
    }
  }

  async function handleReject(id: string) {
    setActionError('');
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`Error ${res.status}`);
      setPending((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      setActionError(err.message ?? 'Error al rechazar');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* ── Lista de espera ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Lista de espera</h2>
          <p className="text-gray-500 text-sm mb-4">
            Usuarios registrados en la landing page esperando acceso beta.
          </p>

          {/* Stats */}
          {waitlistStats && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total', value: waitlistStats.total },
                { label: 'Autores', value: waitlistStats.authors },
                { label: 'Invitados', value: waitlistStats.invited },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Entries */}
          {waitlistLoading ? (
            <p className="text-gray-400 text-sm">Cargando…</p>
          ) : waitlist.length === 0 ? (
            <p className="text-gray-400 text-sm">Nadie en la lista todavía.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {waitlist.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {e.name ?? <span className="text-gray-400 font-normal">Sin nombre</span>}
                        {e.isAuthor && <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">AUTOR</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{e.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 hidden sm:block flex-shrink-0">
                      {formatDate(e.createdAt)}
                    </span>
                    {e.invitedAt ? (
                      <span className="text-xs font-medium text-green-600 flex-shrink-0">✓ Invitado</span>
                    ) : (
                      <button
                        onClick={() => handleInvite(e.id)}
                        disabled={inviting === e.id}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition flex-shrink-0"
                      >
                        {inviting === e.id ? '…' : 'Invitar'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Códigos de cortesía ───────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Códigos de cortesía</h2>
          <p className="text-gray-500 text-sm mb-4">
            Genera códigos para que un autor suba un libro gratis, sin importar su cuota de plan.
            Cada código es de un solo uso.
          </p>

          {/* Generate form */}
          <form onSubmit={handleGenerateCodes} className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number" min={1} max={100} value={codeCount}
                  onChange={(e) => setCodeCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expira (opcional)</label>
                <input
                  type="date" value={codeExpiry} onChange={(e) => setCodeExpiry(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit" disabled={generatingCodes}
                  className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
                >
                  {generatingCodes ? 'Generando…' : 'Generar'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nota interna</label>
              <input
                type="text" value={codeNotes} onChange={(e) => setCodeNotes(e.target.value)}
                placeholder="Ej: Beta invite — Editorial Planeta"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Codes list */}
          {codesLoading ? (
            <p className="text-gray-400 text-sm">Cargando códigos…</p>
          ) : codes.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay códigos generados todavía.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {codes.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="font-mono text-sm font-semibold text-gray-900 tracking-widest flex-1">{c.code}</span>
                    <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-blue-600 transition" title="Copiar">
                      {copied === c.code
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                      }
                    </button>
                    <span className="text-xs text-gray-400 w-28 truncate hidden sm:block">{c.notes ?? '—'}</span>
                    <span className="text-xs text-gray-400 w-20 text-right hidden md:block">
                      {c.usedAt ? formatDate(c.usedAt) : (c.expiresAt ? `exp. ${formatDate(c.expiresAt)}` : '—')}
                    </span>
                    <CodeStatusBadge code={c} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pending submissions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Envíos pendientes</h2>
          <p className="text-gray-500 text-sm mb-4">Libros enviados por autores que esperan revisión.</p>
          {actionError && <p className="text-red-500 text-sm mb-3">{actionError}</p>}
          {loadingPending ? (
            <p className="text-gray-400 text-sm">Cargando…</p>
          ) : pending.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay envíos pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((book) => (
                <div key={book.id} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{book.title}</p>
                      <p className="text-xs text-gray-500">
                        {book.author} · {book.category}
                        {book.uploadedBy && (
                          <> · por {book.uploadedBy.name ?? book.uploadedBy.email}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(book.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handlePublish(book.id)}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                      >
                        Publicar
                      </button>
                      <button
                        onClick={() => handleReject(book.id)}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload form */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subir libro</h1>
          <p className="text-gray-500 text-sm mb-6">Agrega un nuevo libro al catálogo (publicado inmediatamente).</p>

          <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input name="title" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
              <input name="author" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select name="category" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <select name="language" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
              <input name="isbn" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea name="description" rows={3} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo de texto (epub / pdf)</label>
              <input name="textFile" type="file" accept=".epub,.pdf" className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo de audio (mp3 / m4a)</label>
              <input name="audioFile" type="file" accept=".mp3,.m4a,.aac" className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition"
            >
              {loading ? 'Subiendo…' : 'Subir libro'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
