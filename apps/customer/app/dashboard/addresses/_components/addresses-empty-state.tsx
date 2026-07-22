'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddressesEmptyStateProps {
  onAdd: () => void;
}

/**
 * Empty state for addresses page
 * Shows when user has no addresses saved
 */
export function AddressesEmptyState({ onAdd }: AddressesEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <Card className="w-full max-w-md p-8 text-center">
        {/* Illustration */}
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-primary/5">
          <MapPin className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold mb-2">No saved addresses</h3>
        <p className="text-muted-foreground mb-6">
          Add your home and work addresses for faster checkout. We'll use Google Maps to find your location.
        </p>

        {/* CTA */}
        <Button onClick={onAdd} className="gap-2">
          <Truck className="h-4 w-4" />
          Add Your First Address
        </Button>
      </Card>
    </motion.div>
  );
}
