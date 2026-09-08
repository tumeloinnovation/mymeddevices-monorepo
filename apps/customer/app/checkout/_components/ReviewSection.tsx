'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useCartStore from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils/utils';
import { getValidImageUrl } from '@/lib/utils/image';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, User } from 'lucide-react';
import { isSafaricomNumber } from '@/lib/utils/phone';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Item = {
  id: string | number;
  title?: string;
  name?: string;
  price: number;
  quantity: number;
  image?: string;
  images?: { src: string; alt?: string }[];
  short_description?: string;
};

export default function ReviewSection({
  items: initialItems = [],
  onUpdateItem,
  onRemoveItem,
  onOpenSummary,
  paymentMethod,
  setPaymentMethod,
  customerInfo,
  deliveryInfo,
  isAuthenticated,
  onUpdateMpesaPhone,
}: {
  items?: Item[];
  onUpdateItem?: (item: Item) => void;
  onRemoveItem?: (id: string | number) => void;
  onOpenSummary?: () => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  customerInfo?: any;
  deliveryInfo?: any;
  isAuthenticated?: boolean;
  onUpdateMpesaPhone?: (phone: string) => void;
}) {
  const cart = useCartStore();
  const [items, setItems] = useState<Item[]>(() =>
    Array.isArray(initialItems) ? initialItems.map((it: any) => ({ ...it })) : [],
  );
  const [mpesaPhoneError, setMpesaPhoneError] = useState('');

  const handleMpesaPhoneChange = (e: any) => {
    const value = e.target.value;
    if (onUpdateMpesaPhone) onUpdateMpesaPhone(value);

    if (mpesaPhoneError) {
      if (!isSafaricomNumber(value)) {
        setMpesaPhoneError('Please enter a valid Safaricom number');
      } else {
        setMpesaPhoneError('');
      }
    }
  };

  useEffect(() => {
    setItems(Array.isArray(initialItems) ? initialItems.map((it: any) => ({ ...it })) : []);
  }, [initialItems]);

  const updateQty = (id: string | number, nextQty: number) => {
    // compute updated item from current local state
    const existing = items.find((i) => i.id === id);
    const updated = existing ? { ...existing, quantity: nextQty } : null;

    // update local items state
    setItems((prev) =>
      Array.isArray(prev)
        ? prev.map((it) => (it.id === id ? { ...it, quantity: nextQty } : it))
        : [],
    );

    // call external updater after scheduling local state update to avoid
    // triggering other components' updates during this component's render
    if (updated) {
      if (onUpdateItem) onUpdateItem(updated);
      else cart.updateQuantity(updated.id, updated.quantity);
    }
  };

  const decrement = (it: Item) => {
    const next = Math.max(1, it.quantity - 1);
    updateQty(it.id, next);
  };

  const increment = (it: Item) => {
    const next = it.quantity + 1;
    updateQty(it.id, next);
  };

  const remove = (id: string | number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    if (onRemoveItem) onRemoveItem(id);
    else cart.removeItem(id);
  };

  const total = useMemo(() => {
    return items.reduce((s, i) => s + Number(i.price) * (i.quantity || 0), 0);
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Authenticated User: Show Customer & Delivery Summary */}


      {/* Cart Items */}
      <Card>
        <CardContent>
          <div className="space-y-3">
            {Array.isArray(items) &&
              items.map((it) => (
                <div
                  key={it.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={getValidImageUrl(
                        (it as any).images?.[0]?.src || it.image || (it as any).image_url || (it as any).thumbnail,
                        '/logos/logo-portrait.png'
                      )}
                      alt={
                        (it as any).images?.[0]?.alt || it.name || it.title || `Item ${it.id}`
                      }
                      width={56}
                      height={56}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-md object-cover"
                    />

                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {it.name || it.title || `Item ${it.id}`}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 truncate">
                        Ksh. {formatCurrency(it.price)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center rounded-md border px-1 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Decrease quantity for ${it.id}`}
                        onClick={() => decrement(it)}
                      >
                        —
                      </Button>
                      <Input
                        aria-label={`Quantity for ${it.id}`}
                        value={String(it.quantity)}
                        onChange={(e) => {
                          // allow only digits
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          // prevent leading zeros
                          const normalized = v.replace(/^0+/, '') || '0';
                          setItems((prev) =>
                            Array.isArray(prev)
                              ? prev.map((p) =>
                                p.id === it.id ? { ...p, quantity: Number(normalized) } : p,
                              )
                              : [],
                          );
                        }}
                        onBlur={(e) => {
                          const value = Number(e.target.value) || 1;
                          const next = Math.max(1, Math.floor(value));
                          updateQty(it.id, next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = Number((e.target as HTMLInputElement).value) || 1;
                            const next = Math.max(1, Math.floor(value));
                            updateQty(it.id, next);
                          }
                        }}
                        className="w-12 sm:w-16 text-center bg-transparent border-0 focus-visible:ring-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Increase quantity for ${it.id}`}
                        onClick={() => increment(it)}
                      >
                        +
                      </Button>
                    </div>

                    <div className="mt-2 sm:mt-0 text-sm sm:text-right w-full sm:w-auto">
                      <div className="font-medium">
                        Ksh. {formatCurrency(it.price * it.quantity)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <button
                          type="button"
                          className="text-destructive underline-offset-2 hover:underline"
                          onClick={() => remove(it.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            <div className="pt-2 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="font-semibold">Ksh. {formatCurrency(total)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Payment Method</h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod">Cash on Delivery</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mpesa" id="mpesa" />
              <Label htmlFor="mpesa">Mpesa</Label>
            </div>
          </RadioGroup>

          {/* M-Pesa STK Push Number (Conditional) */}
          {paymentMethod === 'mpesa' && customerInfo?.phone && !isSafaricomNumber(customerInfo.phone) && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="mpesa-phone" className="text-emerald-700">
                M-Pesa Phone Number (for STK Push)
              </Label>
              <div className="relative mt-2">
                <Input
                  id="mpesa-phone"
                  placeholder="07..."
                  value={customerInfo?.mpesaPhone || ''}
                  onChange={handleMpesaPhoneChange}
                  className="bg-white border-emerald-200 focus-visible:ring-emerald-500 pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              {mpesaPhoneError && <p className="text-sm text-red-500 mt-1">{mpesaPhoneError}</p>}
              <p className="text-xs text-emerald-600 mt-2">
                Your account phone number is not a Safaricom number. Please provide one for payment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="lg:hidden">
        <div className="mt-3">
          <Button onClick={() => onOpenSummary && onOpenSummary()} className="w-full">
            View Order Summary
          </Button>
        </div>
      </div>
    </div>
  );
}
