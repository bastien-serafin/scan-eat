'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/api';

export function AdminLoginForm() {
  const [email, setEmail] = useState('admin@scan-eat.local');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginAdmin(email, password);
      localStorage.setItem('scan_eat_token', data.token);
      localStorage.setItem('scan_eat_establishment', data.admin.establishmentId);
      localStorage.setItem('scan_eat_establishment_name', data.admin.establishmentName);
      router.push('/admin/orders');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card mx-auto mt-16 max-w-md space-y-4" onSubmit={onSubmit}>
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">Scan&apos;n&apos;eat</p>
      <h1 className="text-xl font-semibold">Connexion établissement</h1>

      <label className="block text-sm">
        Email
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="block text-sm">
        Mot de passe
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}
