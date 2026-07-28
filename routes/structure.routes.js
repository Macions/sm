"use strict";
// A:\sm system\sm\backend\src\routes\structure.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const structure_controller_1 = require("../controllers/structure.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const structureController = new structure_controller_1.StructureController();
// Wszystkie trasy wymagają autoryzacji
router.use(auth_middleware_1.authMiddleware);
router.get("/", structureController.getFullStructure.bind(structureController));
router.get("/team/:id", structureController.getTeamById.bind(structureController));
exports.default = router;
