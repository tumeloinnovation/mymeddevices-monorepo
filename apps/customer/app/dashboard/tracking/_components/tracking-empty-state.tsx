'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface TrackingEmptyStateProps {
  hasOrders?: boolean;
}

/**
 * Empty state for tracking page
 * Shows different messages based on whether user has any orders
 */
export function TrackingEmptyState({ hasOrders = false }: TrackingEmptyStateProps) {
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
          {hasOrders ? (
            <Package className="h-12 w-12 text-muted-foreground" />
          ) : (
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        {/* Message */}
        {hasOrders ? (
          <>
            <h3 className="text-xl font-semibold mb-2">No active orders</h3>
            <p className="text-muted-foreground mb-6">
              Your orders have all been delivered. Track them here once you have new orders on the way.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold mb-2">No orders to track</h3>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet. Start shopping to track your deliveries here.
            </p>
            <Link href="/shop">
              <Button className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Start Shopping
              </Button>
            </Link>
          </>
        )}
      </Card>
    </motion.div>
  );
}
