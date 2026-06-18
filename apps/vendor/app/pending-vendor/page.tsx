'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Phone, Mail, Home, User, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';
import { toast } from 'sonner';

export default function VendorPendingPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Redirect if not authenticated or not a vendor
    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.push('/');
        }
    }, [isAuthenticated, user, router]);

    const checkStatus = async () => {
        setIsRefreshing(true);
        // Mock status check delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsRefreshing(false);
        toast.info('Account is still under review .');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-background via-muted/10 to-background lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-7xl">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader className="text-center pb-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-3">
                            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <CardTitle className="text-2xl lg:text-3xl">Account Under Review</CardTitle>
                        <CardDescription className="text-sm lg:text-base mt-1">
                            Thank you for registering as a vendor with MyMedDevices!
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Main Grid Layout */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Status & Timeline */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg">Application Status</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={checkStatus}
                                        disabled={isRefreshing}
                                        className="h-8 gap-2"
                                    >
                                        {isRefreshing ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        )}
                                        Refresh
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-sm">Application Submitted</p>
                                            <p className="text-xs text-muted-foreground">
                                                We've received your registration
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-sm">Review in Progress</p>
                                            <p className="text-xs text-muted-foreground">
                                                Our team is reviewing your application
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="border-t pt-6">
                                <h4 className="font-semibold mb-3">What's Next?</h4>
                                <ul className="space-y-2 text-xs text-muted-foreground">
                                    <li>• Review of business information</li>
                                    <li>• VAT/Tax number verification</li>
                                    <li>• Email notification (24-48 hours)</li>
                                    <li>• Full dashboard access upon approval</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Middle Column - Actions & Browse */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-6 space-y-6">
                            {/* Browse Products */}
                            <div>
                                <h4 className="font-semibold mb-3">While You Wait</h4>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Browse our medical supplies catalog and familiarize yourself with available products.
                                </p>
                                <Button
                                    onClick={() => router.push('/')}
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                                    size="lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <Home className="mr-2 h-5 w-5" />
                                    <span className="font-semibold">Browse Products</span>
                                </Button>
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                    Explore over 10,000+ medical supplies
                                </p>
                            </div>

                            {/* Contact Support */}
                            <div className="border-t pt-6">
                                <h4 className="font-semibold mb-3">Need Help?</h4>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Questions about your application? Contact support.
                                </p>
                                <div className="space-y-3">
                                    <a
                                        href="mailto:support@mymeddevices.com"
                                        className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
                                    >
                                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Mail className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-muted-foreground">Email Us</p>
                                            <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                                support@mymeddevices.com
                                            </p>
                                        </div>
                                    </a>

                                    <Link
                                        href="tel:+254715250836"
                                        className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
                                    >
                                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Phone className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-muted-foreground">Call Us</p>
                                            <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                                                +254 715 250 836
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column - Submitted Info */}
                    {user.email && (
                        <Card className="lg:col-span-1">
                            <CardContent className="p-6">
                                <h4 className="font-semibold mb-4">Submitted Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground mb-0.5">Email Address</p>
                                            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    {user.phone && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-muted-foreground mb-0.5">Phone Number</p>
                                                <p className="text-sm font-medium text-foreground">{user.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {user.displayName && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                                                <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
