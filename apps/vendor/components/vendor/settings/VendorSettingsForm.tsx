'use client';

import { useState } from 'react';
import { useUpdateVendorSettings } from '@/lib/hooks/vendor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { VendorStoreSettings, VendorSettingsUpdateRequest, VendorBusinessHours, VendorPaymentSettings } from '@/lib/data/types';
import { StoreInfoSection } from './StoreInfoSection';
import { AddressSection } from './AddressSection';
import { BusinessHoursSection } from './BusinessHoursSection';
import { LogoUploadSection } from './LogoUploadSection';
import { PaymentSection } from './PaymentSection';

interface VendorSettingsFormProps {
    initialSettings: VendorStoreSettings;
}

export function VendorSettingsForm({ initialSettings }: VendorSettingsFormProps) {
    const [formData, setFormData] = useState<VendorStoreSettings>(initialSettings);
    const [hasChanges, setHasChanges] = useState(false);
    const updateSettings = useUpdateVendorSettings();

    const handleChange = <K extends keyof VendorStoreSettings>(
        field: K,
        value: VendorStoreSettings[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = async () => {
        try {
            const updates: VendorSettingsUpdateRequest = {
                store_name: formData.store_name,
                phone: formData.phone,
                show_email: formData.show_email,
                address: formData.address,
                location: formData.location,
                gravatar_id: formData.gravatar_id,
                store_open_close: formData.store_open_close,
                payment: formData.payment,
            };

            await updateSettings.mutateAsync(updates);
            setHasChanges(false);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save settings');
        }
    };

    const defaultHours: VendorBusinessHours = {
        enabled: false,
        time: {}
    };

    const defaultPayment: VendorPaymentSettings = {
        mpesa: { enabled: false, phone_number: '', business_name: '' },
        bank: {
            enabled: false, account_name: '', account_number: '', bank_name: '',
            bank_code: '', branch_name: '', branch_code: '', routing_number: '',
            iban: '', swift_code: ''
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="store" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="store">Store Info</TabsTrigger>
                    <TabsTrigger value="address">Address</TabsTrigger>
                    <TabsTrigger value="hours">Business Hours</TabsTrigger>
                    <TabsTrigger value="logo">Logo</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                </TabsList>

                <TabsContent value="store" className="mt-6">
                    <StoreInfoSection
                        storeName={formData.store_name}
                        phone={formData.phone}
                        showEmail={formData.show_email}
                        onChange={(field, value) => {
                            if (field === 'store_name') handleChange('store_name', value as string);
                            if (field === 'phone') handleChange('phone', value as string);
                            if (field === 'show_email') handleChange('show_email', value as boolean);
                        }}
                    />
                </TabsContent>

                <TabsContent value="address" className="mt-6">
                    <AddressSection
                        address={formData.address}
                        location={formData.location}
                        onChange={(address, location) => {
                            handleChange('address', address);
                            if (location) handleChange('location', location);
                        }}
                    />
                </TabsContent>

                <TabsContent value="hours" className="mt-6">
                    <BusinessHoursSection
                        businessHours={formData.store_open_close || defaultHours}
                        onChange={(hours) => handleChange('store_open_close', hours)}
                    />
                </TabsContent>

                <TabsContent value="logo" className="mt-6">
                    <LogoUploadSection
                        logoUrl={formData.gravatar}
                        logoId={formData.gravatar_id || 0}
                        onChange={(id, url) => {
                            setFormData((prev) => ({
                                ...prev,
                                gravatar_id: id,
                                gravatar: url,
                            }));
                            setHasChanges(true);
                        }}
                    />
                </TabsContent>

                <TabsContent value="payment" className="mt-6">
                    <PaymentSection
                        payment={formData.payment || defaultPayment}
                        onChange={(payment) => handleChange('payment', payment)}
                    />
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
                <Button
                    onClick={handleSubmit}
                    disabled={!hasChanges || updateSettings.isPending}
                    size="lg"
                >
                    {updateSettings.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
