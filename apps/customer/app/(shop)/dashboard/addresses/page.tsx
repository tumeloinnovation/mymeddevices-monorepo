'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    MapPin,
    Save,
    Plus,
    Trash2,
    Home,
    Briefcase,
    Search,
    Star,
    Edit2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { customerService } from '@/services/customerService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

// Minimal types for the refactored code
type Address = {
    id: string;
    address: string;
    tag?: string;
    isDefault?: boolean;
    region?: string;
};

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await customerService.getAddresses();
            setAddresses(data.map((a: any) => ({
                id: a.id,
                address: a.address1,
                tag: a.tag,
                isDefault: a.isDefault,
                region: a.city,
            })));
            setLoading(false);
        };
        loadData();
    }, []);

    const handleSave = async () => {
        await customerService.saveAddresses(addresses);
        toast.success('Addresses saved successfully');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Addresses</h1>
                </div>
                <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Addresses
                </Button>
            </div>

            {/* Saved Addresses List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Saved Addresses ({addresses.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {addresses.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">No saved addresses yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {addresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    className="group relative rounded-lg border p-4 hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-lg bg-muted">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground">
                                                {addr.address}
                                            </p>
                                            {addr.region && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {addr.region}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
