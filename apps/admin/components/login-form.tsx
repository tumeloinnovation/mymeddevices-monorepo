"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore, useAuthCookie } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

export function LoginForm() {
  const { login, isLoading, error } = useAuthStore()
  const { setAuthCookie } = useAuthCookie()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: standardSchemaResolver(loginSchema),
  })

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login({ email: data.email, password: data.password, rememberMe: data.rememberMe }, "admin")
      setAuthCookie("1")
      router.push("/dashboard")
    } catch {
      // Error handled by AuthStore
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
        <img src="/logo.png" alt="MyMedDevices" className="h-10 w-auto" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-base text-slate-500">Sign in to your admin account</p>
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
              className="h-10 border-slate-200 text-base transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                className="text-sm text-slate-400 underline-offset-4 transition-colors hover:text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-10 border-slate-200 text-base transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              className="size-4 rounded border-slate-300 accent-blue-600"
              {...register("rememberMe")}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-slate-400">
              Remember me
            </Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="h-10 w-full bg-blue-600 text-base text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.99]"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          By continuing, you agree to our{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-blue-600">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-blue-600">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  )
}
