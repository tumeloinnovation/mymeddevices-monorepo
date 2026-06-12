"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useState } from "react"

export type DashboardTheme = "admin" | "vendor"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

interface ForgotPasswordFormProps {
  theme?: DashboardTheme
}

const THEME_COLORS: Record<DashboardTheme, { button: string; hover: string; accent: string; link: string }> = {
  admin: {
    button: "bg-blue-600",
    hover: "hover:bg-blue-500",
    accent: "focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
    link: "hover:text-blue-600",
  },
  vendor: {
    button: "bg-orange-600",
    hover: "hover:bg-orange-500",
    accent: "focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
    link: "hover:text-orange-600",
  },
}

export function ForgotPasswordForm({ theme = "admin" }: ForgotPasswordFormProps) {
  const { forgotPassword, isLoading, error } = useAuthStore()
  const [success, setSuccess] = useState(false)
  const colors = THEME_COLORS[theme]
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
      setSuccess(true)
    } catch {
      // Error handled by AuthStore
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Check your email</h1>
          <p className="mt-1.5 text-base text-slate-500">We&apos;ve sent password reset instructions to your email.</p>
        </div>
        <Button variant="outline" className="h-10 w-full text-base" asChild>
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Forgot password?</h1>
        <p className="mt-1.5 text-base text-slate-500">
          Enter your email and we&apos;ll send you instructions to reset your password.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            className={`h-10 border-slate-200 text-base ${colors.accent}`}
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          className={`h-10 w-full ${colors.button} text-base text-white shadow-sm ${colors.hover}`}
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send reset instructions"}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Link href="/login" className={`text-sm text-slate-400 underline-offset-4 ${colors.link} hover:underline`}>
          Back to login
        </Link>
      </div>
    </div>
  )
}
