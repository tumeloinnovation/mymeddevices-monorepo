import { OrdersList } from '../../_components/OrdersList';
import { CreditCard } from 'lucide-react';

export default function PaidOrdersPage() {
  return (
    <OrdersList
      statusFilter="paid"
      title="Paid Orders"
      description="Paid orders ready for processing."
    />
  );
}
