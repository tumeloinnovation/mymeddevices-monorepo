"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore, useAuthCookie } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, Store } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

export type DashboardTheme = "admin" | "vendor"

interface LoginFormProps {
  theme?: DashboardTheme
  title?: string
  description?: string
  showRegisterLink?: boolean
  registerText?: string
  registerHref?: string
}

const THEME_CONFIG: Record<
  DashboardTheme,
  {
    title: string
    description: string
    primaryClass: string
    hoverClass: string
    accentClass: string
    linkHoverClass: string
    registerText: string
    registerHref: string
    icon: React.ReactNode
    iconBgClass: string
  }
> = {
  admin: {
    title: "Welcome back",
    description: "Sign in to your admin account",
    primaryClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25",
    hoverClass: "",
    accentClass: "focus-visible:ring-blue-500/20",
    linkHoverClass: "text-blue-600 hover:text-blue-700",
    registerText: "",
    registerHref: "",
    icon: <Shield className="h-7 w-7 text-white" />,
    iconBgClass: "bg-blue-600 shadow-lg shadow-blue-600/25",
  },
  vendor: {
    title: "Vendor Login",
    description: "Sign in to manage your vendor account",
    primaryClass: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25",
    hoverClass: "",
    accentClass: "focus-visible:ring-orange-500/20",
    linkHoverClass: "text-orange-600 hover:text-orange-700",
    registerText: "Apply as a vendor",
    registerHref: "/register",
    icon: <Store className="h-7 w-7 text-white" />,
    iconBgClass: "bg-orange-600 shadow-lg shadow-orange-600/25",
  },
}

export function LoginForm({
  theme = "admin",
  title,
  description,
  showRegisterLink = false,
  registerText,
  registerHref,
}: LoginFormProps) {
  const { login, isLoading, error, getDashboardRoute } = useAuthStore()
  const { setAuthCookie } = useAuthCookie()
  const router = useRouter()
  const config = THEME_CONFIG[theme]
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: standardSchemaResolver(loginSchema),
  })

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      if (process.env.NODE_ENV === "development") {
        sessionStorage.removeItem("dev_logged_out")
      }
      await login({ email: data.email, password: data.password, rememberMe: data.rememberMe }, theme)
      setAuthCookie("1")
      router.push(getDashboardRoute())
    } catch {
      // Error handled by AuthStore
    }
  }


  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayRegisterText = registerText || config.registerText
  const displayRegisterHref = registerHref || config.registerHref

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
        <img src="/logo.png" alt="MyMedDevices" className="h-10 w-auto" />
      </div>
      <div className="bg-transparent">
        <div className="mb-8 text-center lg:text-left">
          <div className={`inline-flex items-center justify-center w-14 h-14 ${config.iconBgClass} rounded-2xl mb-6`}>
            {config.icon}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{displayTitle}</h1>
          <p className="mt-2 text-base text-slate-500">{displayDescription}</p>
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
                className={`pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base transition-all focus-visible:ring-2 ${config.accentClass}`}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className={`text-sm text-slate-450 hover:text-slate-655 transition-colors font-medium ${config.linkHoverClass}`}
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`pl-11 pr-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base transition-all focus-visible:ring-2 ${config.accentClass}`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              className={`size-4 rounded border-slate-300 accent-${theme === "admin" ? "blue" : "orange"}-600`}
              {...register("rememberMe")}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-slate-400">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            className={`h-12 w-full rounded-xl text-base font-semibold shadow-lg transition-all active:scale-[0.98] ${config.primaryClass}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {(showRegisterLink || displayRegisterText) && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-slate-400">
                Or
              </span>
            </div>
            <Button
              variant="outline"
              className={`h-10 w-full border-slate-200 text-base text-slate-700 transition-colors hover:border-${theme === "admin" ? "blue" : "orange"}-300 hover:bg-${theme === "admin" ? "blue" : "orange"}-50 hover:text-${theme === "admin" ? "blue" : "orange"}-700`}
              asChild
            >
              <Link href={displayRegisterHref}>{displayRegisterText}</Link>
            </Button>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            &copy; {new Date().getFullYear()} MyMedDevices. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
