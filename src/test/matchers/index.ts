/**
 * Test matchers and utilities for enhanced testing experience
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVisible(): R;
      toHaveLoadingState(): R;
      toHaveErrorState(): R;
    }
  }
}

/**
 * Custom matcher to check if an element is visible
 */
export const toBeVisible = (received: HTMLElement) => {
  const isVisible = received.offsetParent !== null;
  
  if (isVisible) {
    return {
      message: () => `expected element to not be visible`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected element to be visible`,
      pass: false,
    };
  }
};

/**
 * Custom matcher to check if a component has loading state
 */
export const toHaveLoadingState = (received: HTMLElement) => {
  const hasLoadingIndicator = received.querySelector('[data-testid="loading"]') !== null ||
                             received.querySelector('.animate-spin') !== null ||
                             received.textContent?.includes('Loading...') || false;
  
  if (hasLoadingIndicator) {
    return {
      message: () => `expected element to not have loading state`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected element to have loading state`,
      pass: false,
    };
  }
};

/**
 * Custom matcher to check if a component has error state
 */
export const toHaveErrorState = (received: HTMLElement) => {
  const hasErrorIndicator = received.querySelector('[data-testid="error"]') !== null ||
                           received.querySelector('.text-red-500') !== null ||
                           received.textContent?.includes('Error') || false;
  
  if (hasErrorIndicator) {
    return {
      message: () => `expected element to not have error state`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected element to have error state`,
      pass: false,
    };
  }
};

// Export all custom matchers
export const customMatchers = {
  toBeVisible,
  toHaveLoadingState,
  toHaveErrorState,
};