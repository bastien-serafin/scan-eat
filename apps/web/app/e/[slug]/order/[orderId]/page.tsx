import { OrderStatusLive } from '@/components/order-status-live';

export default function OrderPage({ params }: { params: { orderId: string } }) {
  return <OrderStatusLive orderId={params.orderId} />;
}
