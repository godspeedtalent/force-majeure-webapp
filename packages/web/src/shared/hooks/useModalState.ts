import { useState, useCallback } from 'react';

/**
 * Return type for useModalState hook
 */
export interface UseModalStateReturn {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Toggle the modal open/closed state */
  toggle: () => void;
  /** Set the modal open state directly */
  setOpen: (open: boolean) => void;
}

/**
 * Hook for managing modal open/close state
 *
 * Provides a standardized interface for modal state management with
 * memoized callbacks to prevent unnecessary re-renders.
 *
 * @param initialOpen - Whether the modal should start open (default: false)
 * @returns Modal state and control functions
 *
 * @example
 * ```tsx
 * const { isOpen, open, close } = useModalState();
 *
 * return (
 *   <>
 *     <Button onClick={open}>Open Modal</Button>
 *     <Modal open={isOpen} onClose={close}>
 *       <p>Modal content</p>
 *     </Modal>
 *   </>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With initial open state
 * const deleteModal = useModalState(false);
 * const confirmModal = useModalState();
 *
 * // Chain modals
 * const handleDelete = () => {
 *   deleteModal.close();
 *   confirmModal.open();
 * };
 * ```
 */
export function useModalState(initialOpen = false): UseModalStateReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const setOpen = useCallback((value: boolean) => {
    setIsOpen(value);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
  };
}
