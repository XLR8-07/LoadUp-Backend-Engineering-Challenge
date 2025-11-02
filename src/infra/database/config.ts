import { Pool, PoolConfig } from "pg";
import { logger } from "../../shared/logger";

export interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || "",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    min: parseInt(process.env.DB_POOL_MIN || "2", 10),
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };
}

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool(config);

    // Handle pool errors
    pool.on("error", (err) => {
      logger.error("Unexpected database pool error", { error: err.message });
    });

    // Log connection events in development
    if (process.env.NODE_ENV === "development") {
      pool.on("connect", () => {
        logger.info("New database connection established");
      });
    }
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info("Database pool closed");
  }
}

