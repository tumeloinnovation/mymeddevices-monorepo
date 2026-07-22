"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

export function LoginForm() {
  const { login, isLoading, error, getDashboardRoute } = useAuthStore()
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
      await login({ email: data.email, password: data.password, rememberMe: data.rememberMe })

      // Note: Guest cart merge is handled by AuthCartSync component

      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get('returnUrl');
      router.push(returnUrl || getDashboardRoute());
    } catch {
      // Error handled by AuthStore
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-center gap-3">
        <img src="/logo.png" alt="MyMedDevices" className="h-12 w-auto" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-base text-slate-500">Sign in to your account</p>
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
              className="h-10 border-slate-200 text-base transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                className="text-sm text-slate-400 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-10 border-slate-200 text-base transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              className="size-4 rounded border-slate-300 accent-primary"
              {...register("rememberMe")}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-slate-400">
              Remember me
            </Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="h-10 w-full bg-primary text-base text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99]"
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

        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-slate-400">
              Or
            </span>
          </div>
          <Button
            variant="outline"
            className="h-10 w-full border-slate-200 text-base text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5"
            asChild
          >
            <Link href="/register">Create an account</Link>
          </Button>
          <p className="text-center text-sm text-slate-400">
            By continuing, you agree to our{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
