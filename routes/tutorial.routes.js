"use strict";
// backend/src/routes/tutorial.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tutorial_controller_1 = require("../controllers/tutorial.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Wszystkie trasy wymagają autoryzacji
router.use(auth_middleware_1.authMiddleware);
// 📥 Pobieranie
router.get('/tutorials', tutorial_controller_1.getTutorials);
router.get('/tutorials/:id', tutorial_controller_1.getTutorialById);
// 📤 Tworzenie i aktualizacja z plikami
router.post('/tutorials', tutorial_controller_1.upload.array('files', 5), tutorial_controller_1.createTutorial);
router.put('/tutorials/:id', tutorial_controller_1.upload.array('files', 5), tutorial_controller_1.updateTutorial);
// 🗑️ Usuwanie
router.delete('/tutorials/:id', tutorial_controller_1.deleteTutorial);
router.delete('/tutorials/attachments/:id', tutorial_controller_1.deleteAttachment);
// 📥 Pobieranie plików
router.get('/uploads/tutorials/:filename', tutorial_controller_1.getFile);
exports.default = router;
