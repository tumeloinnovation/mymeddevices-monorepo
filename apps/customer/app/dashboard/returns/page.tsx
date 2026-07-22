"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PackageIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
} from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { customerReturnsApi, type ReturnRequest as ApiReturnRequest } from "@/lib/api/endpoints/returns"
import { orderService, type Order } from "@mymeddevices/core/lib/services/order-service"
import { toast } from "sonner"

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
    case "refund_requested":
      return <AlertCircleIcon className="size-4 text-yellow-600" />
    case "approved":
      return <CheckCircleIcon className="size-4 text-green-600" />
    case "rejected":
      return <XCircleIcon className="size-4 text-red-600" />
    case "completed":
    case "refunded":
      return <RefreshCwIcon className="size-4 text-blue-600" />
    default:
      return <AlertCircleIcon className="size-4 text-gray-400" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
    case "refund_requested":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "completed":
    case "refunded":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function ReturnRequestCard({ returnRequest }: { returnRequest: ApiReturnRequest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{returnRequest.return_number}</CardTitle>
              <CardDescription>Order #{returnRequest.order_id.slice(0, 8)}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(returnRequest.status)}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(returnRequest.status)}`}
              >
                {returnRequest.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Items:</span>{" "}
              {returnRequest.items?.map((item) => item.product_name).join(", ") || "N/A"}
            </div>
            <div>
              <span className="font-medium">Reason:</span> {returnRequest.reason}
            </div>
            <div>
              <span className="font-medium">Requested:</span>{" "}
              {formatDate(returnRequest.created_at)}
            </div>
            {returnRequest.resolved_at && (
              <div>
                <span className="font-medium">Updated:</span>{" "}
                {formatDate(returnRequest.resolved_at)}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {returnRequest.status === "approved" && (
              <Button variant="outline" size="sm">
                Print Return Label
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function NewReturnDialog() {
  const [open, setOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [reason, setReason] = useState("")

  const queryClient = useQueryClient()

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.getOrders({ page: 1, limit: 50 }),
  })

  const orders = ordersData?.items || []

  const { data: selectedOrder } = useQuery({
    queryKey: ["order", selectedOrderId],
    queryFn: () => orderService.getOrder(selectedOrderId),
    enabled: !!selectedOrderId,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const items = (selectedOrder?.items || []).map((item) => ({
        order_item_id: String(item.id),
        product_id: String(item.product_id),
        product_name: item.product_name,
        quantity: item.quantity,
        reason: reason,
        condition: "new",
      }))

      return customerReturnsApi.create({
        order_id: selectedOrderId,
        reason: reason,
        items,
      })
    },
    onSuccess: () => {
      toast.success("Return request created successfully")
      setOpen(false)
      setSelectedOrderId("")
      setReason("")
      queryClient.invalidateQueries({ queryKey: ["returns"] })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4 mr-2" />
          Request Return
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request a Return</DialogTitle>
          <DialogDescription>
            Select an order and items you want to return
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="order">Order</Label>
            {ordersLoading ? (
              <div className="text-sm text-muted-foreground">Loading orders...</div>
            ) : (
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order: Order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number || order.id.slice(0, 8)} — {formatDate(order.created_at)} ({order.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {orders.length === 0 && !ordersLoading && (
              <p className="text-xs text-muted-foreground">No orders found</p>
            )}
          </div>

          {selectedOrder && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label>Items in Order</Label>
              <ul className="text-sm space-y-1">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span className="text-muted-foreground">
                      {(parseFloat(item.unit_price || "0") * item.quantity).toFixed(2)} KES
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Return</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defective">Defective product</SelectItem>
                <SelectItem value="wrong-item">Wrong item received</SelectItem>
                <SelectItem value="not-as-described">Not as described</SelectItem>
                <SelectItem value="no-longer-needed">No longer needed</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !selectedOrderId || !reason}
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ReturnsPage() {
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ["returns"],
    queryFn: () => customerReturnsApi.getMyReturns(),
  })

  const returns = returnsData?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Returns & Exchanges</h1>
          <p className="text-muted-foreground mt-2">
            Manage your return requests
          </p>
        </div>
        <NewReturnDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Return Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You can return most items within 30 days of delivery</p>
            <p>• Items must be in original condition and unused</p>
            <p>
              • Refunds are processed within 5-7 business days after we receive
              your return
            </p>
            <p>
              • Certain items (personal care products) cannot be returned for
              hygiene reasons
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading return requests...
        </div>
      ) : returns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <PackageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No return requests yet</p>
            <p className="text-sm mt-1">Your return history will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {returns.map((returnRequest) => (
            <ReturnRequestCard key={returnRequest.id} returnRequest={returnRequest} />
          ))}
        </div>
      )}
    </div>
  )
}
