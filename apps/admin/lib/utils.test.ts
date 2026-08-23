import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('admin cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');
  });

  it('handles conditional classes and falsy values', () => {
    const isHidden = false;
    const isVisible = true;
    expect(cn('base-class', isHidden && 'hidden', isVisible && 'block', null, undefined)).toBe('base-class block');
  });

  it('resolves conflicting tailwind classes via tailwind-merge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-green-500')).toBe('text-green-500');
  });
});
