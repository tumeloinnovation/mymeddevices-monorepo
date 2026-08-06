import { OrdersList } from '../../_components/OrdersList';
import { Clock } from 'lucide-react';

export default function PendingOrdersPage() {
  return (
    <OrdersList
      statusFilter="pending"
      title="Pending Orders"
      description="Orders awaiting payment confirmation."
    />
  );
}
