// src/components/common/ConfirmDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
    it('powinien wyświetlić tytuł i wiadomość', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test"
                message="Wiadomość testowa"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
                confirmText="Potwierdź"
            />
        );
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Wiadomość testowa')).toBeInTheDocument();
    });

    it('powinien wywołać onConfirm po kliknięciu', async () => {
        const onConfirm = vi.fn();
        const user = userEvent.setup();
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test"
                message="Wiadomość"
                onConfirm={onConfirm}
                onCancel={vi.fn()}
                confirmText="Potwierdź"
            />
        );
        await user.click(screen.getByText('Potwierdź'));
        expect(onConfirm).toHaveBeenCalled();
    });
});