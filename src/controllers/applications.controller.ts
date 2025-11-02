import type { Request, Response } from "express";
import type { ApplicationsService, ListApplicationsQuery } from "../application/applications.service";
import { formatErrorResponse } from "../shared/errors";
import { logger } from "../shared/logger";

export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  createApplication = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = req.params.id;
      const application = await this.applicationsService.createApplication(jobId, req.body);
      logger.info("Application created", { 
        applicationId: application.id, 
        jobId,
        score: application.score.total 
      });
      res.status(201).json(application);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      logger.error("Failed to create application", { error: (error as Error).message });
      res.status(formatted.status).json(formatted.body);
    }
  };

  listApplicationsForJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = req.params.id;
      const sortParam = req.query.sort as string | undefined;
      const query: ListApplicationsQuery = {
        sort: (sortParam === "score_asc" || sortParam === "score_desc") ? sortParam : "score_desc",
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };
      
      const applications = await this.applicationsService.listApplicationsForJob(jobId, query);
      res.status(200).json(applications);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      res.status(formatted.status).json(formatted.body);
    }
  };

  getApplication = async (req: Request, res: Response): Promise<void> => {
    try {
      const application = await this.applicationsService.getApplication(req.params.id);
      res.status(200).json(application);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      res.status(formatted.status).json(formatted.body);
    }
  };
}

