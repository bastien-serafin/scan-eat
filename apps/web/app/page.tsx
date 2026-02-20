import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Scan Eat MVP</h1>
      <p className="text-center text-slate-600">Utilisez un lien QR signé pour accéder au menu client.</p>
      <Link className="btn-primary" href="/admin/login">
        Aller au dashboard établissement
      </Link>
    </main>
  );
}
