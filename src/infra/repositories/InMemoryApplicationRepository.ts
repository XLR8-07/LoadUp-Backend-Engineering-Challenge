import type { Application } from "../../domain/application";
import type { ApplicationRepository } from "./ApplicationRepository";

export class InMemoryApplicationRepository implements ApplicationRepository {
  private applications: Map<string, Application> = new Map();

  async create(app: Application): Promise<void> {
    this.applications.set(app.id, app);
  }

  async findById(id: string): Promise<Application | null> {
    return this.applications.get(id) ?? null;
  }

  async listByJobId(jobId: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.jobId === jobId);
  }
}

