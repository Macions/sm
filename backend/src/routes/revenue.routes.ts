import { Router } from 'express';
import { revenueService } from '../services/revenue.service';

const router = Router();

// 🔥 ZMIEŃ - użyj query parameter zamiast :year?
router.get('/revenue', async (req, res) => {
    try {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const data = await revenueService.getMonthlyRevenue(year);
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ Błąd:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd pobierania danych przychodów' 
        });
    }
});

// 🔥 DODAJ endpoint POST - jeśli potrzebujesz
router.post('/revenue', async (req, res) => {
    try {
        const { month, year, revenue } = req.body;
        if (!month || !year || revenue === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Brak wymaganych danych: month, year, revenue' 
            });
        }
        // 🔥 TYMCZASOWO - zwróć błąd, bo metoda nie istnieje
        res.status(501).json({ 
            success: false, 
            message: 'Dodawanie przychodów nie jest jeszcze zaimplementowane' 
        });
    } catch (error) {
        console.error('❌ Błąd:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd dodawania przychodu' 
        });
    }
});

export default router;