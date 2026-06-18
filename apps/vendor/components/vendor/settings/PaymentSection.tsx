'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';
import type { VendorPaymentSettings, VendorMpesaPayment, VendorBankPayment } from '@/lib/data/types';

interface PaymentSectionProps {
    payment: VendorPaymentSettings;
    onChange: (payment: VendorPaymentSettings) => void;
}

export function PaymentSection({ payment, onChange }: PaymentSectionProps) {
    const [localPayment, setLocalPayment] = useState<VendorPaymentSettings>(payment);

    const handleMpesaChange = (field: keyof VendorMpesaPayment, value: any) => {
        const updatedMpesa: VendorMpesaPayment = {
            enabled: localPayment.mpesa?.enabled ?? true,
            phone_number: localPayment.mpesa?.phone_number || '',
            business_name: localPayment.mpesa?.business_name || '',
            [field]: value,
        };
        const updated: VendorPaymentSettings = {
            ...localPayment,
            mpesa: updatedMpesa,
        };
        setLocalPayment(updated);
        onChange(updated);
    };

    const handleBankChange = (field: keyof VendorBankPayment, value: any) => {
        const updatedBank: VendorBankPayment = {
            enabled: localPayment.bank?.enabled ?? false,
            account_name: localPayment.bank?.account_name || '',
            account_number: localPayment.bank?.account_number || '',
            bank_name: localPayment.bank?.bank_name || '',
            bank_code: localPayment.bank?.bank_code || '',
            branch_name: localPayment.bank?.branch_name || '',
            branch_code: localPayment.bank?.branch_code || '',
            routing_number: localPayment.bank?.routing_number || '',
            iban: localPayment.bank?.iban || '',
            swift_code: localPayment.bank?.swift_code || '',
            ac_name: localPayment.bank?.ac_name || '',
            ac_number: localPayment.bank?.ac_number || '',
            bank_addr: localPayment.bank?.bank_addr || '',
            swift: localPayment.bank?.swift || '',
            [field]: value,
        };
        const updated: VendorPaymentSettings = {
            ...localPayment,
            bank: updatedBank,
        };
        setLocalPayment(updated);
        onChange(updated);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                </CardTitle>
                <CardDescription>
                    Configure your payment receiving options
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="mpesa" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="mpesa" className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            M-Pesa
                        </TabsTrigger>
                        <TabsTrigger value="bank" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Bank Account
                        </TabsTrigger>
                    </TabsList>

                    {/* M-Pesa Tab */}
                    <TabsContent value="mpesa" className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="mpesa_phone">M-Pesa Phone Number</Label>
                            <Input
                                id="mpesa_phone"
                                type="tel"
                                value={localPayment.mpesa?.phone_number || ''}
                                onChange={(e) => handleMpesaChange('phone_number', e.target.value)}
                                placeholder="+254 7XX XXX XXX"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your registered M-Pesa phone number
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mpesa_business">Business Name (Optional)</Label>
                            <Input
                                id="mpesa_business"
                                value={localPayment.mpesa?.business_name || ''}
                                onChange={(e) => handleMpesaChange('business_name', e.target.value)}
                                placeholder="Your M-Pesa business name"
                            />
                            <p className="text-xs text-muted-foreground">
                                If you have a registered M-Pesa till or paybill
                            </p>
                        </div>
                    </TabsContent>

                    {/* Bank Account Tab */}
                    <TabsContent value="bank" className="mt-6 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ac_name">Account Name</Label>
                                <Input
                                    id="ac_name"
                                    value={localPayment.bank?.ac_name || ''}
                                    onChange={(e) => handleBankChange('ac_name', e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ac_number">Account Number</Label>
                                <Input
                                    id="ac_number"
                                    value={localPayment.bank?.ac_number || ''}
                                    onChange={(e) => handleBankChange('ac_number', e.target.value)}
                                    placeholder="XXXX XXXX XXXX"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bank_name">Bank Name</Label>
                                <Input
                                    id="bank_name"
                                    value={localPayment.bank?.bank_name || ''}
                                    onChange={(e) => handleBankChange('bank_name', e.target.value)}
                                    placeholder="Equity Bank"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bank_addr">Bank Branch</Label>
                                <Input
                                    id="bank_addr"
                                    value={localPayment.bank?.bank_addr || ''}
                                    onChange={(e) => handleBankChange('bank_addr', e.target.value)}
                                    placeholder="Nairobi Branch"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="routing_number">Routing Number</Label>
                                <Input
                                    id="routing_number"
                                    value={localPayment.bank?.routing_number || ''}
                                    onChange={(e) => handleBankChange('routing_number', e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="swift">SWIFT Code</Label>
                                <Input
                                    id="swift"
                                    value={localPayment.bank?.swift || ''}
                                    onChange={(e) => handleBankChange('swift', e.target.value)}
                                    placeholder="EABORBI"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="iban">IBAN (International)</Label>
                            <Input
                                id="iban"
                                value={localPayment.bank?.iban || ''}
                                onChange={(e) => handleBankChange('iban', e.target.value)}
                                placeholder="Optional - for international transfers"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
