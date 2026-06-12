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

const registerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().min(1, "Phone number is required"),
  vatNumber: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export function RegisterForm() {
  const { registerVendor, isLoading, error } = useAuthStore()
  const [success, setSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: standardSchemaResolver(registerSchema),
  })

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      await registerVendor({
        email: data.email,
        password: data.password,
        company_name: data.companyName,
        phone: data.phone,
        first_name: data.firstName,
        last_name: data.lastName,
        vat_number: data.vatNumber,
      })
      setSuccess(true)
    } catch {
      // Error handled by AuthStore
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Application submitted</h1>
          <p className="mt-1.5 text-base text-slate-500">
            Your vendor application has been submitted. Our team will review it and get back to you.
          </p>
        </div>
        <Button className="h-10 w-full bg-orange-600 text-base text-white shadow-sm hover:bg-orange-500" asChild>
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Apply as a vendor</h1>
        <p className="mt-1.5 text-base text-slate-500">Submit your application to become a vendor.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company name</Label>
          <Input id="companyName" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("companyName")} />
          {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone</Label>
            <Input id="phone" type="tel" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("phone")} />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="vatNumber" className="text-sm font-medium text-slate-700">VAT number (optional)</Label>
            <Input id="vatNumber" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("vatNumber")} />
            {errors.vatNumber && <p className="text-sm text-red-500">{errors.vatNumber.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First name</Label>
            <Input id="firstName" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("firstName")} />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last name</Label>
            <Input id="lastName" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("lastName")} />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
          <Input id="password" type="password" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("password")} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm password</Label>
          <Input id="confirmPassword" type="password" className="h-10 border-slate-200 text-base focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          className="h-10 w-full bg-orange-600 text-base text-white shadow-sm hover:bg-orange-500"
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit application"}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-orange-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
