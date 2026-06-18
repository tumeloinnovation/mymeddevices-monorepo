'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { VendorBusinessHours } from '@/lib/data/types';

interface BusinessHoursSectionProps {
    businessHours: VendorBusinessHours;
    onChange: (hours: VendorBusinessHours) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

export function BusinessHoursSection({ businessHours, onChange }: BusinessHoursSectionProps) {
    const [localHours, setLocalHours] = useState<VendorBusinessHours>(businessHours);

    const handleEnabledChange = (enabled: boolean) => {
        const updated = { ...localHours, enabled };
        setLocalHours(updated);
        onChange(updated);
    };

    const handleDayStatusChange = (day: string, isOpen: boolean) => {
        const status = isOpen ? 'open' as const : 'close' as const;
        const updated: VendorBusinessHours = {
            ...localHours,
            time: {
                ...localHours.time,
                [day]: {
                    status,
                    opening_time: localHours.time[day]?.opening_time || ['09:00'],
                    closing_time: localHours.time[day]?.closing_time || ['17:00'],
                },
            },
        };
        setLocalHours(updated);
        onChange(updated);
    };

    const handleTimeChange = (day: string, type: 'opening_time' | 'closing_time', index: number, value: string) => {
        const existingDayData = localHours.time[day];
        const dayData = existingDayData || {
            status: 'open' as const,
            opening_time: ['09:00'],
            closing_time: ['17:00']
        };
        const times = [...(dayData[type] || [])];
        times[index] = value;

        const updated: VendorBusinessHours = {
            ...localHours,
            time: {
                ...localHours.time,
                [day]: {
                    ...dayData,
                    [type]: times,
                },
            },
        };
        setLocalHours(updated);
        onChange(updated);
    };

    const handleNoticeChange = (field: 'open_notice' | 'close_notice', value: string) => {
        const updated = { ...localHours, [field]: value };
        setLocalHours(updated);
        onChange(updated);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Business Hours
                </CardTitle>
                <CardDescription>
                    Set your store&apos;s operating hours
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="hours_enabled">Enable Business Hours</Label>
                        <p className="text-sm text-muted-foreground">
                            Show business hours on your store page
                        </p>
                    </div>
                    <Switch
                        id="hours_enabled"
                        checked={localHours.enabled}
                        onCheckedChange={handleEnabledChange}
                    />
                </div>

                {localHours.enabled && (
                    <>
                        {/* Days Schedule */}
                        <div className="space-y-4">
                            {DAYS.map((day) => {
                                const dayData = localHours.time[day];
                                const isOpen = dayData?.status === 'open';
                                const openingTime = dayData?.opening_time?.[0] || '09:00';
                                const closingTime = dayData?.closing_time?.[0] || '17:00';

                                return (
                                    <div
                                        key={day}
                                        className="flex items-center gap-4 rounded-lg border p-3"
                                    >
                                        <div className="w-28">
                                            <Label className="font-medium">{DAY_LABELS[day]}</Label>
                                        </div>

                                        <Switch
                                            checked={isOpen}
                                            onCheckedChange={(checked) => handleDayStatusChange(day, checked)}
                                        />

                                        {isOpen ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    type="time"
                                                    value={openingTime}
                                                    onChange={(e) => handleTimeChange(day, 'opening_time', 0, e.target.value)}
                                                    className="w-32"
                                                />
                                                <span className="text-muted-foreground">to</span>
                                                <Input
                                                    type="time"
                                                    value={closingTime}
                                                    onChange={(e) => handleTimeChange(day, 'closing_time', 0, e.target.value)}
                                                    className="w-32"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Closed</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Notices */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="open_notice">Open Notice</Label>
                                <Input
                                    id="open_notice"
                                    value={localHours.open_notice}
                                    onChange={(e) => handleNoticeChange('open_notice', e.target.value)}
                                    placeholder="We're open! Come visit us."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="close_notice">Closed Notice</Label>
                                <Input
                                    id="close_notice"
                                    value={localHours.close_notice}
                                    onChange={(e) => handleNoticeChange('close_notice', e.target.value)}
                                    placeholder="We're currently closed."
                                />
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
