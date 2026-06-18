# Phase 7: Store Profile & Support

This phase covers administrative tasks including store profile management, support ticket system, notification preferences, and security settings.

## Overview

Phase 7 completes the vendor portal by providing tools for store customization, customer support, notification management, and account security. These features enhance vendor engagement and platform trust.

---

## 7.1 Store Profile Management

### Routes
- `/vendor/settings/profile` - Store profile
- `/vendor/settings/policies` - Store policies
- `/vendor/settings/shipping` - Shipping configuration

### Current Status
- ✅ Store profile editor (Logo, Name, Description, Contact)
- ✅ Business contact management

### Remaining Tasks

#### Store Profile Page
**File:** `apps/vendor-web/app/vendor/settings/profile/page.tsx`

```tsx
export default function StoreProfilePage() {
  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Store Profile"
          description="Manage your store's appearance and information"
        />

        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoForm />
          </TabsContent>

          <TabsContent value="branding">
            <BrandingForm />
          </TabsContent>

          <TabsContent value="contact">
            <ContactForm />
          </TabsContent>

          <TabsContent value="policies">
            <PoliciesForm />
          </TabsContent>

          <TabsContent value="social">
            <SocialLinksForm />
          </TabsContent>
        </Tabs>
      </div>
    </VendorLayout>
  );
}
```

#### Basic Info Form
**File:** `apps/vendor-web/app/vendor/settings/profile/components/BasicInfoForm.tsx`

```tsx
interface BasicInfoFormProps {
  profile: StoreProfile;
  onUpdate: (data: BasicInfoUpdate) => Promise<void>;
}

interface BasicInfoUpdate {
  store_name: string;
  slug: string;
  description?: string;
  tagline?: string;
}

// Fields:
// - Store Name (required)
// - Store Slug (auto-generated from name)
// - Store Description (rich text)
// - Tagline (short description)
// - Store Status (Active/Vacation/Inactive)
```

**Features:**
- Live slug generation
- SEO description preview
- Character count
- Store status with explanation
- Vacation mode message

#### Branding Form
**File:** `apps/vendor-web/app/vendor/settings/profile/components/BrandingForm.tsx`

```tsx
interface BrandingFormProps {
  profile: StoreProfile;
  onUpdate: (data: BrandingUpdate) => Promise<void>;
}

interface BrandingUpdate {
  logo_url?: string;
  banner_url?: string;
  accent_color?: string;
  font_family?: string;
}

// Fields:
// - Logo upload (with preview)
// - Banner image upload (with preview)
// - Accent color picker
// - Recommended image sizes
// - Image guidelines
```

**Features:**
- Logo upload with preview
- Banner image upload
- Crop tool for images
- Size recommendations
- Accent color selection
- Live preview card
- Reset to default

#### Contact Form
**File:** `apps/vendor-web/app/vendor/settings/profile/components/ContactForm.tsx`

```tsx
interface ContactFormProps {
  profile: StoreProfile;
  onUpdate: (data: ContactUpdate) => Promise<void>;
}

interface ContactUpdate {
  business_email: string;
  business_phone?: string;
  whatsapp_number?: string;
  support_email?: string;
  address?: Address;
  business_hours?: BusinessHour[];
}

interface BusinessHour {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  open: string;  // HH:mm format
  close: string; // HH:mm format
  closed: boolean;
}

// Fields:
// - Business Email (required)
// - Business Phone
// - WhatsApp Number
// - Support Email
// - Business Address
// - Business Hours (per day)
```

**Features:**
- Email validation
- Phone format validation
- Address form with country
- Business hours table
- Quick select (24/7, weekdays, etc.)
- Copy hours to all days
- Timezone selector

#### Policies Form
**File:** `apps/vendor-web/app/vendor/settings/profile/components/PoliciesForm.tsx`

```tsx
interface PoliciesFormProps {
  policies: StorePolicies;
  onUpdate: (policies: StorePolicies) => Promise<void>;
}

interface StorePolicies {
  return_policy?: string;
  shipping_policy?: string;
  refund_policy?: string;
  privacy_policy?: string;
  terms_of_service?: string;
}

// Rich text editors for each policy
// Template options
// Character recommendations
// Preview sections
```

**Features:**
- Rich text editor for policies
- Policy templates
- Character count
- Preview card
- Required policies indicator
- Copy from template

#### Social Links Form
**File:** `apps/vendor-web/app/vendor/settings/profile/components/SocialLinksForm.tsx`

```tsx
interface SocialLinksFormProps {
  links: SocialLinks;
  onUpdate: (links: SocialLinks) => Promise<void>;
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
}

// Social media link inputs
// URL validation
// Icon preview
// Add custom network
```

---

## 7.2 Support & Tickets

### Support Page
**File:** `apps/vendor-web/app/vendor/support/page.tsx`

```tsx
export default function SupportPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Support"
          description="Get help with your store"
          action={
            <Button onClick={() => setNewTicketOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          }
        />

        <SupportQuickActions />

        <TicketsTable />
      </div>
    </VendorLayout>
  );
}
```

#### Support Quick Actions
**File:** `apps/vendor-web/app/vendor/support/components/SupportQuickActions.tsx`

```tsx
interface SupportQuickActionsProps {
  actions: SupportAction[];
}

interface SupportAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: 'ticket' | 'chat' | 'kb' | 'call';
  link?: string;
}

// Quick action cards:
// 1. Create Ticket
// 2. Live Chat (if available)
// 3. Knowledge Base
// 4. Phone Support
// 5. Email Support
// 6. Community Forum
```

#### Tickets Table
**File:** `apps/vendor-web/app/vendor/support/components/TicketsTable.tsx`

```tsx
interface TicketsTableProps {
  tickets: SupportTicket[];
  loading?: boolean;
  onTicketClick: (ticketId: string) => void;
}

// Table columns
const columns = [
  {
    id: 'ticket_number',
    header: 'Ticket #',
    cell: ({ row }) => row.original.ticket_number,
  },
  {
    id: 'subject',
    header: 'Subject',
    cell: ({ row }) => (
      <TicketSubjectCell
        subject={row.original.subject}
        status={row.original.status}
        onClick={() => onTicketClick(row.original.id)}
      />
    ),
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <CategoryBadge category={row.original.category} />
    ),
  },
  {
    id: 'priority',
    header: 'Priority',
    cell: ({ row }) => (
      <PriorityBadge priority={row.original.priority} />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <TicketStatusBadge status={row.original.status} />
    ),
  },
  {
    id: 'created',
    header: 'Created',
    cell: ({ row }) => <RelativeDate date={row.original.created_at} />,
  },
  {
    id: 'last_updated',
    header: 'Last Updated',
    cell: ({ row }) => (
      <RelativeDate date={row.original.updated_at} />
    ),
  },
  {
    id: 'last_message',
    header: 'Last Message',
    cell: ({ row }) => (
      row.original.last_message_at ? (
        <RelativeDate date={row.original.last_message_at} />
      ) : null
    ),
  },
];
```

#### New Ticket Dialog
**File:** `apps/vendor-web/components/support/NewTicketDialog.tsx`

```tsx
interface NewTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (ticket: CreateTicketDto) => Promise<void>;
}

interface CreateTicketDto {
  subject: string;
  category: TicketCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  order_id?: string;
  product_id?: string;
  attachments?: File[];
}

type TicketCategory =
  | 'orders'
  | 'payments'
  | 'products'
  | 'shipping'
  | 'account'
  | 'technical'
  | 'other';

// Form fields:
// - Subject (required, min 10 chars)
// - Category dropdown
// - Priority selector
// - Description (rich text)
// - Related Order ID (optional, with search)
// - Related Product ID (optional, with search)
// - Attachments
```

**Features:**
- Subject suggestions
- Category with icons
- Priority explanation
- Rich text description
- Order/product search
- File attachments
- Character count
- Submit with confirmation

#### Ticket Detail Page
**File:** `apps/vendor-web/app/vendor/support/tickets/[id]/page.tsx`

```tsx
export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const { data: ticket, loading, refetch } = useTicket(params.id);

  if (loading) return <TicketDetailSkeleton />;
  if (!ticket) return <NotFound />;

  return (
    <VendorLayout>
      <div className="space-y-6">
        <TicketHeader
          ticket={ticket}
          onStatusChange={refetch}
          onPriorityChange={refetch}
        />

        <TicketConversation
          ticket={ticket}
          onReply={refetch}
        />

        <TicketInfo ticket={ticket} />
      </div>
    </VendorLayout>
  );
}
```

#### Ticket Conversation
**File:** `apps/vendor-web/app/vendor/support/tickets/[id]/components/TicketConversation.tsx`

```tsx
interface TicketConversationProps {
  ticket: SupportTicketDetail;
  onReply: () => void;
}

// Shows message history:
// - Alternating vendor/support messages
// - Timestamps
// - Attachments
// - Agent info (for support messages)

// Reply area:
// - Rich text editor
// - File attachment
// - Send button
// - Mark as resolved checkbox
```

#### Ticket Status Badge
```tsx
interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';

// Badge colors:
// Open: Blue
// Pending: Yellow (waiting for vendor response)
// Resolved: Green
// Closed: Gray
```

#### Priority Badge
```tsx
interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Badge colors:
// Low: Gray
// Medium: Blue
// High: Orange
// Urgent: Red (pulsing)
```

---

## 7.3 Notification Settings

### Notifications Page
**File:** `apps/vendor-web/app/vendor/settings/notifications/page.tsx`

```tsx
export default function NotificationSettingsPage() {
  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Notification Settings"
          description="Manage how and when you receive notifications"
        />

        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="push">Push</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <EmailNotificationSettings />
          </TabsContent>

          <TabsContent value="push">
            <PushNotificationSettings />
          </TabsContent>

          <TabsContent value="sms">
            <SmsNotificationSettings />
          </TabsContent>

          <TabsContent value="preferences">
            <NotificationPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </VendorLayout>
  );
}
```

#### Email Notification Settings
**File:** `apps/vendor-web/app/vendor/settings/notifications/components/EmailNotificationSettings.tsx`

```tsx
interface EmailNotificationSettingsProps {
  settings: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => Promise<void>;
}

interface NotificationSettings {
  email_notifications: {
    new_orders: boolean;
    order_updated: boolean;
    low_stock: boolean;
    payout_received: boolean;
    ticket_updates: boolean;
    ticket_replies: boolean;
    product_review: boolean;
    monthly_summary: boolean;
    marketing_updates: boolean;
  };
  email_digest: {
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    send_time: string; // HH:mm
  };
}

// Checkbox groups for each notification type
// Digest settings
// Send time picker
```

#### Push Notification Settings
**File:** `apps/vendor-web/app/vendor/settings/notifications/components/PushNotificationSettings.tsx`

```tsx
interface PushNotificationSettingsProps {
  settings: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => Promise<void>;
  permissionState: 'granted' | 'denied' | 'prompt';
  onRequestPermission: () => void;
}

// Browser permission notice
// Enable/disable notifications
// Notification type checkboxes
// Quiet hours (do not disturb)
// Sound settings
```

#### SMS Notification Settings
**File:** `apps/vendor-web/app/vendor/settings/notifications/components/SmsNotificationSettings.tsx`

```tsx
interface SmsNotificationSettingsProps {
  settings: NotificationSettings;
  phone: string;
  verified: boolean;
  onUpdate: (settings: NotificationSettings) => Promise<void>;
  onVerifyPhone: (code: string) => Promise<void>;
}

// Phone number display
// Verification notice
// SMS notification toggles:
// - New orders
// - Payout received
// - High priority tickets
// - System alerts
```

#### Notification Preferences
**File:** `apps/vendor-web/app/vendor/settings/notifications/components/NotificationPreferences.tsx`

```tsx
interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => Promise<void>;
}

interface NotificationPreferences {
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  frequency_limits: {
    max_per_hour: number;
    max_per_day: number;
  };
  grouping: {
    enabled: boolean;
    interval: number; // minutes
  };
}

// Quiet hours configuration
// Frequency limits
// Notification grouping
// Test notification button
```

---

## 7.4 Security Settings

### Security Page
**File:** `apps/vendor-web/app/vendor/settings/security/page.tsx`

```tsx
export default function SecuritySettingsPage() {
  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Security Settings"
          description="Manage your account security"
        />

        <SecurityOverview />

        <PasswordChangeSection />

        <TwoFactorSection />

        <ActiveSessionsSection />

        <SecurityLogSection />
      </div>
    </VendorLayout>
  );
}
```

#### Security Overview
**File:** `apps/vendor-web/app/vendor/settings/security/components/SecurityOverview.tsx`

```tsx
interface SecurityOverviewProps {
  security: SecurityStatus;
}

interface SecurityStatus {
  password_strength: 'weak' | 'fair' | 'good' | 'strong';
  two_factor_enabled: boolean;
  two_factor_method?: 'sms' | 'authenticator' | 'email';
  active_sessions: number;
  last_sign_in: string;
  last_password_change?: string;
  security_issues: SecurityIssue[];
}

interface SecurityIssue {
  type: 'weak_password' | 'no_2fa' | 'old_password' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action_text: string;
  action_link: string;
}

// Shows:
// - Security score (0-100)
// - Active sessions count
// - 2FA status
// - Last sign-in
// - Security issues list
// - Fix issue buttons
```

#### Password Change Section
**File:** `apps/vendor-web/app/vendor/settings/security/components/PasswordChangeSection.tsx`

```tsx
interface PasswordChangeSectionProps {
  onChangePassword: (data: PasswordChangeData) => Promise<void>;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Fields:
// - Current password
// - New password
// - Confirm password
// - Password strength indicator
// - Requirements list
```

**Features:**
- Password strength meter
- Requirements checklist:
  - Min 8 characters
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character
- Show/hide password toggles
- Live validation
- Success notification

#### Two-Factor Section
**File:** `apps/vendor-web/app/vendor/settings/security/components/TwoFactorSection.tsx`

```tsx
interface TwoFactorSectionProps {
  enabled: boolean;
  method?: TwoFactorMethod;
  onEnable: (method: TwoFactorMethod) => Promise<void>;
  onDisable: () => Promise<void>;
  onChangeMethod: (method: TwoFactorMethod) => Promise<void>;
}

type TwoFactorMethod = 'sms' | 'authenticator' | 'email';

// If disabled:
// - Method selection
// - Setup instructions
// - QR code (for authenticator)
// - Verify code input

// If enabled:
// - Current method display
// - Backup codes (if authenticator)
// - Change method button
// - Disable 2FA button
```

**Features:**
- Method selection with explanations
- Authenticator app QR code
- SMS verification
- Email verification
- Backup codes generation
- Disable with confirmation

#### Active Sessions Section
**File:** `apps/vendor-web/app/vendor/settings/security/components/ActiveSessionsSection.tsx`

```tsx
interface ActiveSessionsSectionProps {
  sessions: ActiveSession[];
  onRevoke: (sessionId: string) => void;
  onRevokeAll: () => void;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  current: boolean;
  created_at: string;
  last_active: string;
}

// Table of all active sessions:
// - Device/browser info
// - Location
// - IP address
// - Last active time
// - Current session indicator
// - Revoke button per session
// - Revoke all other sessions button
```

#### Security Log Section
**File:** `apps/vendor-web/app/vendor/settings/security/components/SecurityLogSection.tsx`

```tsx
interface SecurityLogSectionProps {
  events: SecurityEvent[];
  loading?: boolean;
}

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  description: string;
  ip: string;
  location?: string;
  user_agent?: string;
  created_at: string;
}

type SecurityEventType =
  | 'login'
  | 'logout'
  | 'password_change'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'session_revoked'
  | 'suspicious_activity'
  | 'api_key_created'
  | 'api_key_revoked';

// Table with filters:
// - Type filter
// - Date range
// - IP address search
// - Export capability
```

---

## Success Criteria

- [ ] Store profile saves correctly
- [ ] Logo uploads and displays
- [ ] Slug generates from store name
- [ ] Contact info validates correctly
- [ ] Business hours save and display
- [ ] Policy rich text editor works
- [ ] Social links validate URLs
- [ ] Support ticket creates successfully
- [ ] Ticket conversation updates live
- [ ] Attachments upload to tickets
- [ ] Notification settings persist
- [ ] Test notification sends
- [ ] Password changes with validation
- [ ] 2FA setup works with SMS
- [ ] 2FA setup works with authenticator
- [ ] Sessions revoke correctly
- [ ] Security log displays events

---

## Directory Structure

```
apps/vendor-web/
├── app/
│   └── vendor/
│       ├── settings/
│       │   ├── profile/
│       │   │   └── page.tsx                    # ⏳ To Build
│       │   ├── notifications/
│       │   │   └── page.tsx                    # ⏳ To Build
│       │   └── security/
│       │       └── page.tsx                   # ⏳ To Build
│       └── support/
│           ├── page.tsx                        # ⏳ To Build
│           └── tickets/
│               └── [id]/
│                   └── page.tsx                # ⏳ To Build
├── components/
│   ├── settings/
│   │   ├── profile/
│   │   │   ├── BasicInfoForm.tsx              # ⏳ To Build
│   │   │   ├── BrandingForm.tsx               # ⏳ To Build
│   │   │   ├── ContactForm.tsx                # ⏳ To Build
│   │   │   ├── PoliciesForm.tsx               # ⏳ To Build
│   │   │   └── SocialLinksForm.tsx            # ⏳ To Build
│   │   ├── notifications/
│   │   │   ├── EmailNotificationSettings.tsx  # ⏳ To Build
│   │   │   ├── PushNotificationSettings.tsx   # ⏳ To Build
│   │   │   ├── SmsNotificationSettings.tsx    # ⏳ To Build
│   │   │   └── NotificationPreferences.tsx    # ⏳ To Build
│   │   └── security/
│   │       ├── SecurityOverview.tsx            # ⏳ To Build
│   │       ├── PasswordChangeSection.tsx      # ⏳ To Build
│   │       ├── TwoFactorSection.tsx           # ⏳ To Build
│   │       ├── ActiveSessionsSection.tsx      # ⏳ To Build
│   │       └── SecurityLogSection.tsx         # ⏳ To Build
│   ├── support/
│   │   ├── SupportQuickActions.tsx            # ⏳ To Build
│   │   ├── TicketsTable.tsx                   # ⏳ To Build
│   │   ├── NewTicketDialog.tsx               # ⏳ To Build
│   │   ├── TicketConversation.tsx            # ⏳ To Build
│   │   ├── TicketStatusBadge.tsx             # ⏳ To Build
│   │   ├── PriorityBadge.tsx                 # ⏳ To Build
│   │   └── CategoryBadge.tsx                 # ⏳ To Build
│   └── profile/
│       └── StoreProfileForm.tsx              # ✅ Partial
└── lib/
    └── utils/
        ├── slug-generator.ts                  # ⏳ To Build
        ├── password-strength.ts               # ⏳ To Build
        └── business-hours-formatter.ts        # ⏳ To Build
```

---

## Implementation Notes

1. **Image Upload**: Compress images before upload
2. **Slug Generation**: Handle special characters, duplicates
3. **Rich Text**: Use lightweight editor (Tiptap)
4. **Ticket Replies**: Send email notifications on replies
5. **Notification Limits**: Implement per-hour/day limits
6. **2FA**: Store backup codes securely
7. **Sessions**: Use refresh token rotation
8. **Security Log**: Paginate, can be extensive
9. **Phone Verification**: Use SMS OTP
10. **Test Notification**: Send actual notification for testing
