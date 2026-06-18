import { OrderTimeline, TimelineItem } from "@/components/common/order-timeline"

const mockTrackingData: TimelineItem[] = [
  { id: "1", title: "Order Placed", date: "2026-06-15 10:00", status: "pending" },
  { id: "2", title: "Order Shipped", date: "2026-06-16 14:00", status: "shipped" },
  { id: "3", title: "Out for Delivery", date: "2026-06-17 09:00", status: "in-transit" },
]

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Order Tracking</h1>
      <p className="text-muted-foreground">Track your active orders and deliveries.</p>
      
      <div className="p-8 border rounded-lg bg-background">
        <h2 className="text-xl font-semibold mb-4">Order #12345</h2>
        <OrderTimeline items={mockTrackingData} />
      </div>
    </div>
  )
}
