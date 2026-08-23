"use client";

import { forwardRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";

interface NavigationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  replace?: boolean;
  children: React.ReactNode;
  className?: string;
  pendingClassName?: string;
}

export const NavigationLink = forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({ href, replace, children, className, pendingClassName, onClick, ...props }, ref) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        e.preventDefault();
        startTransition(() => {
          if (replace) {
            router.replace(href);
          } else {
            router.push(href);
          }
        });
      }
    };

    return (
      <Link
        ref={ref}
        href={href}
        onClick={handleClick}
        className={cn(
          className,
          isPending && pendingClassName
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

NavigationLink.displayName = "NavigationLink";