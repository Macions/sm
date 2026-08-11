import { describe, it, expect } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
    it('powinien mieć metodę debug', () => {
        expect(logger.debug).toBeDefined();
    });

    it('powinien mieć metodę info', () => {
        expect(logger.info).toBeDefined();
    });

    it('powinien mieć metodę warn', () => {
        expect(logger.warn).toBeDefined();
    });

    it('powinien mieć metodę error', () => {
        expect(logger.error).toBeDefined();
    });
});