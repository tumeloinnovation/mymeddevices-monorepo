'use client'

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function useNavigationTransition() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const navigate = (href: string, options?: { replace?: boolean }) => {
    startTransition(() => {
      if (options?.replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    });
  };

  return { isPending, navigate };
}