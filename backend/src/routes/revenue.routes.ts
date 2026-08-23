
import { Router } from 'express';
import { revenueService } from '../services/revenue.service';

const router = Router();


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


router.get('/revenue/details', async (req, res) => {
    try {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const month = parseInt(req.query.month as string) || 1;

        if (month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Miesiąc musi być między 1 a 12'
            });
        }


        const details = await revenueService.getMonthlyDetails(year, month);
        res.json({ success: true, data: details });
    } catch (error) {
        console.error('❌ Błąd:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania szczegółów'
        });
    }
});
router.get('/revenue/categories', async (req, res) => {
    try {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const data = await revenueService.getRevenueByCategory(year);
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ Błąd:', error);
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania kategorii'
        });
    }
});

export default router;