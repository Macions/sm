"use strict";
// backend/src/routes/member.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const member_controller_1 = require("../controllers/member.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Wszystkie trasy wymagają autoryzacji
router.use(auth_middleware_1.authMiddleware);
// 📥 Pobieranie
router.get('/members', member_controller_1.getMembers);
router.get('/members/:id', member_controller_1.getMemberById);
// 📤 Tworzenie
router.post('/members', member_controller_1.createMember);
// 📝 Aktualizacja
router.put('/members/:id', member_controller_1.updateMember);
// 🗑️ Usuwanie
router.delete('/members/:id', member_controller_1.deleteMember);
exports.default = router;
