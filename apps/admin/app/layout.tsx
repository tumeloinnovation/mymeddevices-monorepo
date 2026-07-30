import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SkipNav } from "@mymeddevices/shared-core"

export const metadata: Metadata = {
  title: "Admin Portal | MyMedDevices",
  description: "Admin panel for MyMedDevices platform",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <SkipNav />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
