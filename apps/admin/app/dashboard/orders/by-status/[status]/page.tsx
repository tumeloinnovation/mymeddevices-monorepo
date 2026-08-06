"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Redirect page for backward compatibility with old status-specific routes.
 *
 * Routes like /dashboard/orders/by-status/pending now redirect to
 * /dashboard/orders?status=pending to use the unified orders page.
 */
export default function StatusFilteredOrdersRedirectPage() {
  const { status } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to main orders page with status as query param
    const statusValue = (status as string)?.toLowerCase() || "pending";
    router.replace(`/dashboard/orders?status=${statusValue}`);
  }, [status, router]);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Redirecting to orders...
    </div>
  );
}
