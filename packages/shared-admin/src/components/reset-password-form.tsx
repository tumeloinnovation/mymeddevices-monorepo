"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import { KeyRound, Loader2, CheckCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export type DashboardTheme = "admin" | "vendor"

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

interface ResetPasswordFormProps {
  theme?: DashboardTheme
}

const THEME_COLORS: Record<
  DashboardTheme,
  {
    button: string
    accent: string
    iconBgClass: string
  }
> = {
  admin: {
    button: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25",
    accent: "focus-visible:ring-blue-500/20",
    iconBgClass: "bg-blue-600 shadow-lg shadow-blue-600/25",
  },
  vendor: {
    button: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25",
    accent: "focus-visible:ring-emerald-500/20",
    iconBgClass: "bg-emerald-600 shadow-lg shadow-emerald-600/25",
  },
}

export function ResetPasswordForm({ theme = "admin" }: ResetPasswordFormProps) {
  const { resetPassword, isLoading, error } = useAuthStore()
  const [success, setSuccess] = useState(false)
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const email = searchParams.get("email")
  const code = searchParams.get("code")

  const colors = THEME_COLORS[theme]
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: standardSchemaResolver(resetPasswordSchema),
  })

  useEffect(() => {
    if (!email || !code) {
        // In a real app we might redirect or show an error
    }
  }, [email, code])

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    if (!email || !code || localIsSubmitting) return
    setLocalIsSubmitting(true)
    try {
      await resetPassword(code, data.password, email)
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch {
      // Error handled by AuthStore
    } finally {
      setLocalIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center lg:text-left">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 bg-green-600 shadow-lg shadow-green-600/25 rounded-2xl mb-6`}>
            <CheckCircle className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Password reset!</h1>
          <p className="mt-2 text-base text-slate-500">Your password has been successfully reset. Redirecting to login...</p>
        </div>
        <Button className={`h-12 w-full rounded-xl text-base ${colors.button}`} asChild>
          <Link href="/login">Go to login now</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-transparent">
        <div className="mb-8 text-center lg:text-left">
          <div className={`inline-flex items-center justify-center w-14 h-14 ${colors.iconBgClass} rounded-2xl mb-6`}>
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reset password</h1>
          <p className="mt-2 text-base text-slate-500">
            Enter your new password below to regain access to your account.
          </p>
        </div>
        
        {(!email || !code) && (
             <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
             Invalid or missing reset parameters. Please check your email link.
           </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              className={`h-12 rounded-xl ${colors.accent}`}
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className={`h-12 rounded-xl ${colors.accent}`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <Button
            type="submit"
            className={`h-12 w-full rounded-xl text-base font-semibold transition-all active:scale-[0.98] ${colors.button}`}
            disabled={isLoading || localIsSubmitting || !email || !code}
          >
            {isLoading || localIsSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
