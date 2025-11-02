import { Router } from "express";
import type { JobsController } from "../controllers/jobs.controller";

export function createJobsRouter(controller: JobsController): Router {
  const router = Router();

  router.post("/", controller.createJob);
  router.get("/", controller.listJobs);
  router.get("/:id", controller.getJob);

  return router;
}

