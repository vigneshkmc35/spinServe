/**
 * Reusable Validation Utilities
 */

export const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
};

export const validateRequired = (value: string): boolean => {
    return value.trim().length > 0;
};

export const validatePrice = (price: number): boolean => {
    return price > 0;
};

/**
 * Reusable UI Utilities
 */

export const confirmAction = (message: string): boolean => {
    return window.confirm(message);
};
