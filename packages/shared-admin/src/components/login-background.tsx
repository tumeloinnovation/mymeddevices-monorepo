"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

export type DashboardTheme = "admin" | "vendor" | "customer"

interface LoginBackgroundProps {
  children: ReactNode
  theme?: DashboardTheme
}

const adminShapes = [
  { className: "rounded-full bg-blue-400/10", w: 320, h: 320, x: -8, y: -12, d: 12, del: 0 },
  { className: "rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-indigo-400/10", w: 240, h: 240, x: 65, y: -8, d: 10, del: 1 },
  { className: "rounded-[30%_70%_50%_50%] bg-blue-300/10", w: 180, h: 180, x: 75, y: 55, d: 14, del: 2 },
  { className: "rotate-45 rounded-lg bg-indigo-300/10", w: 120, h: 120, x: 8, y: 42, d: 9, del: 0.5 },
  { className: "rounded-full bg-cyan-400/10", w: 200, h: 200, x: 35, y: 75, d: 11, del: 3 },
  { className: "rounded-[50%_50%_50%_50%/60%_40%_40%_60%] bg-blue-300/10", w: 100, h: 100, x: 55, y: 28, d: 8, del: 1.5 },
  { className: "rounded-[60%_40%_30%_70%/50%_60%_40%_50%] bg-white/[0.03]", w: 280, h: 280, x: -5, y: 50, d: 13, del: 0.8 },
  { className: "rounded-2xl bg-indigo-400/10", w: 80, h: 80, x: 85, y: 80, d: 7, del: 2.5 },
]

const customerShapes = [
  { className: "rounded-full bg-teal-400/10", w: 320, h: 320, x: -8, y: -12, d: 12, del: 0 },
  { className: "rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-cyan-400/10", w: 240, h: 240, x: 65, y: -8, d: 10, del: 1 },
  { className: "rounded-[30%_70%_50%_50%] bg-teal-300/10", w: 180, h: 180, x: 75, y: 55, d: 14, del: 2 },
  { className: "rotate-45 rounded-lg bg-cyan-300/10", w: 120, h: 120, x: 8, y: 42, d: 9, del: 0.5 },
  { className: "rounded-full bg-emerald-400/10", w: 200, h: 200, x: 35, y: 75, d: 11, del: 3 },
  { className: "rounded-[50%_50%_50%_50%/60%_40%_40%_60%] bg-teal-300/10", w: 100, h: 100, x: 55, y: 28, d: 8, del: 1.5 },
  { className: "rounded-[60%_40%_30%_70%/50%_60%_40%_50%] bg-white/[0.03]", w: 280, h: 280, x: -5, y: 50, d: 13, del: 0.8 },
  { className: "rounded-2xl bg-cyan-400/10", w: 80, h: 80, x: 85, y: 80, d: 7, del: 2.5 },
]

const vendorShapes = [
  { className: "rounded-full bg-emerald-400/10", w: 320, h: 320, x: -8, y: -12, d: 12, del: 0 },
  { className: "rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-emerald-400/10", w: 240, h: 240, x: 65, y: -8, d: 10, del: 1 },
  { className: "rounded-[30%_70%_50%_50%] bg-emerald-300/10", w: 180, h: 180, x: 75, y: 55, d: 14, del: 2 },
  { className: "rotate-45 rounded-lg bg-emerald-300/10", w: 120, h: 120, x: 8, y: 42, d: 9, del: 0.5 },
  { className: "rounded-full bg-emerald-400/10", w: 200, h: 200, x: 35, y: 75, d: 11, del: 3 },
  { className: "rounded-[50%_50%_50%_50%/60%_40%_40%_60%] bg-emerald-300/10", w: 100, h: 100, x: 55, y: 28, d: 8, del: 1.5 },
  { className: "rounded-[60%_40%_30%_70%/50%_60%_40%_50%] bg-white/[0.03]", w: 280, h: 280, x: -5, y: 50, d: 13, del: 0.8 },
  { className: "rounded-2xl bg-emerald-400/10", w: 80, h: 80, x: 85, y: 80, d: 7, del: 2.5 },
]

function FloatingShape({ s }: { s: (typeof adminShapes)[number] }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${s.className}`}
      style={{ width: s.w, height: s.h, left: `${s.x}%`, top: `${s.y}%` }}
      animate={{
        y: [0, -25, 5, -10, 0],
        x: [0, 12, -8, 5, 0],
        rotate: [0, 8, -4, 6, 0],
      }}
      transition={{
        duration: s.d,
        repeat: Infinity,
        delay: s.del,
        ease: "easeInOut",
      }}
    />
  )
}

const THEME_CONFIG: Record<
  DashboardTheme,
  {
    shapes: typeof adminShapes
    bgGradient: string
    contentGradient: string
    titleColor: string
    subtitleColor: string
    textColor: string
    featureColor: string
    bulletColor: string
    copyrightColor: string
    title: string
    subtitle: string
    description: string
    features: string[]
  }
> = {
  admin: {
    shapes: adminShapes,
    bgGradient: "from-slate-900 via-blue-950 to-indigo-950",
    contentGradient: "bg-white",
    titleColor: "text-blue-300",
    subtitleColor: "text-blue-200/60",
    textColor: "text-blue-200/50",
    featureColor: "text-blue-200/50",
    bulletColor: "bg-blue-400/60",
    copyrightColor: "text-blue-200/25",
    title: "Admin Center",
    subtitle: "Control Center",
    description:
      "Manage users, vendors, system settings, and platform operations from a single, secure dashboard.",
    features: [
      "User & role management — control access across the platform",
      "Vendor oversight — approve, review, and monitor activity",
      "System monitoring — real-time platform health insights",
    ],
  },
  customer: {
    shapes: customerShapes,
    bgGradient: "from-teal-900 via-cyan-950 to-emerald-950",
    contentGradient: "bg-white",
    titleColor: "text-teal-300",
    subtitleColor: "text-teal-200/60",
    textColor: "text-teal-200/50",
    featureColor: "text-teal-200/50",
    bulletColor: "bg-teal-400/60",
    copyrightColor: "text-teal-200/25",
    title: "MyMedDevices",
    subtitle: "Patient Portal",
    description:
      "Access your medical records, manage appointments, and stay connected with your healthcare providers.",
    features: [
      "Medical records — view and manage your health information",
      "Appointments — schedule and track visits with providers",
      "Secure messaging — communicate with your care team",
    ],
  },
  vendor: {
    shapes: vendorShapes,
    bgGradient: "from-slate-900 via-emerald-950 to-emerald-950",
    contentGradient: "bg-white",
    titleColor: "text-emerald-300",
    subtitleColor: "text-emerald-200/60",
    textColor: "text-emerald-200/50",
    featureColor: "text-emerald-200/50",
    bulletColor: "bg-emerald-400/60",
    copyrightColor: "text-emerald-200/25",
    title: "Vendor",
    subtitle: "Portal",
    description:
      "Manage your vendor account, products, orders, and performance metrics from a unified dashboard.",
    features: [
      "Product management — list and manage your inventory",
      "Order fulfillment — track and process customer orders",
      "Analytics — monitor your sales and performance metrics",
    ],
  },
}

export function LoginBackground({ children, theme = "admin" }: LoginBackgroundProps) {
  const config = THEME_CONFIG[theme]

  return (
    <div className="flex min-h-svh w-full">
      <div className={`relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br ${config.bgGradient} p-12 xl:w-[55%] xl:p-14 2xl:p-16 lg:flex`}>
        {config.shapes.map((s, i) => (
          <FloatingShape key={i} s={s} />
        ))}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MyMedDevices" className="h-12 w-auto" />
          </div>
        </div>
        <div className="relative z-10 space-y-4 pb-16">
          <h1 className={`text-4xl font-bold leading-tight tracking-tight text-white`}>
            {config.title}
            <br />
            <span className={config.titleColor}>{config.subtitle}</span>
          </h1>
          <p className={`max-w-sm text-base leading-relaxed ${config.subtitleColor}`}>{config.description}</p>
          <div className="space-y-3 pt-4">
            {config.features.map((f, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm ${config.featureColor}`}>
                <div className={`size-1.5 rounded-full ${config.bulletColor}`} />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className={`relative z-10 text-xs ${config.copyrightColor}`}>&copy; 2026 MyMedDevices. All rights reserved.</p>
      </div>
      <div className={`flex w-full items-center justify-center bg-gradient-to-br ${config.contentGradient} p-6 lg:w-1/2 lg:p-12 xl:p-14 2xl:p-16`} role="main" id="main-content">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  )
}
