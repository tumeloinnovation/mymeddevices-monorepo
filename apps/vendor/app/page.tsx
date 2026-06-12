import { permanentRedirect } from "next/navigation"

export default function VendorHome() {
  permanentRedirect("/dashboard")
}
