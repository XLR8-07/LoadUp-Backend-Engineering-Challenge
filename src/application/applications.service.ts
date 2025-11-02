import { v4 as uuidv4 } from "uuid";
import type { Application, ApplicationAnswer, CandidateInfo } from "../domain/application";
import type { ApplicationRepository } from "../infra/repositories/ApplicationRepository";
import type { JobRepository } from "../infra/repositories/JobRepository";
import { scoreApplication } from "../domain/scoring/scoreApplication";
import { validateCreateApplication } from "../shared/validation";
import { NotFoundError } from "../shared/errors";

export interface CreateApplicationRequest {
  candidate: CandidateInfo;
  answers: ApplicationAnswer[];
}

export interface ListApplicationsQuery {
  sort?: "score_desc" | "score_asc";
  limit?: number;
  offset?: number;
}

export interface ApplicationSummary {
  id: string;
  candidateName: string;
  totalScore: number;
  maxTotalScore: number;
  createdAt: string;
}

export class ApplicationsService {
  constructor(
    private applicationRepository: ApplicationRepository,
    private jobRepository: JobRepository
  ) {}

  async createApplication(jobId: string, data: unknown): Promise<Application> {
    // Load job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError("Job", jobId);
    }

    // Validate
    validateCreateApplication(data, job);

    const request = data as CreateApplicationRequest;

    // Score the application
    const score = scoreApplication(job, request.answers);

    // Create application
    const application: Application = {
      id: uuidv4(),
      jobId,
      candidate: request.candidate,
      answers: request.answers,
      score,
      createdAt: new Date().toISOString()
    };

    await this.applicationRepository.create(application);

    return application;
  }

  async getApplication(id: string): Promise<Application> {
    const application = await this.applicationRepository.findById(id);
    
    if (!application) {
      throw new NotFoundError("Application", id);
    }

    return application;
  }

  async listApplicationsForJob(
    jobId: string,
    query: ListApplicationsQuery
  ): Promise<ApplicationSummary[]> {
    // Verify job exists
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError("Job", jobId);
    }

    let applications = await this.applicationRepository.listByJobId(jobId);

    // Sort
    const sortOrder = query.sort || "score_desc";
    applications.sort((a, b) => {
      if (sortOrder === "score_desc") {
        return b.score.total - a.score.total;
      } else {
        return a.score.total - b.score.total;
      }
    });

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    applications = applications.slice(offset, offset + limit);

    // Map to summary
    return applications.map(app => ({
      id: app.id,
      candidateName: app.candidate.name,
      totalScore: app.score.total,
      maxTotalScore: app.score.maxTotal,
      createdAt: app.createdAt
    }));
  }
}

