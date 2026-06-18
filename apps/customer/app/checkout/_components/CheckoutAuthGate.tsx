'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Receipt, MapPin, Heart } from 'lucide-react';

interface CheckoutAuthGateProps {
  onSignIn: () => void;
  onGuest: () => void;
}

export default function CheckoutAuthGate({ onSignIn, onGuest }: CheckoutAuthGateProps) {
  const benefits = [
    {
      icon: Zap,
      title: "Faster Checkout",
      description: "Save your details for quicker orders",
    },
    {
      icon: Receipt,
      title: "Order History",
      description: "Track all your orders in one place",
    },
    {
      icon: MapPin,
      title: "Saved Addresses",
      description: "Store multiple delivery addresses",
    },
    {
      icon: Heart,
      title: "Wishlist",
      description: "Save items for later purchase",
    },
  ];

  return (
    <Card className="border-2 border-primary/5 shadow-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Sign in for a better experience
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Create an account or sign in to enjoy these exclusive perks.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-muted/50 transition-colors hover:bg-muted/50"
              >
                <div className="p-2 rounded-full bg-primary/10 text-primary mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2">
          <Button 
            onClick={onSignIn} 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] font-semibold"
          >
            Sign In / Join
          </Button>
          <Button 
            variant="ghost" 
            onClick={onGuest} 
            size="lg"
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          >
            Continue as Guest
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
