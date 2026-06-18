import { ResetPasswordForm, LoginBackground } from "@mymeddevices/shared-admin"
import { Suspense } from "react"

export default function ResetPasswordPage() {
  return (
    <LoginBackground theme="admin">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm theme="admin" />
      </Suspense>
    </LoginBackground>
  )
}
