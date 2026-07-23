// backend/src/routes/member.routes.ts

import express from 'express';
import {
    getMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
} from '../controllers/member.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Wszystkie trasy wymagają autoryzacji
router.use(authMiddleware);

// 📥 Pobieranie
router.get('/members', getMembers);
router.get('/members/:id', getMemberById);

// 📤 Tworzenie
router.post('/members', createMember);

// 📝 Aktualizacja
router.put('/members/:id', updateMember);

// 🗑️ Usuwanie
router.delete('/members/:id', deleteMember);

export default router;