'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getOrder, getRealtimeUrl } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatPrice } from './price';

const labels: Record<string, string> = {
  NOUVELLE: 'Nouvelle',
  EN_PREPA: 'En préparation',
  PRETE: 'Prête',
  SERVIE: 'Servie',
  ANNULEE: 'Annulée',
};

export function OrderStatusLive({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    let active = true;
    getOrder(orderId).then((o) => active && setOrder(o));

    const socket = io(`${getRealtimeUrl()}/realtime`);
    socket.emit('join_order', { orderId });
    socket.on('order_status_updated', (payload: Order) => {
      if (payload.id === orderId) {
        setOrder(payload);
      }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [orderId]);

  if (!order) {
    return <main className="p-4">Chargement commande...</main>;
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="card">
        <p className="text-sm text-slate-500">Commande #{order.id.slice(-6)}</p>
        <p className="text-xl font-semibold">Statut: {labels[order.status]}</p>
        <p className="text-sm">Table: {order.table.label}</p>
      </header>

      <section className="card">
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="text-sm">
              {item.qty} x {item.product.name} ({formatPrice(item.qty * item.unitPrice)})
            </li>
          ))}
        </ul>
        <p className="mt-3 font-semibold">Total: {formatPrice(order.total)}</p>
      </section>
    </main>
  );
}
