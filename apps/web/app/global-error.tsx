'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold">Erreur globale</h1>
          <p className="text-sm text-slate-600">{error.message || 'Une erreur bloquante est survenue'}</p>
          <button type="button" onClick={reset} className="btn-primary">
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
