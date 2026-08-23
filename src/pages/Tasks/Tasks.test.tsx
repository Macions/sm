
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Tasks from './Tasks';

describe('Tasks', () => {
    beforeEach(() => {

        globalThis.fetch = vi.fn().mockImplementation(() => {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([]),
            });
        });
    });

    it('powinien wyświetlić tytuł "Zadania"', async () => {
        render(
            <BrowserRouter>
                <Tasks />
            </BrowserRouter>
        );


        await waitFor(() => {
            expect(screen.getByText('Zadania')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić "Brak zadań" gdy lista jest pusta', async () => {
        render(
            <BrowserRouter>
                <Tasks />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Brak zadań')).toBeInTheDocument();
        });
    });
});