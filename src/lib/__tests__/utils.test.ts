import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (className merge utility)', () => {
  // ========================================
  // EXAMPLE-BASED: Happy path, typical inputs
  // ========================================
  describe('happy path', () => {
    it('should merge single class name', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('should merge multiple class names', () => {
      expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-4', 'py-2', 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500');
    });

    it('should resolve conflicting Tailwind classes (last wins)', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    });

    it('should handle conditional classes with objects', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });

    it('should handle nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
    });

    it('should handle mixed inputs (strings, arrays, objects)', () => {
      expect(cn('base', ['flex', 'items-center'], { 'bg-white': true }))
        .toBe('base flex items-center bg-white');
    });
  });

  // ========================================
  // BOUNDARY: Empty, null, undefined, edge cases
  // ========================================
  describe('boundary cases', () => {
    it('should return empty string for no arguments', () => {
      expect(cn()).toBe('');
    });

    it('should handle undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('should handle null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('should handle false values', () => {
      expect(cn('foo', false, 'bar')).toBe('foo bar');
    });

    it('should handle empty string values', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('should handle empty array', () => {
      expect(cn([])).toBe('');
    });

    it('should handle empty object', () => {
      expect(cn({})).toBe('');
    });

    it('should handle object with all false values', () => {
      expect(cn({ foo: false, bar: false })).toBe('');
    });

    it('should handle 0 as value (falsy)', () => {
      expect(cn('foo', 0, 'bar')).toBe('foo bar');
    });

    it('should handle whitespace-only strings', () => {
      // clsx trims whitespace
      expect(cn('foo', '   ', 'bar')).toBe('foo bar');
    });
  });

  // ========================================
  // ERROR / EDGE CASES: Complex scenarios
  // ========================================
  describe('edge cases', () => {
    it('should keep identical non-Tailwind classes (clsx behavior)', () => {
      // clsx does NOT dedupe non-Tailwind classes
      expect(cn('foo', 'foo', 'foo')).toBe('foo foo foo');
    });

    it('should handle many conflicting Tailwind modifiers', () => {
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
    });

    it('should preserve responsive prefixes correctly', () => {
      expect(cn('md:px-4', 'lg:px-8')).toBe('md:px-4 lg:px-8');
    });

    it('should handle conflicting responsive prefixes', () => {
      expect(cn('md:px-4', 'md:px-8')).toBe('md:px-8');
    });

    it('should handle dark mode variants', () => {
      expect(cn('dark:bg-gray-800', 'dark:bg-gray-900')).toBe('dark:bg-gray-900');
    });

    it('should handle combination of variants', () => {
      expect(cn('hover:md:bg-red-500', 'hover:md:bg-blue-500')).toBe('hover:md:bg-blue-500');
    });

    it('should handle arbitrary values', () => {
      expect(cn('w-[100px]', 'h-[50px]')).toBe('w-[100px] h-[50px]');
    });

    it('should handle conflicting arbitrary values', () => {
      expect(cn('w-[100px]', 'w-[200px]')).toBe('w-[200px]');
    });

    it('should handle negative values', () => {
      expect(cn('-mt-4', '-ml-2')).toBe('-mt-4 -ml-2');
    });

    it('should handle important modifier', () => {
      expect(cn('!text-red-500', 'text-blue-500')).toBe('!text-red-500 text-blue-500');
    });

    it('should preserve non-Tailwind classes', () => {
      expect(cn('custom-class', 'another-class', 'px-4')).toBe('custom-class another-class px-4');
    });

    it('should handle numeric string values in object', () => {
      expect(cn({ 'class-1': true, 'class-2': false, 'class-3': true }))
        .toBe('class-1 class-3');
    });
  });

  // ========================================
  // REAL-WORLD SCENARIOS
  // ========================================
  describe('real-world scenarios', () => {
    it('should merge base component styles with variants', () => {
      const baseStyles = 'flex items-center justify-center rounded-lg';
      const sizeVariant = 'px-4 py-2 text-sm';
      const colorVariant = 'bg-blue-500 text-white';

      expect(cn(baseStyles, sizeVariant, colorVariant))
        .toBe('flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-blue-500 text-white');
    });

    it('should allow overriding base styles with props', () => {
      const baseStyles = 'bg-gray-100 text-gray-900 px-4';
      const propStyles = 'bg-blue-500 text-white';

      expect(cn(baseStyles, propStyles))
        .toBe('px-4 bg-blue-500 text-white');
    });

    it('should handle disabled state conditional', () => {
      const isDisabled = true;
      expect(cn(
        'btn',
        'bg-blue-500',
        { 'opacity-50 cursor-not-allowed': isDisabled }
      )).toBe('btn bg-blue-500 opacity-50 cursor-not-allowed');
    });

    it('should handle active/inactive states', () => {
      const isActive = false;
      expect(cn(
        'tab',
        isActive ? 'border-b-2 border-blue-500' : 'border-b-2 border-transparent'
      )).toBe('tab border-b-2 border-transparent');
    });
  });
});
