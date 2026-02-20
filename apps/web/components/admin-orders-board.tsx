'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { getAdminOrders, getRealtimeUrl, updateOrderStatus } from '@/lib/api';
import { formatPrice } from './price';
import type { Order, OrderStatus } from '@/lib/types';

const statuses: OrderStatus[] = ['NOUVELLE', 'EN_PREPA', 'PRETE', 'SERVIE', 'ANNULEE'];
const statusLabel: Record<OrderStatus, string> = {
  NOUVELLE: 'NOUVELLE',
  EN_PREPA: 'EN PRÉPA',
  PRETE: 'PRÊTE',
  SERVIE: 'SERVIE',
  ANNULEE: 'ANNULÉE',
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function needsPreparationAlert(order: Order) {
  if (order.status !== 'NOUVELLE') {
    return false;
  }
  const elapsed = Date.now() - new Date(order.createdAt).getTime();
  return elapsed >= 10 * 60 * 1000;
}

export function AdminOrdersBoard({
  token,
  establishmentId,
  establishmentName,
}: {
  token: string;
  establishmentId: string;
  establishmentName?: string | null;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sortDesc = (list: Order[]) =>
      [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const upsertOrder = (list: Order[], incoming: Order) => {
      const idx = list.findIndex((o) => o.id === incoming.id);
      if (idx === -1) {
        return sortDesc([incoming, ...list]);
      }
      const next = [...list];
      next[idx] = incoming;
      return sortDesc(next);
    };

    const loadOrders = async () => {
      try {
        const data = await getAdminOrders(token);
        setOrders(sortDesc(data));
        setError(null);
      } catch (e) {
        const message = (e as Error).message;
        if (message.includes('(401)')) {
          localStorage.removeItem('scan_eat_token');
          localStorage.removeItem('scan_eat_establishment');
          localStorage.removeItem('scan_eat_establishment_name');
          router.push('/admin/login');
          return;
        }
        setError(message);
      }
    };

    void loadOrders();
    const pollId = window.setInterval(() => {
      void loadOrders();
    }, 5000);

    const socket = io(`${getRealtimeUrl()}/realtime`);
    socket.on('connect', () => {
      socket.emit('join_establishment', { establishmentId });
    });

    socket.on('order_created', (incoming: Order) => {
      setOrders((prev) => upsertOrder(prev, incoming));
    });

    socket.on('order_status_updated', (incoming: Order) => {
      setOrders((prev) => upsertOrder(prev, incoming));
    });

    return () => {
      window.clearInterval(pollId);
      socket.disconnect();
    };
  }, [token, establishmentId, router]);

  const byStatus = useMemo(() => {
    return statuses.map((status) => ({
      status,
      orders: orders.filter((o) => o.status === status),
    }));
  }, [orders]);

  const fallbackEstablishmentName = orders[0]?.establishment?.name;

  const setStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const updated = await updateOrderStatus(token, orderId, nextStatus, true);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  return (
    <main className="space-y-4 p-4">
      <header className="card">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Scan&apos;n&apos;eat</p>
        <h1 className="text-xl font-semibold">Dashboard commandes</h1>
        <p className="text-sm text-slate-600">{establishmentName ?? fallbackEstablishmentName ?? 'Établissement'}</p>
      </header>

      {error && <p className="text-red-600">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {byStatus.map((col) => (
          <div key={col.status} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{statusLabel[col.status]}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{col.orders.length}</span>
            </div>

            {col.orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">#{order.id.slice(-6)}</p>
                  {!order.seen && <span className="rounded bg-accent px-2 py-0.5 text-xs text-white">Nouveau</span>}
                </div>

                <p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
                <p>Table: {order.table.label}</p>
                <p>Total: {formatPrice(order.total)}</p>

                {needsPreparationAlert(order) && (
                  <p className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                    Alerte: commande en attente de préparation depuis plus de 10 min
                  </p>
                )}

                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.qty} x {item.product.name}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 grid grid-cols-2 gap-1">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      className="btn-secondary px-2 py-1 text-xs"
                      type="button"
                      onClick={() => setStatus(order.id, s)}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}
