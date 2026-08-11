import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Czyść po każdym teście
afterEach(() => {
    cleanup();
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
globalThis.localStorage = localStorageMock as any;

// Mock fetch
globalThis.fetch = vi.fn();

// 🔥 POPRAWIONE - mock całego modułu react-hot-toast z Toaster
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
        Toaster: actual.Toaster, // 🔥 DODAJ Toaster
    };
});

// Mock logger
vi.mock('@/utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));