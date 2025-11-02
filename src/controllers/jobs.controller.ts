import type { Request, Response } from "express";
import type { JobsService } from "../application/jobs.service";
import { formatErrorResponse } from "../shared/errors";
import { logger } from "../shared/logger";

export class JobsController {
  constructor(private jobsService: JobsService) {}

  createJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await this.jobsService.createJob(req.body);
      logger.info("Job created", { jobId: job.id });
      res.status(201).json(job);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      logger.error("Failed to create job", { error: (error as Error).message });
      res.status(formatted.status).json(formatted.body);
    }
  };

  getJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await this.jobsService.getJob(req.params.id);
      res.status(200).json(job);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      res.status(formatted.status).json(formatted.body);
    }
  };

  listJobs = async (_req: Request, res: Response): Promise<void> => {
    try {
      const jobs = await this.jobsService.listJobs();
      res.status(200).json(jobs);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      logger.error("Failed to list jobs", { error: (error as Error).message });
      res.status(formatted.status).json(formatted.body);
    }
  };
}

