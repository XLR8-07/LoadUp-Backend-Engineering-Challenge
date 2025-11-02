import type { Job } from "../../domain/job";
import type { JobRepository } from "./JobRepository";

export class InMemoryJobRepository implements JobRepository {
  private jobs: Map<string, Job> = new Map();

  async create(job: Job): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async findById(id: string): Promise<Job | null> {
    return this.jobs.get(id) ?? null;
  }

  async list(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }
}

