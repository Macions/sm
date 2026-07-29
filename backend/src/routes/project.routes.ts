
import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const projectController = new ProjectController();


router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.get("/pillar/:pillar", projectController.getProjectsByPillar);
router.get("/status/:status", projectController.getProjectsByStatus);


router.post("/", authMiddleware, projectController.createProject);
router.put("/:id", authMiddleware, projectController.updateProject);
router.delete("/:id", authMiddleware, projectController.deleteProject);

export default router;