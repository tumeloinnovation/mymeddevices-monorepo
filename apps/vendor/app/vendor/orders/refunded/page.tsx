import { OrdersList } from '../_components/OrdersList';
import { RefreshCw } from 'lucide-react';

export default function RefundedOrdersPage() {
  return (
    <OrdersList
      statusFilter="refunded"
      title="Refunded Orders"
      description="Orders that have been refunded."
    />
  );
}
