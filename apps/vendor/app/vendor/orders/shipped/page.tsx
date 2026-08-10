import { OrdersList } from '../_components/OrdersList';
import { Truck } from 'lucide-react';

export default function ShippedOrdersPage() {
  return (
    <OrdersList
      statusFilter="shipped"
      title="Shipped Orders"
      description="Orders that have been shipped and are in transit."
    />
  );
}
