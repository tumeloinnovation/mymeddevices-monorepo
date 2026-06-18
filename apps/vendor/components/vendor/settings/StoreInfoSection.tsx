'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Store, Phone, Mail } from 'lucide-react';

interface StoreInfoSectionProps {
    storeName: string;
    phone: string;
    showEmail: boolean;
    onChange: (field: 'store_name' | 'phone' | 'show_email', value: string | boolean) => void;
}

export function StoreInfoSection({
    storeName,
    phone,
    showEmail,
    onChange,
}: StoreInfoSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Store Information
                </CardTitle>
                <CardDescription>
                    Basic information about your store
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                        id="store_name"
                        value={storeName}
                        onChange={(e) => onChange('store_name', e.target.value)}
                        placeholder="Enter your store name"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        placeholder="+254 700 000 000"
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="show_email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Show Email Publicly
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Display your email address on your store page
                        </p>
                    </div>
                    <Switch
                        id="show_email"
                        checked={showEmail}
                        onCheckedChange={(checked) => onChange('show_email', checked)}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
