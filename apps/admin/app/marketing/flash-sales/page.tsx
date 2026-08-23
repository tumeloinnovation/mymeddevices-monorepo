"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Zap, Plus, Trash2, Power, RefreshCw } from "lucide-react"
import { adminService, type Promotion } from "@mymeddevices/shared-core"

export default function FlashSalesPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDiscount, setNewDiscount] = useState("30")
  const [newBadge, setNewBadge] = useState("FLASH DEAL")
  const [newBannerText, setNewBannerText] = useState("")

  const { data: promotions, isLoading } = useQuery<Promotion[]>({
    queryKey: ["admin", "promotions", "flash_sale"],
    queryFn: () => adminService.getPromotions({ promotion_type: "flash_sale" }),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Promotion>) => adminService.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] })
      setIsCreating(false)
      setNewTitle("")
      setNewDiscount("30")
      setNewBannerText("")
      toast.success("Flash sale event activated")
    },
    onError: (err: any) => toast.error(err.message || "Failed to create flash sale"),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminService.togglePromotionStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] })
      toast.success("Flash sale status updated")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] })
      toast.success("Flash sale removed")
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: newTitle,
      promotion_type: "flash_sale",
      discount_value: parseFloat(newDiscount) || 0,
      badge_text: newBadge,
      banner_text: newBannerText || undefined,
      is_active: true,
      priority: 10,
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl pb-12">
        <div className="flex items-center justify-between">
          <SettingsHeader
            title="Flash Sales & Limited Deals"
            description="High-urgency timed medical equipment clearance promotions"
          />
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="text-xs font-semibold uppercase tracking-wider gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? "Cancel" : "Launch Flash Sale"}
          </Button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="border-2 border-amber-500 bg-white dark:bg-zinc-950 p-5 mb-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Zap className="w-4 h-4 text-amber-500" /> New Flash Sale Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Flash Sale Title</label>
                <Input
                  type="text"
                  placeholder="e.g. 48-Hour Critical Care Clearance"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Badge Tag</label>
                <Input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Flash Discount (%)</label>
                <Input
                  type="number"
                  step="1"
                  min="5"
                  max="95"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Header Ticker Announcement</label>
                <Input
                  type="text"
                  placeholder="e.g. ⚡ FLASH SALE: Up to 35% off hospital monitors while stock lasts!"
                  value={newBannerText}
                  onChange={(e) => setNewBannerText(e.target.value)}
                  className="rounded-none border-2 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="text-xs">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="text-xs font-bold uppercase bg-amber-600 text-white hover:bg-amber-700">
                {createMutation.isPending ? "Launching..." : "Publish Flash Sale"}
              </Button>
            </div>
          </form>
        )}

        <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
              Active Flash Sales ({promotions?.length || 0})
            </h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading flash sales...
            </div>
          ) : !promotions || promotions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-mono">
              No active flash sale events. Click &apos;Launch Flash Sale&apos; to schedule one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableHead className="text-xs font-semibold">Event Name</TableHead>
                  <TableHead className="text-xs font-semibold">Badge</TableHead>
                  <TableHead className="text-xs font-semibold">Discount</TableHead>
                  <TableHead className="text-xs font-semibold">Banner Message</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((p) => (
                  <TableRow key={p.id} className="border-zinc-100 dark:border-zinc-900 text-xs">
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">{p.title}</TableCell>
                    <TableCell>
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold rounded">
                        {p.badge_text || "FLASH"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-rose-600">{p.discount_value}% OFF</TableCell>
                    <TableCell className="text-zinc-500 truncate max-w-xs">{p.banner_text || "—"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
                        p.is_active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40" 
                          : "bg-zinc-100 text-zinc-500 border-zinc-300"
                      }`}>
                        {p.is_active ? "Live" : "Ended"}
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
                        {p.is_active ? "Stop" : "Resume"}
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
