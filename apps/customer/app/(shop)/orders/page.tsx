'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated, hydrated } = useAuthStore();
    const [orderSearchId, setOrderSearchId] = useState('');

    useEffect(() => {
        // Wait for auth to hydrate
        if (!hydrated) return;

        // Redirect authenticated users to their dashboard orders
        if (isAuthenticated) {
            router.push('/dashboard/orders');
        }
    }, [isAuthenticated, hydrated, router]);

    // Show loading while checking auth
    if (!hydrated) {
        return (
            <div className="container mx-auto p-4">
                <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-12 text-center">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If authenticated, don't show content (will redirect)
    if (isAuthenticated) {
        return null;
    }

    const handleTrackOrder = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = orderSearchId.trim();
        if (!trimmedId) {
            toast.error('Please enter a valid Order ID');
            return;
        }
        router.push(`/orders/${trimmedId}`);
    };

    return (
        <div className="container mx-auto p-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Your Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Track Guest Order */}
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                            <Search className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Track Your Order</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Enter your Order ID / Number below to view your order status, tracking updates, and receipt details.
                        </p>
                        <form onSubmit={handleTrackOrder} className="max-w-md mx-auto flex gap-2">
                            <Input
                                type="text"
                                placeholder="Enter Order ID (e.g. 123456)"
                                value={orderSearchId}
                                onChange={(e) => setOrderSearchId(e.target.value)}
                                className="flex-1"
                                required
                            />
                            <Button type="submit" className="gap-2">
                                <Search className="h-4 w-4" />
                                Track
                            </Button>
                        </form>
                    </div>

                    {/* Additional Info */}
                    <div className="border-t pt-6">
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                            <Package className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-foreground mb-1">Need Help?</p>
                                <p>
                                    If you cannot find your Order ID, check the order confirmation email or message sent to your registered contact details.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Back to Shopping */}
                    <div className="text-center pt-4">
                        <Link href="/products">
                            <Button variant="outline">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
