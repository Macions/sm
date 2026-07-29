

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


router.use(authMiddleware);


router.get('/members', getMembers);
router.get('/members/:id', getMemberById);


router.post('/members', createMember);


router.put('/members/:id', updateMember);


router.delete('/members/:id', deleteMember);

export default router;