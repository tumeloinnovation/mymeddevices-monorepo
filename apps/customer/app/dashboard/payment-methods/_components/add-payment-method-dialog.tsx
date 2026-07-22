'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Phone, CreditCard, Building2, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { toast } from 'sonner';
import {
  useCreateMpesaMethod,
  useCreateCardMethod,
  useCreateBankMethod,
} from '@/lib/hooks/usePaymentMethods';

const mpesaSchema = z.object({
  phone_number: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+254\d{9}$/, 'Phone number must be in format +254XXXXXXXXX'),
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
    .min(1, 'Expiry month is required')
    .regex(/^(0[1-9]|1[0-2])$/, 'Invalid month (01-12)'),
  card_expiry_year: z
    .string()
    .min(1, 'Expiry year is required')
    .regex(/^\d{4}$/, 'Invalid year (YYYY)'),
  cardholder_name: z
    .string()
    .min(1, 'Cardholder name is required')
    .min(2, 'Name is too short'),
  display_name: z.string().optional(),
  is_default: z.boolean().optional(),
});

const bankSchema = z.object({
  bank_name: z.string().min(1, 'Bank name is required'),
  bank_account_number: z
    .string()
    .min(1, 'Account number is required')
    .min(8, 'Account number is too short'),
  bank_account_name: z
    .string()
    .min(1, 'Account holder name is required')
    .min(2, 'Name is too short'),
  display_name: z.string().optional(),
  is_default: z.boolean().optional(),
});

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Dialog for adding new payment methods
 * Supports M-Pesa, Card, and Bank transfer
 */
export function AddPaymentMethodDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddPaymentMethodDialogProps) {
  const [activeTab, setActiveTab] = useState<'mpesa' | 'card' | 'bank'>('mpesa');

  // M-Pesa form
  const mpesaForm = useForm<z.infer<typeof mpesaSchema>>({
    resolver: zodResolver(mpesaSchema),
    defaultValues: {
      phone_number: '',
      display_name: '',
      is_default: false,
    },
  });

  // Card form
  const cardForm = useForm<z.infer<typeof cardSchema>>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      card_number: '',
      card_expiry_month: '',
      card_expiry_year: '',
      cardholder_name: '',
      display_name: '',
      is_default: false,
    },
  });

  // Bank form
  const bankForm = useForm<z.infer<typeof bankSchema>>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bank_name: '',
      bank_account_number: '',
      bank_account_name: '',
      display_name: '',
      is_default: false,
    },
  });

  // Mutations
  const createMpesa = useCreateMpesaMethod();
  const createCard = useCreateCardMethod();
  const createBank = useCreateBankMethod();

  const handleSubmit = async (values: any) => {
    try {
      if (activeTab === 'mpesa') {
        await createMpesa.mutateAsync(values);
      } else if (activeTab === 'card') {
        const cardData = {
          card_token: 'temp_token', // In production, this comes from payment processor
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

      // Reset forms
      mpesaForm.reset();
      cardForm.reset();
      bankForm.reset();
    } catch {
      // Error is handled by the mutation
    }
  };

  const isLoading =
    createMpesa.isPending ||
    createCard.isPending ||
    createBank.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Choose a payment method to add to your account
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mpesa" className="gap-2">
              <Phone className="h-4 w-4" />
              M-Pesa
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2">
              <Building2 className="h-4 w-4" />
              Bank
            </TabsTrigger>
          </TabsList>

          {/* M-Pesa Tab */}
          <TabsContent value="mpesa">
            <Form {...mpesaForm}>
              <form onSubmit={mpesaForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={mpesaForm.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+254700000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mpesaForm.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Personal M-Pesa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mpesaForm.control}
                  name="is_default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Set as default</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Use this payment method by default
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

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isLoading || createMpesa.isSuccess}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Add M-Pesa Method
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Card Tab */}
          <TabsContent value="card">
            <Form {...cardForm}>
              <form onSubmit={cardForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={cardForm.control}
                  name="card_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234567890123456"
                          maxLength={19}
                          {...field}
                          onChange={(e) => {
                            const formatted = e.target.value.replace(/\D/g, '');
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={cardForm.control}
                    name="card_expiry_month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Month</FormLabel>
                        <FormControl>
                          <Input placeholder="MM" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cardForm.control}
                    name="card_expiry_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Year</FormLabel>
                        <FormControl>
                          <Input placeholder="YYYY" maxLength={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={cardForm.control}
                  name="cardholder_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cardholder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="JOHN DOE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={cardForm.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Personal Card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={cardForm.control}
                  name="is_default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Set as default</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Use this payment method by default
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

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isLoading || createCard.isSuccess}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Add Card
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Bank Tab */}
          <TabsContent value="bank">
            <Form {...bankForm}>
              <form onSubmit={bankForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={bankForm.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Equity Bank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={bankForm.control}
                  name="bank_account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={bankForm.control}
                  name="bank_account_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="JOHN DOE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={bankForm.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Business Account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={bankForm.control}
                  name="is_default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Set as default</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Use this payment method by default
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

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isLoading || createBank.isSuccess}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Add Bank Account
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Detect card brand from card number
 */
function detectCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\D/g, '');

  // Visa
  if (/^4/.test(number)) return 'Visa';
  // Mastercard
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  // Amex
  if (/^3[47]/.test(number)) return 'American Express';
  // Discover
  if (/^6(?:011|5)/.test(number)) return 'Discover';

  return 'Card';
}
