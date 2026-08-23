"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewStaffRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/users/staff?create=true");
  }, [router]);

  return null;
}
