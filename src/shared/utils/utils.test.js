import { describe, it, expect } from 'vitest';
import { cn } from './utils';
describe('cn (className utility)', () => {
    it('merges multiple class names', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });
    it('handles conditional classes', () => {
        expect(cn('base', false && 'conditional', 'always')).toBe('base always');
        expect(cn('base', true && 'conditional')).toBe('base conditional');
    });
    it('merges Tailwind classes correctly (removes duplicates)', () => {
        // twMerge should intelligently merge Tailwind classes
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
    it('handles arrays of classes', () => {
        expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });
    it('handles objects with boolean values', () => {
        expect(cn({
            active: true,
            disabled: false,
            primary: true,
        })).toBe('active primary');
    });
    it('handles undefined and null values', () => {
        expect(cn('base', undefined, null, 'end')).toBe('base end');
    });
    it('handles empty input', () => {
        expect(cn()).toBe('');
    });
    it('handles complex Tailwind utility conflicts', () => {
        // Later classes should override earlier ones for same utility
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
        expect(cn('bg-white', 'bg-black')).toBe('bg-black');
    });
    it('combines multiple input types', () => {
        expect(cn('base', ['array-class-1', 'array-class-2'], { conditional: true, hidden: false }, 'final')).toBe('base array-class-1 array-class-2 conditional final');
    });
});
