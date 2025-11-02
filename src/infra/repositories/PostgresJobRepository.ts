import type { Job } from "../../domain/job";
import type { JobRepository } from "./JobRepository";
import { getPool } from "../database/config";
import { logger } from "../../shared/logger";

export class PostgresJobRepository implements JobRepository {
  async create(job: Job): Promise<void> {
    const pool = getPool();
    const query = `
      INSERT INTO jobs (id, title, location, customer, job_name, description, questions, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    const values = [
      job.id,
      job.title,
      job.location,
      job.customer,
      job.jobName,
      job.description,
      JSON.stringify(job.questions),
      job.createdAt
    ];

    try {
      await pool.query(query, values);
      logger.info("Job created in database", { jobId: job.id });
    } catch (error) {
      logger.error("Failed to create job in database", { 
        jobId: job.id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async findById(id: string): Promise<Job | null> {
    const pool = getPool();
    const query = "SELECT * FROM jobs WHERE id = $1";

    try {
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToJob(result.rows[0]);
    } catch (error) {
      logger.error("Failed to find job by id", { 
        jobId: id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async list(): Promise<Job[]> {
    const pool = getPool();
    const query = "SELECT * FROM jobs ORDER BY created_at DESC";

    try {
      const result = await pool.query(query);
      return result.rows.map(row => this.mapRowToJob(row));
    } catch (error) {
      logger.error("Failed to list jobs", { error: (error as Error).message });
      throw error;
    }
  }

  private mapRowToJob(row: any): Job {
    return {
      id: row.id,
      title: row.title,
      location: row.location,
      customer: row.customer,
      jobName: row.job_name,
      description: row.description,
      questions: typeof row.questions === "string" 
        ? JSON.parse(row.questions) 
        : row.questions,
      createdAt: row.created_at
    };
  }
}

