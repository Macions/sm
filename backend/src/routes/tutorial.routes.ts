// backend/src/routes/tutorial.routes.ts

import express from 'express';
import {
    getTutorials,
    getTutorialById,
    createTutorial,
    updateTutorial,
    deleteTutorial,
    deleteAttachment,
    getFile,
    upload
} from '../controllers/tutorial.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Wszystkie trasy wymagają autoryzacji
router.use(authMiddleware);

// 📥 Pobieranie
router.get('/tutorials', getTutorials);
router.get('/tutorials/:id', getTutorialById);

// 📤 Tworzenie i aktualizacja z plikami
router.post('/tutorials', upload.array('files', 5), createTutorial);
router.put('/tutorials/:id', upload.array('files', 5), updateTutorial);

// 🗑️ Usuwanie
router.delete('/tutorials/:id', deleteTutorial);
router.delete('/tutorials/attachments/:id', deleteAttachment);

// 📥 Pobieranie plików
router.get('/uploads/tutorials/:filename', getFile);

export default router;