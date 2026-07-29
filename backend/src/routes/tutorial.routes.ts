

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


router.use(authMiddleware);


router.get('/tutorials', getTutorials);
router.get('/tutorials/:id', getTutorialById);


router.post('/tutorials', upload.array('files', 5), createTutorial);
router.put('/tutorials/:id', upload.array('files', 5), updateTutorial);


router.delete('/tutorials/:id', deleteTutorial);
router.delete('/tutorials/attachments/:id', deleteAttachment);


router.get('/uploads/tutorials/:filename', getFile);

export default router;