import { LoginBackground } from "@mymeddevices/shared-admin"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <LoginBackground theme="customer">
      <LoginForm />
    </LoginBackground>
  )
}
