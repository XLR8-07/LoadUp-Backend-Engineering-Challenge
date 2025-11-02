import { v4 as uuidv4 } from "uuid";
import type { Job, Question } from "../domain/job";
import type { JobRepository } from "../infra/repositories/JobRepository";
import { validateCreateJob } from "../shared/validation";
import { NotFoundError } from "../shared/errors";

export class JobsService {
  constructor(private jobRepository: JobRepository) {}

  async createJob(data: unknown): Promise<Job> {
    // Validate
    validateCreateJob(data);

    const jobData = data as Omit<Job, "id" | "createdAt">;

    // Generate IDs
    const job: Job = {
      ...jobData,
      id: uuidv4(),
      questions: jobData.questions.map((q: Partial<Question>) => ({
        ...q,
        id: q.id || uuidv4()
      })) as Question[],
      createdAt: new Date().toISOString()
    };

    await this.jobRepository.create(job);

    return job;
  }

  async getJob(id: string): Promise<Job> {
    const job = await this.jobRepository.findById(id);
    
    if (!job) {
      throw new NotFoundError("Job", id);
    }

    return job;
  }

  async listJobs(): Promise<Job[]> {
    return this.jobRepository.list();
  }
}

