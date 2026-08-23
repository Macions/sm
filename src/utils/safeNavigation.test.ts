
import { describe, it, expect, vi } from 'vitest';
import { safeNavigate } from './safeNavigation';

describe('safeNavigate', () => {
    it('powinien wywołać navigate z poprawną ścieżką', () => {
        const navigate = vi.fn();
        safeNavigate('/test', navigate);
        expect(navigate).toHaveBeenCalledWith('/test');
    });

    it('powinien wywołać navigate z pustą ścieżką gdy przekazano ""', () => {
        const navigate = vi.fn();
        safeNavigate('', navigate);

        expect(navigate).toHaveBeenCalledWith('');
    });

    it('powinien obsłużyć null - NIE WYWOŁAĆ navigate', () => {
        const navigate = vi.fn();

        expect(() => safeNavigate(null as any, navigate)).toThrow();
    });

    it('powinien obsłużyć undefined - NIE WYWOŁAĆ navigate', () => {
        const navigate = vi.fn();

        expect(() => safeNavigate(undefined as any, navigate)).toThrow();
    });
});