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
import { Loader2, Check } from 'lucide-react';
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
import { useUpdatePaymentMethod } from '@/lib/hooks/usePaymentMethods';
import type { PaymentMethod } from '@/lib/api/endpoints/payment-methods';

const editSchema = z.object({
  display_name: z.string().optional(),
  is_default: z.boolean().optional(),
});

interface EditPaymentMethodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: PaymentMethod | null;
}

export function EditPaymentMethodSheet({
  open,
  onOpenChange,
  method,
}: EditPaymentMethodSheetProps) {
  const updateMethod = useUpdatePaymentMethod();

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: standardSchemaResolver(editSchema),
    values: {
      display_name: method?.display_name || '',
      is_default: method?.is_default || false,
    },
  });

  const handleSubmit = async (values: z.infer<typeof editSchema>) => {
    if (!method) return;
    try {
      await updateMethod.mutateAsync({
        methodId: method.id,
        data: values,
      });
      onOpenChange(false);
    } catch {
      // Handled by hook
    }
  };

  const getMethodTitle = () => {
    if (!method) return 'Payment Method';
    if (method.payment_type === 'mpesa') return `M-Pesa (${method.phone_number || ''})`;
    if (method.payment_type === 'card') return `${method.card_brand || 'Card'} •••• ${method.card_last4 || ''}`;
    return `${method.bank_name || 'Bank'} Account`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card border-l border-border">
        <SheetHeader className="p-6 border-b border-border space-y-1">
          <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
            Edit Payment Method
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Update nickname or change default payment preference.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="p-3 mb-6 rounded-lg bg-muted/40 border border-border text-xs">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Editing Method</span>
            <span className="font-semibold text-foreground text-sm">{getMethodTitle()}</span>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Nickname / Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Personal M-Pesa" className="h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={updateMethod.isPending}
                  className="w-full h-10 text-xs font-medium gap-2"
                >
                  {updateMethod.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
