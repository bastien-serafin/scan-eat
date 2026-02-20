import type { MenuResponse, Order, OrderPayload, OrderStatus } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function getMenu(slug: string, query: { t: string; sig: string; exp: string }) {
  const url = `${API_URL}/public/establishments/${slug}/menu?t=${encodeURIComponent(query.t)}&sig=${encodeURIComponent(query.sig)}&exp=${encodeURIComponent(query.exp)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    let reason = '';
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        reason = body.message.join(', ');
      } else if (body.message) {
        reason = body.message;
      }
    } catch {
      reason = await res.text();
    }
    throw new Error(`Impossible de charger le menu (${res.status})${reason ? `: ${reason}` : ''}`);
  }
  return (await res.json()) as MenuResponse;
}

export async function createOrder(slug: string, payload: OrderPayload) {
  const res = await fetch(`${API_URL}/public/establishments/${slug}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Création commande impossible');
  }

  return (await res.json()) as Order;
}

export async function getOrder(orderId: string) {
  const res = await fetch(`${API_URL}/public/orders/${orderId}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Commande introuvable');
  }
  return (await res.json()) as Order;
}

export async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error('Login invalide');
  }
  return (await res.json()) as {
    token: string;
    admin: { establishmentId: string; email: string; establishmentName: string };
  };
}

export async function getAdminOrders(token: string) {
  const res = await fetch(`${API_URL}/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) {
    let reason = '';
    try {
      const body = (await res.json()) as { message?: string | string[] };
      reason = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? '');
    } catch {
      reason = await res.text();
    }
    throw new Error(`Erreur récupération commandes (${res.status})${reason ? `: ${reason}` : ''}`);
  }
  return (await res.json()) as Order[];
}

export async function updateOrderStatus(token: string, orderId: string, status: OrderStatus, seen = true) {
  const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status, seen })
  });

  if (!res.ok) {
    throw new Error('Erreur update statut');
  }

  return (await res.json()) as Order;
}

export function getRealtimeUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:4000';
}
