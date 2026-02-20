'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="text-sm text-slate-600">{error.message || 'Erreur inattendue'}</p>
      <button type="button" onClick={reset} className="btn-primary">
        Réessayer
      </button>
    </main>
  );
}
