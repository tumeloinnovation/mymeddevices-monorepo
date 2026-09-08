import React from 'react';
import { sanitizeProductHtml } from '../../lib/sanitizer';

export interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * SafeHtml Component
 * Safely sanitizes and renders untrusted HTML content in the DOM.
 */
export function SafeHtml({ html, className, fallback = null }: SafeHtmlProps) {
  const sanitized = sanitizeProductHtml(html);

  if (!sanitized || sanitized.trim() === '') {
    return <>{fallback}</>;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
