"use client";

import { forwardRef } from "react";
import { useNavigationTransition } from "@/lib/hooks/useNavigationTransition";
import { cn } from "../../lib/utils";

interface NavigationLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  replace?: boolean;
  children: React.ReactNode;
  className?: string;
  pendingClassName?: string;
}

export const NavigationLink = forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({ href, replace, children, className, pendingClassName, onClick, ...props }, ref) => {
    const { isPending, navigate } = useNavigationTransition();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      navigate(href, { replace });
      onClick?.(e);
    };

    return (
      <a
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
      </a>
    );
  }
);

NavigationLink.displayName = "NavigationLink";