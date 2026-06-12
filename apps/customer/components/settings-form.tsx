"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export function SettingsForm() {
  const { changePassword, isLoading } = useAuthStore()
  const { register, handleSubmit, reset } = useForm<z.infer<typeof passwordSchema>>({
    resolver: standardSchemaResolver(passwordSchema),
  })

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await changePassword({ old_password: data.currentPassword, new_password: data.newPassword })
      reset()
      toast.success("Password changed successfully")
    } catch {
      toast.error("Failed to change password")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" {...register("currentPassword")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" {...register("newPassword")} />
          </div>
          <Button type="submit" disabled={isLoading}>Update Password</Button>
        </form>
      </CardContent>
    </Card>
  )
}
