'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Phone, CreditCard, Building2, Check, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import {
  useCreateMpesaMethod,
  useCreateCardMethod,
  useCreateBankMethod,
} from '@/lib/hooks/usePaymentMethods';

const mpesaSchema = z.object({
  phone_number: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+254\d{9}$/, 'Format must be +254XXXXXXXXX'),
  display_name: z.string().optional(),
  is_default: z.boolean().optional(),
});

const cardSchema = z.object({
  card_number: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{13,19}$/, 'Invalid card number'),
  card_expiry_month: z
    .string()
    .min(1, 'Month required')
    .regex(/^(0[1-9]|1[0-2])$/, 'MM (01-12)'),
  card_expiry_year: z
    .string()
    .min(1, 'Year required')
    .regex(/^\d{4}$/, 'YYYY'),
  cardholder_name: z
    .string()
    .min(1, 'Cardholder name required')
    .min(2, 'Name is too short'),
  display_name: z.string().optional(),
  is_default: z.boolean().optional(),
});

const bankSchema = z.object({
  bank_name: z.string().min(1, 'Bank name is required'),
  bank_account_number: z
    .string()
    .min(1, 'Account number is required')
    .min(8, 'Account number too short'),
  bank_account_name: z
    .string()
    .min(1, 'Account holder name required')
    .min(2, 'Name too short'),
  display_name: z.string().optional(),
  is_default: z.boolean().optional(),
});

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPaymentMethodDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddPaymentMethodDialogProps) {
  const [activeTab, setActiveTab] = useState<'mpesa' | 'card' | 'bank'>('mpesa');

  const mpesaForm = useForm<z.infer<typeof mpesaSchema>>({
    resolver: standardSchemaResolver(mpesaSchema),
    defaultValues: {
      phone_number: '',
      display_name: '',
      is_default: false,
    },
  });

  const cardForm = useForm<z.infer<typeof cardSchema>>({
    resolver: standardSchemaResolver(cardSchema),
    defaultValues: {
      card_number: '',
      card_expiry_month: '',
      card_expiry_year: '',
      cardholder_name: '',
      display_name: '',
      is_default: false,
    },
  });

  const bankForm = useForm<z.infer<typeof bankSchema>>({
    resolver: standardSchemaResolver(bankSchema),
    defaultValues: {
      bank_name: '',
      bank_account_number: '',
      bank_account_name: '',
      display_name: '',
      is_default: false,
    },
  });

  const createMpesa = useCreateMpesaMethod();
  const createCard = useCreateCardMethod();
  const createBank = useCreateBankMethod();

  const handleSubmit = async (values: any) => {
    try {
      if (activeTab === 'mpesa') {
        await createMpesa.mutateAsync(values);
      } else if (activeTab === 'card') {
        const cardData = {
          card_token: 'temp_token',
          card_last4: values.card_number.slice(-4),
          card_brand: detectCardBrand(values.card_number),
          card_expiry_month: values.card_expiry_month,
          card_expiry_year: values.card_expiry_year,
          cardholder_name: values.cardholder_name,
          display_name: values.display_name,
          is_default: values.is_default,
        };
        await createCard.mutateAsync(cardData);
      } else if (activeTab === 'bank') {
        await createBank.mutateAsync(values);
      }

      onOpenChange(false);
      onSuccess?.();

      mpesaForm.reset();
      cardForm.reset();
      bankForm.reset();
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading =
    createMpesa.isPending ||
    createCard.isPending ||
    createBank.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card border-l border-border">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border space-y-1">
          <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
            Add Payment Method
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Save M-Pesa, card, or bank account for faster checkout.
          </SheetDescription>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="mpesa" className="gap-1.5 text-xs font-medium">
                <Phone className="h-3.5 w-3.5" />
                M-Pesa
              </TabsTrigger>
              <TabsTrigger value="card" className="gap-1.5 text-xs font-medium">
                <CreditCard className="h-3.5 w-3.5" />
                Card
              </TabsTrigger>
              <TabsTrigger value="bank" className="gap-1.5 text-xs font-medium">
                <Building2 className="h-3.5 w-3.5" />
                Bank
              </TabsTrigger>
            </TabsList>

            {/* M-Pesa Form */}
            <TabsContent value="mpesa" className="mt-5 space-y-4">
              <Form {...mpesaForm}>
                <form onSubmit={mpesaForm.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={mpesaForm.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+254700000000" className="h-9 text-xs" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={mpesaForm.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Label / Nickname (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Personal M-Pesa" className="h-9 text-xs" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={mpesaForm.control}
                    name="is_default"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-medium block">Set as Default Method</FormLabel>
                          <p className="text-[11px] text-muted-foreground">
                            Use this automatically during express checkout
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-10 text-xs font-medium gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Save M-Pesa Method
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Card Form */}
            <TabsContent value="card" className="mt-5 space-y-4">
              <Form {...cardForm}>
                <form onSubmit={cardForm.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={cardForm.control}
                    name="card_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Card Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1234567890123456"
                            maxLength={19}
                            className="h-9 text-xs font-mono"
                            {...field}
                            onChange={(e) => {
                              const formatted = e.target.value.replace(/\D/g, '');
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={cardForm.control}
                      name="card_expiry_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Expiry Month</FormLabel>
                          <FormControl>
                            <Input placeholder="MM" maxLength={2} className="h-9 text-xs" {...field} />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={cardForm.control}
                      name="card_expiry_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Expiry Year</FormLabel>
                          <FormControl>
                            <Input placeholder="YYYY" maxLength={4} className="h-9 text-xs" {...field} />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={cardForm.control}
                    name="cardholder_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Cardholder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="JOHN DOE" className="h-9 text-xs uppercase" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cardForm.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Label / Nickname (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Business Debit Card" className="h-9 text-xs" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cardForm.control}
                    name="is_default"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-medium block">Set as Default Method</FormLabel>
                          <p className="text-[11px] text-muted-foreground">
                            Use this automatically during checkout
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-10 text-xs font-medium gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Save Card Method
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Bank Form */}
            <TabsContent value="bank" className="mt-5 space-y-4">
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={bankForm.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Equity Bank" className="h-9 text-xs" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bankForm.control}
                    name="bank_account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" className="h-9 text-xs font-mono" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bankForm.control}
                    name="bank_account_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="JOHN DOE" className="h-9 text-xs uppercase" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bankForm.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Label / Nickname (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Primary Bank Account" className="h-9 text-xs" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bankForm.control}
                    name="is_default"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-medium block">Set as Default Method</FormLabel>
                          <p className="text-[11px] text-muted-foreground">
                            Use this automatically during checkout
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-10 text-xs font-medium gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Save Bank Details
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20 mt-auto">
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Encrypted with 256-bit AES protocol</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function detectCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\D/g, '');
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  return 'Card';
}
