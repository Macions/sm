import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';


afterEach(() => {
    cleanup();
});


const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
globalThis.localStorage = localStorageMock as any;


globalThis.fetch = vi.fn();


vi.mock('react-hot-toast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-hot-toast')>();
    return {
        ...actual,
        default: {
            success: vi.fn(),
            error: vi.fn(),
            loading: vi.fn(),
            dismiss: vi.fn(),
        },
        Toaster: actual.Toaster, 
    };
});


vi.mock('@/utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));