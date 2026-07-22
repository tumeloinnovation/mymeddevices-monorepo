"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export function ForgotPasswordForm() {
  const { forgotPassword, isLoading, error } = useAuthStore()
  const [email, setEmail] = useState("")
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: standardSchemaResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    try {
      await forgotPassword(data.email)
      setEmail(data.email)
      // Redirect to reset password page with email pre-filled and step hint
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}&step=otp`)
    } catch {
      // Error handled by AuthStore
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you instructions to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset instructions"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
