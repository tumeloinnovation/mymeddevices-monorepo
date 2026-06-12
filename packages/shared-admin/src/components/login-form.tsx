"use client"

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
  }
> = {
  admin: {
    title: "Welcome back",
    description: "Sign in to your admin account",
    primaryClass: "bg-blue-600",
    hoverClass: "hover:bg-blue-500",
    accentClass: "focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
    linkHoverClass: "hover:text-blue-600",
    registerText: "",
    registerHref: "",
  },
  vendor: {
    title: "Vendor Login",
    description: "Sign in to manage your vendor account",
    primaryClass: "bg-orange-600",
    hoverClass: "hover:bg-orange-500",
    accentClass: "focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
    linkHoverClass: "hover:text-orange-600",
    registerText: "Apply as a vendor",
    registerHref: "/register",
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
  const { login, isLoading, error } = useAuthStore()
  const { setAuthCookie } = useAuthCookie()
  const router = useRouter()
  const config = THEME_CONFIG[theme]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: standardSchemaResolver(loginSchema),
  })

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login({ email: data.email, password: data.password, rememberMe: data.rememberMe }, theme)
      setAuthCookie("1")
      router.push("/dashboard")
    } catch {
      // Error handled by AuthStore
    }
  }

  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayRegisterText = registerText || config.registerText
  const displayRegisterHref = registerHref || config.registerHref

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
        <img src="/logo.png" alt="MyMedDevices" className="h-10 w-auto" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{displayTitle}</h1>
          <p className="mt-1.5 text-base text-slate-500">{displayDescription}</p>
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
              className={`h-10 border-slate-200 text-base transition-colors ${config.accentClass}`}
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className={`text-sm text-slate-400 underline-offset-4 transition-colors ${config.linkHoverClass} hover:underline`}
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`h-10 border-slate-200 text-base transition-colors ${config.accentClass}`}
              {...register("password")}
            />
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className={`h-10 w-full ${config.primaryClass} text-base text-white shadow-sm transition-all ${config.hoverClass} active:scale-[0.99]`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Logging in…
              </span>
            ) : (
              "Login"
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

        <p className="mt-6 text-center text-sm text-slate-400">
          By continuing, you agree to our{" "}
          <Link href="/privacy" className={`underline underline-offset-4 ${config.linkHoverClass}`}>
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className={`underline underline-offset-4 ${config.linkHoverClass}`}>
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  )
}
