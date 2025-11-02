import type { Application } from "../../domain/application";
import type { ApplicationRepository } from "./ApplicationRepository";
import { getPool } from "../database/config";
import { logger } from "../../shared/logger";

export class PostgresApplicationRepository implements ApplicationRepository {
  async create(app: Application): Promise<void> {
    const pool = getPool();
    const query = `
      INSERT INTO applications (
        id, job_id, candidate_name, candidate_email, answers, score, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    const values = [
      app.id,
      app.jobId,
      app.candidate.name,
      app.candidate.email,
      JSON.stringify(app.answers),
      JSON.stringify(app.score),
      app.createdAt
    ];

    try {
      await pool.query(query, values);
      logger.info("Application created in database", { 
        applicationId: app.id, 
        jobId: app.jobId,
        score: app.score.total
      });
    } catch (error) {
      logger.error("Failed to create application in database", { 
        applicationId: app.id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async findById(id: string): Promise<Application | null> {
    const pool = getPool();
    const query = "SELECT * FROM applications WHERE id = $1";

    try {
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToApplication(result.rows[0]);
    } catch (error) {
      logger.error("Failed to find application by id", { 
        applicationId: id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async listByJobId(jobId: string): Promise<Application[]> {
    const pool = getPool();
    const query = `
      SELECT * FROM applications 
      WHERE job_id = $1 
      ORDER BY (score->>'total')::numeric DESC, created_at DESC
    `;

    try {
      const result = await pool.query(query, [jobId]);
      return result.rows.map(row => this.mapRowToApplication(row));
    } catch (error) {
      logger.error("Failed to list applications by job id", { 
        jobId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  private mapRowToApplication(row: any): Application {
    return {
      id: row.id,
      jobId: row.job_id,
      candidate: {
        name: row.candidate_name,
        email: row.candidate_email
      },
      answers: typeof row.answers === "string" 
        ? JSON.parse(row.answers) 
        : row.answers,
      score: typeof row.score === "string" 
        ? JSON.parse(row.score) 
        : row.score,
      createdAt: row.created_at
    };
  }
}

