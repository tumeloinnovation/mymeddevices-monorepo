"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Tag, Plus, Trash2, Power, RefreshCw } from "lucide-react"
import { adminService, type Promotion } from "@mymeddevices/shared-core"

export default function PromotionsPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCode, setNewCode] = useState("")
  const [newDiscount, setNewDiscount] = useState("10")
  const [newMinOrder, setNewMinOrder] = useState("5000")
  const [newBannerText, setNewBannerText] = useState("")

  const { data: promotions, isLoading } = useQuery<Promotion[]>({
    queryKey: ["admin", "promotions", "percentage"],
    queryFn: () => adminService.getPromotions({ promotion_type: "percentage" }),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Promotion>) => adminService.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] })
      setIsCreating(false)
      setNewTitle("")
      setNewCode("")
      setNewDiscount("10")
      setNewBannerText("")
      toast.success("Percentage promotion created successfully")
    },
    onError: (err: any) => toast.error(err.message || "Failed to create promotion"),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminService.togglePromotionStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] })
      toast.success("Promotion status updated")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] })
      toast.success("Promotion deleted")
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: newTitle,
      code: newCode ? newCode.toUpperCase() : undefined,
      promotion_type: "percentage",
      discount_value: parseFloat(newDiscount) || 0,
      min_order_amount: parseFloat(newMinOrder) || 0,
      banner_text: newBannerText || undefined,
      is_active: true,
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl pb-12">
        <div className="flex items-center justify-between">
          <SettingsHeader
            title="General Promotions & Discounts"
            description="Manage site-wide percentage discounts and campaign promo vouchers"
          />
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="text-xs font-semibold uppercase tracking-wider gap-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? "Cancel" : "New Promotion"}
          </Button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-950 p-5 mb-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" /> Create Percentage Discount Promotion
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Campaign Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Diagnostic Equipment Spring Sale"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Promo Code (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. SPRING20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Discount Value (%)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="90"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Minimum Order Amount (KES)</label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Banner Announcement Text</label>
                <Input
                  type="text"
                  placeholder="e.g. Special clinic discount: Get 20% off all medical tools this month!"
                  value={newBannerText}
                  onChange={(e) => setNewBannerText(e.target.value)}
                  className="rounded-none border-2 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="text-xs">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="text-xs font-bold uppercase bg-zinc-900 text-white">
                {createMutation.isPending ? "Creating..." : "Save & Activate Promotion"}
              </Button>
            </div>
          </form>
        )}

        <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
              Active Percentage Discounts ({promotions?.length || 0})
            </h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading promotions...
            </div>
          ) : !promotions || promotions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-mono">
              No promotions registered yet. Click &apos;New Promotion&apos; to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableHead className="text-xs font-semibold">Title</TableHead>
                  <TableHead className="text-xs font-semibold">Code</TableHead>
                  <TableHead className="text-xs font-semibold">Discount</TableHead>
                  <TableHead className="text-xs font-semibold">Min Order</TableHead>
                  <TableHead className="text-xs font-semibold">Redemptions</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((p) => (
                  <TableRow key={p.id} className="border-zinc-100 dark:border-zinc-900 text-xs">
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">{p.title}</TableCell>
                    <TableCell className="font-mono uppercase font-bold text-zinc-600 dark:text-zinc-300">{p.code || "AUTO-APPLIED"}</TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-600">{p.discount_value}% OFF</TableCell>
                    <TableCell className="font-mono">KES {p.min_order_amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{p.usage_count} uses</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
                        p.is_active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40" 
                          : "bg-zinc-100 text-zinc-500 border-zinc-300"
                      }`}>
                        {p.is_active ? "Active" : "Paused"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4 space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMutation.mutate(p.id)}
                        className="h-7 text-[11px] gap-1"
                      >
                        <Power className="w-3 h-3" />
                        {p.is_active ? "Pause" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="h-7 text-[11px] text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
