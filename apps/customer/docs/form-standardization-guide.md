# Form Standardization Guide

This guide provides the standard patterns for implementing forms in the customer app dashboard.

## Standard Form Stack

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
```

## Complete Form Template

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

// 1. Define Zod schema
const formSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  email: z
    .string()
    .email('Invalid email address'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms'),
});

type FormValues = z.infer<typeof formSchema>;

// 2. Create form component
export function MyForm() {
  // 3. Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      email: '',
      acceptTerms: false,
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  // 4. Handle submit
  const onSubmit = async (data: FormValues) => {
    try {
      // Call API with data
      await apiCall(data);
      toast.success('Form submitted successfully');
      form.reset(); // Optional: reset after success
    } catch (error) {
      toast.error('Failed to submit form');
    }
  };

  // 5. Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Unsaved changes warning */}
        {hasUnsavedChanges && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            You have unsaved changes.
          </div>
        )}

        {/* Form fields */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                First Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="John"
                  className={form.formState.errors.firstName && 'border-destructive'}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
```

## Common Validation Patterns

### Required Field
```tsx
name: z.string().min(1, 'Name is required')
```

### String Length
```tsx
name: z.string().min(2, 'Too short').max(50, 'Too long')
```

### Email
```tsx
email: z.string().email('Invalid email address')
```

### Phone Number (Kenyan Format)
```tsx
phone: z
  .string()
  .regex(/^\+254\d{9}$/, 'Must be a valid Kenyan number (+254XXXXXXXXX)')
  .or(z.string().regex(/^0\d{9}$/, 'Must start with 0 followed by 9 digits'))
  .transform((val) => val.startsWith('0') ? '+254' + val.substring(1) : val)
```

### Optional Field
```tsx
nickname: z.string().optional().or(z.literal(''))
```

### Checkbox Required
```tsx
acceptTerms: z.boolean().refine((val) => val === true, 'Must accept terms')
```

### Number Range
```tsx
age: z.number().min(18, 'Must be 18+').max(120, 'Invalid age')
```

### Select/Enum
```tsx
country: z.enum(['KE', 'UG', 'TZ'], { required_error: 'Select a country' })
```

## Form Field Patterns

### Text Input
```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Name</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea
```tsx
<FormField
  control={form.control}
  name="message"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Message</FormLabel>
      <FormControl>
        <Textarea {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Select/Dropdown
```tsx
<FormField
  control={form.control}
  name="country"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Country</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="ke">Kenya</SelectItem>
          <SelectItem value="ug">Uganda</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox
```tsx
<FormField
  control={form.control}
  name="acceptTerms"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Accept terms and conditions</FormLabel>
      </div>
    </FormItem>
  )}
/>
```

## Best Practices

### 1. Mode Selection
```tsx
// For validation on blur (recommended for most forms)
mode: 'onBlur'

// For validation on change (real-time)
mode: 'onChange'

// For validation on submit only
mode: 'onSubmit'
```

### 2. Loading State
```tsx
<Button
  type="submit"
  disabled={form.formState.isSubmitting || !form.formState.isDirty}
>
  {form.formState.isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

### 3. Error Styling
```tsx
<Input
  className={cn(
    form.formState.errors.fieldName && 'border-destructive'
  )}
/>
```

### 4. Helper Text
```tsx
<FormItem>
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input {...field} />
  </FormControl>
  <FormMessage />
  <p className="text-xs text-muted-foreground">We'll never share your email.</p>
</FormItem>
```

## Migration Checklist

When migrating existing forms from `useState`:

- [ ] Replace `useState` with `useForm`
- [ ] Add Zod schema for validation
- [ ] Replace input `value/onChange` with FormField
- [ ] Add inline error messages with `FormMessage`
- [ ] Add disabled state based on `isDirty`
- [ ] Add loading state based on `isSubmitting`
- [ ] Add unsaved changes tracking
- [ ] Test validation (required fields, formats, etc.)
- [ ] Test error display
- [ ] Test success flow

## Examples in the Codebase

Good examples of standardized forms:
- `app/dashboard/profile/_components/PersonalInfo.tsx` - Profile form with phone validation
- `app/dashboard/security/_components/password-strength-checklist.tsx` - Password strength
- `app/dashboard/communication/page.tsx` - Toggle-based preferences

## Non-Standard Patterns (Avoid)

❌ Don't use raw `useState` for form values
❌ Don't handle validation manually
❌ Don't use inline `value/onChange` without FormField
❌ Don't show errors in alerts (use inline FormMessage)
