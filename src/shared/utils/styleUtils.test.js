import { describe, it, expect } from 'vitest';
import { getListItemClasses, getInputClasses, getLabelClasses, getDepthClasses, getButtonClasses, toSentenceCase, formatHeader, getCardClasses, getIconButtonClasses, getSpacing, } from './styleUtils';
describe('getListItemClasses', () => {
    it('returns even classes for even indices', () => {
        const result = getListItemClasses(0);
        expect(result).toContain('bg-background/40');
    });
    it('returns odd classes for odd indices', () => {
        const result = getListItemClasses(1);
        expect(result).toContain('bg-background/60');
    });
    it('alternates between even and odd classes', () => {
        expect(getListItemClasses(0)).not.toBe(getListItemClasses(1));
        expect(getListItemClasses(2)).toBe(getListItemClasses(0));
        expect(getListItemClasses(3)).toBe(getListItemClasses(1));
    });
    it('merges custom classes', () => {
        const result = getListItemClasses(0, 'custom-class');
        expect(result).toContain('custom-class');
    });
});
describe('getInputClasses', () => {
    it('returns base input classes', () => {
        const result = getInputClasses();
        expect(result).toContain('border');
        expect(result).toContain('border-input');
    });
    it('includes Canela font', () => {
        const result = getInputClasses();
        expect(result).toContain('font-canela');
    });
    it('includes sharp corners', () => {
        const result = getInputClasses();
        expect(result).toContain('rounded-none');
    });
    it('merges custom classes', () => {
        const result = getInputClasses('w-full h-12');
        expect(result).toContain('w-full');
        expect(result).toContain('h-12');
    });
});
describe('getLabelClasses', () => {
    it('returns default classes when not focused', () => {
        const result = getLabelClasses(false);
        expect(result).toContain('text-muted-foreground');
    });
    it('returns focused classes when focused', () => {
        const result = getLabelClasses(true);
        expect(result).toContain('text-fm-gold');
    });
    it('defaults to not focused', () => {
        const defaultResult = getLabelClasses();
        const explicitResult = getLabelClasses(false);
        expect(defaultResult).toBe(explicitResult);
    });
    it('merges custom classes', () => {
        const result = getLabelClasses(false, 'custom-label');
        expect(result).toContain('custom-label');
    });
});
describe('getDepthClasses', () => {
    it('returns level 0 (transparent with outline)', () => {
        const result = getDepthClasses(0);
        expect(result).toContain('bg-transparent');
        expect(result).toContain('border');
    });
    it('returns level 1 (base frosted glass)', () => {
        const result = getDepthClasses(1);
        expect(result).toContain('bg-black/60');
        expect(result).toContain('backdrop-blur-sm');
    });
    it('returns level 2 (elevated frosted glass)', () => {
        const result = getDepthClasses(2);
        expect(result).toContain('bg-black/70');
        expect(result).toContain('backdrop-blur-md');
    });
    it('returns level 3 (high elevation frosted glass)', () => {
        const result = getDepthClasses(3);
        expect(result).toContain('bg-black/80');
        expect(result).toContain('backdrop-blur-lg');
    });
    it('merges custom classes', () => {
        const result = getDepthClasses(1, 'custom-depth');
        expect(result).toContain('custom-depth');
    });
});
describe('getButtonClasses', () => {
    it('returns primary button classes', () => {
        const result = getButtonClasses('primary');
        expect(result).toContain('bg-fm-gold');
        expect(result).toContain('text-black');
    });
    it('returns secondary button classes', () => {
        const result = getButtonClasses('secondary');
        expect(result).toContain('bg-fm-crimson');
        expect(result).toContain('text-white');
    });
    it('returns danger button classes', () => {
        const result = getButtonClasses('danger');
        expect(result).toContain('bg-fm-danger');
        expect(result).toContain('text-white');
    });
    it('returns info button classes', () => {
        const result = getButtonClasses('info');
        expect(result).toContain('bg-fm-navy');
        expect(result).toContain('text-white');
    });
    it('returns outline button classes', () => {
        const result = getButtonClasses('outline');
        expect(result).toContain('bg-transparent');
        expect(result).toContain('border');
        expect(result).toContain('border-fm-gold');
    });
    it('defaults to primary variant', () => {
        const defaultResult = getButtonClasses();
        const explicitResult = getButtonClasses('primary');
        expect(defaultResult).toBe(explicitResult);
    });
    it('includes Canela font', () => {
        const result = getButtonClasses();
        expect(result).toContain('font-canela');
    });
    it('includes sharp corners', () => {
        const result = getButtonClasses();
        expect(result).toContain('rounded-none');
    });
    it('merges custom classes', () => {
        const result = getButtonClasses('primary', 'w-full');
        expect(result).toContain('w-full');
    });
});
describe('toSentenceCase', () => {
    it('converts all caps to sentence case', () => {
        expect(toSentenceCase('HELLO WORLD')).toBe('Hello world');
    });
    it('converts all lowercase to sentence case', () => {
        expect(toSentenceCase('hello world')).toBe('Hello world');
    });
    it('converts mixed case to sentence case', () => {
        expect(toSentenceCase('hELLO wORLD')).toBe('Hello world');
    });
    it('handles single character', () => {
        expect(toSentenceCase('a')).toBe('A');
        expect(toSentenceCase('Z')).toBe('Z');
    });
    it('handles empty string', () => {
        expect(toSentenceCase('')).toBe('');
    });
    it('preserves spaces', () => {
        expect(toSentenceCase('HELLO   WORLD')).toBe('Hello   world');
    });
});
describe('formatHeader', () => {
    it('converts to sentence case and adds period', () => {
        expect(formatHeader('WELCOME TO THE EVENT')).toBe('Welcome to the event.');
    });
    it('does not add period if one exists', () => {
        expect(formatHeader('Hello world.')).toBe('Hello world.');
    });
    it('does not add period after question mark', () => {
        expect(formatHeader('Are you sure?')).toBe('Are you sure?');
    });
    it('does not add period after exclamation mark', () => {
        expect(formatHeader('Welcome!')).toBe('Welcome!');
    });
    it('respects addPeriod parameter', () => {
        expect(formatHeader('Click here', false)).toBe('Click here');
        expect(formatHeader('Click here', true)).toBe('Click here.');
    });
    it('defaults to adding period', () => {
        expect(formatHeader('Hello')).toBe('Hello.');
    });
    it('handles empty string', () => {
        expect(formatHeader('')).toBe('');
    });
    it('handles mixed case input', () => {
        expect(formatHeader('HELLO WORLD')).toBe('Hello world.');
        expect(formatHeader('hello WORLD')).toBe('Hello world.');
    });
});
describe('getCardClasses', () => {
    it('returns outline card classes (depth 0)', () => {
        const result = getCardClasses('outline');
        expect(result).toContain('bg-transparent');
        expect(result).toContain('border');
    });
    it('returns frosted card classes (depth 1)', () => {
        const result = getCardClasses('frosted');
        expect(result).toContain('bg-black/60');
    });
    it('returns elevated card classes (depth 2)', () => {
        const result = getCardClasses('elevated');
        expect(result).toContain('bg-black/70');
    });
    it('returns high card classes (depth 3)', () => {
        const result = getCardClasses('high');
        expect(result).toContain('bg-black/80');
    });
    it('defaults to frosted variant', () => {
        const defaultResult = getCardClasses();
        const explicitResult = getCardClasses('frosted');
        expect(defaultResult).toBe(explicitResult);
    });
    it('includes sharp corners', () => {
        const result = getCardClasses();
        expect(result).toContain('rounded-none');
    });
    it('includes medium padding', () => {
        const result = getCardClasses();
        expect(result).toContain('p-[20px]');
    });
    it('merges custom classes', () => {
        const result = getCardClasses('frosted', 'custom-card');
        expect(result).toContain('custom-card');
    });
});
describe('getIconButtonClasses', () => {
    it('returns base icon button classes', () => {
        const result = getIconButtonClasses();
        expect(result).toContain('p-[5px]');
        expect(result).toContain('text-white');
    });
    it('includes sharp corners', () => {
        const result = getIconButtonClasses();
        expect(result).toContain('rounded-none');
    });
    it('includes gold hover effect', () => {
        const result = getIconButtonClasses();
        expect(result).toContain('hover:text-fm-gold');
    });
    it('includes transition', () => {
        const result = getIconButtonClasses();
        expect(result).toContain('transition-colors');
    });
    it('merges custom classes', () => {
        const result = getIconButtonClasses('custom-icon-btn');
        expect(result).toContain('custom-icon-btn');
    });
});
describe('getSpacing', () => {
    it('returns correct spacing for xs', () => {
        expect(getSpacing('xs')).toBe('5px');
    });
    it('returns correct spacing for sm', () => {
        expect(getSpacing('sm')).toBe('10px');
    });
    it('returns correct spacing for md', () => {
        expect(getSpacing('md')).toBe('20px');
    });
    it('returns correct spacing for lg', () => {
        expect(getSpacing('lg')).toBe('40px');
    });
    it('returns correct spacing for xl', () => {
        expect(getSpacing('xl')).toBe('60px');
    });
    it('follows design system scale (5, 10, 20, 40, 60)', () => {
        const spacings = ['xs', 'sm', 'md', 'lg', 'xl'];
        const values = spacings.map(s => getSpacing(s));
        expect(values).toEqual(['5px', '10px', '20px', '40px', '60px']);
    });
});
