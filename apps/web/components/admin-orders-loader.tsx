'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminOrdersBoard } from './admin-orders-board';

export function AdminOrdersLoader() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishmentName, setEstablishmentName] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('scan_eat_token');
    const e = localStorage.getItem('scan_eat_establishment');
    const n = localStorage.getItem('scan_eat_establishment_name');
    if (!t || !e) {
      router.push('/admin/login');
      return;
    }
    setToken(t);
    setEstablishmentId(e);
    setEstablishmentName(n);
  }, [router]);

  if (!token || !establishmentId) {
    return <main className="p-4">Chargement...</main>;
  }

  return <AdminOrdersBoard token={token} establishmentId={establishmentId} establishmentName={establishmentName} />;
}
