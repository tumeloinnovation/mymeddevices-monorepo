'use client';

import { cn } from '../../../lib/utils';
import { AUTH_COLORS } from '../auth-theme';

interface AuthHeaderProps {
  title: string;
  description?: string;
  className?: string;
  showLogo?: boolean;
}

export function AuthHeader({
  title,
  description,
  className,
  showLogo = true,
}: AuthHeaderProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-orange-600 to-amber-600 p-8 text-white relative',
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />

      <div className="relative z-10">
        {showLogo && (
          <div className="flex items-center justify-between mb-4">
            <img
              src="/logos/logo-landscape.png"
              alt="MyMedDevices Logo"
              className="h-10 brightness-0 invert"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement)
                  .nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <div className="hidden text-xl font-bold tracking-tight text-white">
              MyMedDevices
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-1">{title}</h2>
        {description && (
          <p className="text-white/90 text-sm">{description}</p>
        )}
      </div>
    </div>
  );
}
