/**
 * Reusable Validation Utilities
 */

export const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile.trim());
};

export const validateRequired = (value: string): boolean => {
    return value.trim().length >= 2;
};

export const validatePrice = (price: number): boolean => {
    return price > 0;
};

/**
 * Extract a readable error message from an Axios/API error
 */
export const getApiError = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { detail?: string | { msg: string }[] } } }).response;
        if (res?.data?.detail) {
            const detail = res.data.detail;
            if (typeof detail === 'string') return detail;
            if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
        }
    }
    return 'An unexpected error occurred. Please try again.';
};
