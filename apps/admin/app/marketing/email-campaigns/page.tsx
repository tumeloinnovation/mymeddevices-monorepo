"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Mail, Send, Plus, Trash2, RefreshCw } from "lucide-react"
import { adminService, type EmailCampaign } from "@mymeddevices/shared-core"

export default function EmailCampaignsPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newPreview, setNewPreview] = useState("")
  const [newHtml, setNewHtml] = useState("")
  const [targetAudience, setTargetAudience] = useState("all")

  const { data: campaigns, isLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["admin", "marketing", "email"],
    queryFn: () => adminService.getEmailCampaigns(),
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string; subject: string; preview_text?: string; html_content: string; target_audience: string }) => 
      adminService.createEmailCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "marketing", "email"] })
      setIsCreating(false)
      setNewTitle("")
      setNewSubject("")
      setNewPreview("")
      setNewHtml("")
      toast.success("Email campaign draft saved")
    },
    onError: (err: any) => toast.error(err.message || "Failed to create campaign"),
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => adminService.sendEmailCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "marketing", "email"] })
      toast.success("Email blast dispatched via SMTP relay")
    },
    onError: (err: any) => toast.error(err.message || "Failed to send email blast"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteEmailCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "marketing", "email"] })
      toast.success("Campaign deleted")
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: newTitle,
      subject: newSubject,
      preview_text: newPreview || undefined,
      html_content: newHtml,
      target_audience: targetAudience,
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl pb-12">
        <div className="flex items-center justify-between">
          <SettingsHeader
            title="Email Marketing & Newsletters"
            description="Broadcast transactional and marketing updates rendered via MJML responsive templates"
          />
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="text-xs font-semibold uppercase tracking-wider gap-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? "Cancel" : "New Email Campaign"}
          </Button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-950 p-5 mb-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" /> New Email Blast Composition
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Internal Reference Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Q3 Clinical Technology Spotlight"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Target Segment</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full h-9 rounded-none border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-mono focus:outline-none"
                >
                  <option value="all">All Registered Customers & Clinics</option>
                  <option value="customers">Verified Clinics & Hospital Buyers</option>
                  <option value="vendors">Certified Medical Equipment Vendors</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Email Subject Line</label>
                <Input
                  type="text"
                  placeholder="e.g. Upgrade your clinic: Diagnostic & Imaging Devices in stock"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="rounded-none border-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Inbox Preview Preheader</label>
                <Input
                  type="text"
                  placeholder="e.g. Browse PPB-certified autoclaves and monitors."
                  value={newPreview}
                  onChange={(e) => setNewPreview(e.target.value)}
                  className="rounded-none border-2 text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase font-medium text-zinc-500 mb-1">Email Body HTML / MJML Content</label>
                <textarea
                  rows={6}
                  placeholder="<h2>Clinical Spotlight</h2><p>Dear Partner, explore the latest high-frequency surgical generators...</p>"
                  value={newHtml}
                  onChange={(e) => setNewHtml(e.target.value)}
                  className="w-full p-2.5 rounded-none border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="text-xs">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="text-xs font-bold uppercase bg-zinc-900 text-white">
                {createMutation.isPending ? "Saving..." : "Save Campaign Draft"}
              </Button>
            </div>
          </form>
        )}

        <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
              Email Campaigns ({campaigns?.length || 0})
            </h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading email campaigns...
            </div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-mono">
              No email campaigns created yet. Click &apos;New Email Campaign&apos; to compose one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 dark:border-zinc-800">
                  <TableHead className="text-xs font-semibold">Subject & Title</TableHead>
                  <TableHead className="text-xs font-semibold">Target Audience</TableHead>
                  <TableHead className="text-xs font-semibold">Recipients</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id} className="border-zinc-100 dark:border-zinc-900 text-xs">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.subject}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{c.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono uppercase text-zinc-600 dark:text-zinc-300">{c.target_audience}</TableCell>
                    <TableCell className="font-mono">{c.recipient_count} recipients</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
                        c.status === "sent" ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40" :
                        c.status === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-300" :
                        "bg-zinc-100 text-zinc-600 border-zinc-300"
                      }`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4 space-x-2">
                      {c.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendMutation.mutate(c.id)}
                          disabled={sendMutation.isPending}
                          className="h-7 text-[11px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        >
                          <Send className="w-3 h-3" />
                          Send Blast
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(c.id)}
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
