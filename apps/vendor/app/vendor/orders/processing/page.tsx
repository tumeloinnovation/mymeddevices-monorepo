import { OrdersList } from '../_components/OrdersList';
import { Filter } from 'lucide-react';

export default function ProcessingOrdersPage() {
  return (
    <OrdersList
      statusFilter="processing"
      title="Processing Orders"
      description="Orders currently being prepared for shipment."
    />
  );
}
