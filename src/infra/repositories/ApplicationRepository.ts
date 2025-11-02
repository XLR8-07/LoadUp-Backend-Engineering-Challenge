import type { Application } from "../../domain/application";

export interface ApplicationRepository {
  create(app: Application): Promise<void>;
  findById(id: string): Promise<Application | null>;
  listByJobId(jobId: string): Promise<Application[]>;
}

