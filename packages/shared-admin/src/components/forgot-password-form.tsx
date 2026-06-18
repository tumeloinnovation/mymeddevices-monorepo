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
import { Mail, Loader2, KeyRound } from "lucide-react"

export type DashboardTheme = "admin" | "vendor"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

interface ForgotPasswordFormProps {
  theme?: DashboardTheme
}

const THEME_COLORS: Record<
  DashboardTheme,
  {
    button: string
    hover: string
    accent: string
    link: string
    icon: React.ReactNode
    iconBgClass: string
  }
> = {
  admin: {
    button: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25",
    hover: "",
    accent: "focus-visible:ring-blue-500/20",
    link: "text-blue-600 hover:text-blue-700",
    icon: <KeyRound className="h-7 w-7 text-white" />,
    iconBgClass: "bg-blue-600 shadow-lg shadow-blue-600/25",
  },
  vendor: {
    button: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25",
    hover: "",
    accent: "focus-visible:ring-orange-500/20",
    link: "text-orange-600 hover:text-orange-700",
    icon: <KeyRound className="h-7 w-7 text-white" />,
    iconBgClass: "bg-orange-600 shadow-lg shadow-orange-600/25",
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
      <div className="w-full max-w-md mx-auto text-center lg:text-left">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 ${colors.iconBgClass} rounded-2xl mb-6`}>
            {colors.icon}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Check your email</h1>
          <p className="mt-2 text-base text-slate-500">We&apos;ve sent password reset instructions to your email.</p>
        </div>
        <Button variant="outline" className="h-12 w-full rounded-xl text-base" asChild>
          <Link href="/login">Back to login</Link>
        </Button>
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            &copy; {new Date().getFullYear()} MyMedDevices. All rights reserved.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-transparent">
        <div className="mb-8 text-center lg:text-left">
          <div className={`inline-flex items-center justify-center w-14 h-14 ${colors.iconBgClass} rounded-2xl mb-6`}>
            {colors.icon}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Forgot password?</h1>
          <p className="mt-2 text-base text-slate-500">
            Enter your email and we&apos;ll send you instructions to reset your password.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={`pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base transition-all focus-visible:ring-2 ${colors.accent}`}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <Button
            type="submit"
            className={`h-12 w-full rounded-xl text-base font-semibold shadow-lg transition-all active:scale-[0.98] ${colors.button}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className={`text-sm text-slate-400 underline-offset-4 ${colors.link} hover:underline`}>
            Back to login
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-450 leading-relaxed">
            &copy; {new Date().getFullYear()} MyMedDevices. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
