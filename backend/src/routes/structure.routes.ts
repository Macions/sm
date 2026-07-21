// A:\sm system\sm\backend\src\routes\structure.routes.ts

import { Router } from "express";
import { StructureController } from "../controllers/structure.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const structureController = new StructureController();

// Wszystkie trasy wymagają autoryzacji
router.use(authMiddleware);

router.get("/", structureController.getFullStructure.bind(structureController));
router.get("/team/:id", structureController.getTeamById.bind(structureController));

export default router;