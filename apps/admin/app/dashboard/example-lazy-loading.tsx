/**
 * Example of using dynamic imports for route code splitting
 *
 * To enable dynamic imports for a page, replace the default export with:
 *
 * import { createLazyComponent } from "@mymeddevices/shared-admin/utils/dynamic-imports"
 *
 * export default createLazyComponent(() => import("./page-content"))
 */

// Original approach (no code splitting):
// export default function DashboardPage() {
//   return <div>Dashboard content</div>
// }

// With dynamic imports (recommended for better performance):
import { createLazyComponent } from "@mymeddevices/shared-admin"
import { FullPageLoading } from "@mymeddevices/shared-core"

function DashboardPageContent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p>This page is now code-split and loaded on demand!</p>
    </div>
  )
}

export default createLazyComponent(
  () => Promise.resolve({ default: DashboardPageContent }),
  <FullPageLoading message="Loading dashboard..." />
)
