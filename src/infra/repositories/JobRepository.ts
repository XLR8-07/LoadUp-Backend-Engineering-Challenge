import type { Job } from "../../domain/job";

export interface JobRepository {
  create(job: Job): Promise<void>;
  findById(id: string): Promise<Job | null>;
  list(): Promise<Job[]>;
}

