# @mymeddevices/shared-admin

Shared components for Admin and Vendor applications. This package provides a consistent UI experience with theme variants for both applications.

## Installation

This package is part of the MyMedDevices monorepo and is automatically available to admin and vendor apps.

```bash
pnpm install
```

## Usage

### Components

All components can be imported from `@mymeddevices/shared-admin`:

```tsx
import { 
  Button, 
  Card, 
  Input, 
  LoginForm, 
  DashboardLayout 
} from "@mymeddevices/shared-admin"
```

### Theme System

The package supports theme variants through the `DashboardTheme` type:

```tsx
import type { DashboardTheme } from "@mymeddevices/shared-admin"

// Available themes: "admin" | "vendor"
```

### Layout Components

#### DashboardLayout

Main layout wrapper with sidebar navigation and authentication.

```tsx
import { DashboardLayout } from "@mymeddevices/shared-admin"

export default function Page() {
  return (
    <DashboardLayout theme="admin">
      {/* Your page content */}
    </DashboardLayout>
  )
}
```

**Props:**
- `theme?: "admin" | "vendor"` - Color scheme variant
- `navItems?: Array<{ label: string; href: string }>` - Custom navigation items

#### LoginBackground

Animated background for authentication pages.

```tsx
import { LoginForm, LoginBackground } from "@mymeddevices/shared-admin"

export default function LoginPage() {
  return (
    <LoginBackground theme="vendor">
      <LoginForm theme="vendor" showRegisterLink />
    </LoginBackground>
  )
}
```

### Authentication Components

#### LoginForm

Login form with theme support and optional registration link.

```tsx
import { LoginForm } from "@mymeddevices/shared-admin"

export default function LoginPage() {
  return (
    <LoginForm 
      theme="admin"
      showRegisterLink={false}
    />
  )
}
```

**Props:**
- `theme?: "admin" | "vendor"` - Color scheme
- `showRegisterLink?: boolean` - Show registration link below form
- `title?: string` - Custom title
- `description?: string` - Custom description

#### ForgotPasswordForm

Password reset form.

```tsx
import { ForgotPasswordForm, LoginBackground } from "@mymeddevices/shared-admin"

export default function ForgotPasswordPage() {
  return (
    <LoginBackground theme="admin">
      <ForgotPasswordForm theme="admin" />
    </LoginBackground>
  )
}
```

#### RegisterForm

Vendor registration form.

```tsx
import { RegisterForm, LoginBackground } from "@mymeddevices/shared-admin"

export default function RegisterPage() {
  return (
    <LoginBackground theme="vendor">
      <RegisterForm />
    </LoginBackground>
  )
}
```

### Settings Form

Password change form for settings pages.

```tsx
import { SettingsForm } from "@mymeddevices/shared-admin"

export default function SettingsPage() {
  return (
    <div className="container">
      <SettingsForm />
    </div>
  )
}
```

### UI Components

All standard UI components are available:

```tsx
import {
  // Layout
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  
  // Forms
  Button, Input, Label, Separator,
  
  // Feedback
  Avatar, AvatarFallback, AvatarImage,
  Skeleton, Tooltip,
  
  // Navigation
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  
  // Data
  Table, TableHeader, TableBody, TableRow, TableCell,
} from "@mymeddevices/shared-admin"
```

### Loading Components

Consistent loading states across applications:

```tsx
import {
  FullPageLoading,
  LoadingSpinner,
  InlineLoading,
  TableLoading,
  CardLoading,
  Skeleton
} from "@mymeddevices/shared-admin"

// Full page loading
<FullPageLoading message="Loading..." />

// Spinner only
<LoadingSpinner size="md" />

// Inline with text
<InlineLoading message="Saving..." />

// Table skeleton
<TableLoading rowCount={10} />

// Card skeletons
<CardLoading count={3} />

// Custom skeleton
<Skeleton className="h-12 w-full" />
```

### Utilities

#### Dynamic Imports

For code splitting and lazy loading:

```tsx
import { createLazyComponent, preloadComponent } from "@mymeddevices/shared-admin"

// Create a lazy-loaded component
export default createLazyComponent(
  () => import("./MyPage"),
  <FullPageLoading message="Loading..." />
)

// Preload on interaction
<Button onMouseEnter={() => preloadComponent(() => import("./HeavyComponent"))}>
  Hover to preload
</Button>
```

#### cn Utility

Tailwind class merging utility:

```tsx
import { cn } from "@mymeddevices/shared-admin"

<div className={cn("base-class", isActive && "active-class")} />
```

## Theme Colors

### Admin Theme (Blue)
- Primary: `bg-blue-600`, `hover:bg-blue-500`
- Accent: `focus:border-blue-400`, `focus:ring-blue-100`
- Links: `hover:text-blue-600`

### Vendor Theme (Orange)
- Primary: `bg-orange-600`, `hover:bg-orange-500`
- Accent: `focus:border-orange-400`, `focus:ring-orange-100`
- Links: `hover:text-orange-600`

## Development

### Storybook

View and interact with components:

```bash
pnpm storybook
```

Build Storybook for production:

```bash
pnpm build-storybook
```

### Bundle Analysis

Analyze bundle size:

```bash
# From apps/admin, apps/vendor, or apps/customer
pnpm build:analyze
```

## Integration with Shared Packages

This package integrates with:
- `@mymeddevices/shared-core` - Authentication, API client, types, error boundaries
- `@mymeddevices/shared-ui` - Customer-specific components

## License

Private package for MyMedDevices internal use.
