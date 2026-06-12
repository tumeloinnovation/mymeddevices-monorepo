import { LoginForm, LoginBackground } from "@mymeddevices/shared-admin"

export default function LoginPage() {
  return (
    <LoginBackground theme="vendor">
      <LoginForm theme="vendor" showRegisterLink />
    </LoginBackground>
  )
}
