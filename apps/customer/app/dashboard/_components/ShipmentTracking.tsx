'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, PackageCheck, Package, MapPin } from 'lucide-react'

interface TrackingEvent {
  status: string
  timestamp: string
  location?: string
}

interface ShipmentTrackingProps {
  trackingNumber: string
  carrier: string
  status: string
  estimatedDelivery?: string
  events: TrackingEvent[]
  statusLabel?: string
}

const trackingStatusConfig: Record<string, { label: string; color: string }> = {
  picked_up: { label: 'Picked Up', color: 'bg-blue-100 text-blue-700' },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-700' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-yellow-100 text-yellow-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  exception: { label: 'Exception', color: 'bg-red-100 text-red-700' },
}

const statusIcons: Record<string, typeof Truck> = {
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: PackageCheck,
  exception: Package,
}

export default function ShipmentTracking({
  trackingNumber,
  carrier,
  status,
  estimatedDelivery,
  events,
  statusLabel,
}: ShipmentTrackingProps) {
  const statusConfig = trackingStatusConfig[status] || {
    label: statusLabel || status,
    color: 'bg-gray-100 text-gray-700',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4" />
          Shipment Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Carrier</p>
            <p className="text-sm font-medium">{carrier}</p>
          </div>
          <Badge className={`${statusConfig.color} text-xs`}>
            {statusConfig.label}
          </Badge>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Tracking Number</p>
          <p className="text-sm font-mono font-medium">{trackingNumber}</p>
        </div>

        {estimatedDelivery && (
          <div>
            <p className="text-xs text-muted-foreground">Estimated Delivery</p>
            <p className="text-sm font-medium">
              {new Date(estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {events.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Tracking History</p>
            <div className="space-y-3">
              {events.map((event, index) => {
                const EventIcon = statusIcons[event.status] || Package
                const isLatest = index === 0

                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          isLatest
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <EventIcon className="h-3 w-3" />
                      </div>
                      {index < events.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isLatest ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {trackingStatusConfig[event.status]?.label || event.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {event.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
