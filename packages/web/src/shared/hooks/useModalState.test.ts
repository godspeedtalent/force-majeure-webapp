import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalState } from './useModalState';

describe('useModalState', () => {
  describe('initialization', () => {
    it('should initialize with isOpen false by default', () => {
      const { result } = renderHook(() => useModalState());
      expect(result.current.isOpen).toBe(false);
    });

    it('should initialize with isOpen true when initialOpen is true', () => {
      const { result } = renderHook(() => useModalState(true));
      expect(result.current.isOpen).toBe(true);
    });

    it('should initialize with isOpen false when initialOpen is false', () => {
      const { result } = renderHook(() => useModalState(false));
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('open', () => {
    it('should set isOpen to true when open is called', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should keep isOpen true if already open', () => {
      const { result } = renderHook(() => useModalState(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('close', () => {
    it('should set isOpen to false when close is called', () => {
      const { result } = renderHook(() => useModalState(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should keep isOpen false if already closed', () => {
      const { result } = renderHook(() => useModalState(false));

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should toggle from false to true', () => {
      const { result } = renderHook(() => useModalState(false));

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should toggle from true to false', () => {
      const { result } = renderHook(() => useModalState(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle multiple toggles correctly', () => {
      const { result } = renderHook(() => useModalState(false));

      act(() => {
        result.current.toggle(); // false -> true
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle(); // true -> false
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle(); // false -> true
      });
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('setOpen', () => {
    it('should set isOpen to true', () => {
      const { result } = renderHook(() => useModalState(false));

      act(() => {
        result.current.setOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should set isOpen to false', () => {
      const { result } = renderHook(() => useModalState(true));

      act(() => {
        result.current.setOpen(false);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle same value without changing state', () => {
      const { result } = renderHook(() => useModalState(true));

      act(() => {
        result.current.setOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('callback stability', () => {
    it('should maintain stable callback references across renders', () => {
      const { result, rerender } = renderHook(() => useModalState());

      const initialOpen = result.current.open;
      const initialClose = result.current.close;
      const initialToggle = result.current.toggle;
      const initialSetOpen = result.current.setOpen;

      // Trigger a state change to cause re-render
      act(() => {
        result.current.open();
      });

      // Callbacks should remain the same references
      expect(result.current.open).toBe(initialOpen);
      expect(result.current.close).toBe(initialClose);
      expect(result.current.toggle).toBe(initialToggle);
      expect(result.current.setOpen).toBe(initialSetOpen);

      // Force another rerender
      rerender();

      expect(result.current.open).toBe(initialOpen);
      expect(result.current.close).toBe(initialClose);
      expect(result.current.toggle).toBe(initialToggle);
      expect(result.current.setOpen).toBe(initialSetOpen);
    });
  });

  describe('combined operations', () => {
    it('should handle open followed by close', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle setOpen overriding toggle', () => {
      const { result } = renderHook(() => useModalState(false));

      act(() => {
        result.current.toggle(); // -> true
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.setOpen(false); // explicit false
      });
      expect(result.current.isOpen).toBe(false);
    });
  });
});
