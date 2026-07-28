"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/project.routes.ts
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const projectController = new project_controller_1.ProjectController();
// Publiczne endpointy (do odczytu) - nie wymagają autoryzacji
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.get("/pillar/:pillar", projectController.getProjectsByPillar);
router.get("/status/:status", projectController.getProjectsByStatus);
// Chronione endpointy (do zarządzania) - wymagają autoryzacji
router.post("/", auth_middleware_1.authMiddleware, projectController.createProject);
router.put("/:id", auth_middleware_1.authMiddleware, projectController.updateProject);
router.delete("/:id", auth_middleware_1.authMiddleware, projectController.deleteProject);
exports.default = router;
