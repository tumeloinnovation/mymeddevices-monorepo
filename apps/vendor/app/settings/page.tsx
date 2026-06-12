import DashboardLayout from "@/components/dashboard-layout"
import { SettingsForm } from "@/components/settings-form"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="max-w-md">
        <SettingsForm />
      </div>
    </DashboardLayout>
  )
}
