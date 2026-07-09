"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Mail, Loader2, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"

export type DashboardTheme = "admin" | "vendor"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

interface ForgotPasswordFormProps {
  theme?: DashboardTheme
  onBackToLogin?: () => void
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
    button: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25",
    hover: "",
    accent: "focus-visible:ring-emerald-500/20",
    link: "text-emerald-600 hover:text-emerald-700",
    icon: <KeyRound className="h-7 w-7 text-white" />,
    iconBgClass: "bg-emerald-600 shadow-lg shadow-emerald-600/25",
  },
}

export function ForgotPasswordForm({ theme = "admin", onBackToLogin }: ForgotPasswordFormProps) {
  const { forgotPassword, verifyOTP, isLoading, error: authError } = useAuthStore()
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  
  const router = useRouter()
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
      setEmail(data.email)
      setSuccess(true)
    } catch {
      // Error handled by AuthStore
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError(null)
    setVerifyingOtp(true)
    // We no longer verify OTP here to avoid consuming it before the reset password action.
    // The reset-password action will verify the OTP.
    router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(otpCode)}`)
    setVerifyingOtp(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center lg:text-left">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 ${colors.iconBgClass} rounded-2xl mb-6`}>
            {colors.icon}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Check your email</h1>
          <p className="mt-2 text-base text-slate-500">We&apos;ve sent a password reset OTP to <strong>{email}</strong>. Please enter it below.</p>
        </div>
        
        <div className="flex flex-col gap-5">
            {otpError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {otpError}
                </div>
            )}
            <div className="flex flex-col gap-2">
                <Label htmlFor="otp" className="text-sm font-medium text-slate-700">
                Verification Code
                </Label>
                <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base transition-all focus-visible:ring-2 ${colors.accent}`}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                />
            </div>
            <Button
                onClick={handleVerifyOtp}
                className={`h-12 w-full rounded-xl text-base font-semibold shadow-lg transition-all active:scale-[0.98] ${colors.button}`}
                disabled={verifyingOtp || otpCode.length < 4}
            >
                {verifyingOtp ? (
                <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                </span>
                ) : (
                "Verify Code"
                )}
            </Button>
        </div>
        
        <div className="mt-6 text-center">
          {onBackToLogin ? (
            <button type="button" onClick={onBackToLogin} className={`text-sm underline-offset-4 ${colors.link} hover:underline cursor-pointer`}>
              Back to login
            </button>
          ) : (
            <Link href="/login" className={`text-sm underline-offset-4 ${colors.link} hover:underline`}>
              Back to login
            </Link>
          )}
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
          {authError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {authError}
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
          {onBackToLogin ? (
            <button type="button" onClick={onBackToLogin} className={`text-sm underline-offset-4 ${colors.link} hover:underline cursor-pointer`}>
              Back to login
            </button>
          ) : (
            <Link href="/login" className={`text-sm underline-offset-4 ${colors.link} hover:underline`}>
              Back to login
            </Link>
          )}
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
