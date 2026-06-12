import { permanentRedirect } from "next/navigation"

export default function CustomerHome() {
  permanentRedirect("/dashboard")
}
