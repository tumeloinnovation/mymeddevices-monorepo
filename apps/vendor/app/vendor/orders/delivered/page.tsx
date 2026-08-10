import { OrdersList } from '../_components/OrdersList';
import { PackageCheck } from 'lucide-react';

export default function DeliveredOrdersPage() {
  return (
    <OrdersList
      statusFilter="delivered"
      title="Delivered Orders"
      description="Orders successfully delivered to customers."
    />
  );
}
