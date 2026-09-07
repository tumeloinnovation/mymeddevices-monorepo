/**
 * Utility functions for validating and resolving image URLs safely with Next.js Image component.
 */

export function isValidImageUrl(src: unknown): src is string {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

export function getValidImageUrl(
  src: unknown,
  fallback: string = '/logos/logo-portrait.png'
): string {
  return isValidImageUrl(src) ? (src as string).trim() : fallback;
}
