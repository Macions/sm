import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
    beforeAll(() => {

        const root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);
    });

    it('powinien renderować aplikację', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );
        expect(document.querySelector('#root')).toBeInTheDocument();
    });
});