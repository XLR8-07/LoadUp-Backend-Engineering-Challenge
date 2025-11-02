import { Router } from "express";
import type { ApplicationsController } from "../controllers/applications.controller";

export function createApplicationsRouter(controller: ApplicationsController): Router {
  const router = Router();

  router.get("/:id", controller.getApplication);

  return router;
}

export function createJobApplicationsRouter(controller: ApplicationsController): Router {
  const router = Router();

  router.post("/:id/applications", controller.createApplication);
  router.get("/:id/applications", controller.listApplicationsForJob);

  return router;
}

