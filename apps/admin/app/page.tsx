import { permanentRedirect } from "next/navigation"

export default function AdminHome() {
  permanentRedirect("/dashboard")
}
