import { CheckCircle2, Circle, Loader2 } from "lucide-react"

export type OrderStatus = "pending" | "shipped" | "in-transit" | "delivered" | "cancelled"

export interface TimelineItem {
  id: string
  title: string
  description?: string
  date: string
  status: OrderStatus
}

interface OrderTimelineProps {
  items: TimelineItem[]
}

export function OrderTimeline({ items }: OrderTimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.status === 'delivered' ? 'bg-green-500' : 'bg-primary'}`}>
               {item.status === 'delivered' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Loader2 className="w-4 h-4 text-white animate-spin" />}
            </div>
            {index < items.length - 1 && <div className="w-0.5 h-full bg-muted mt-2 mb-2" />}
          </div>
          <div>
            <p className="font-semibold">{item.title}</p>
            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
            <p className="text-xs text-muted-foreground">{item.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
