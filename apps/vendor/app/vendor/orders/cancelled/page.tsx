import { OrdersList } from '../../_components/OrdersList';
import { Ban } from 'lucide-react';

export default function CancelledOrdersPage() {
  return (
    <OrdersList
      statusFilter="cancelled"
      title="Cancelled Orders"
      description="Orders that have been cancelled."
    />
  );
}
