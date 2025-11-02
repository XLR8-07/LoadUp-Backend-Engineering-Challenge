import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { InMemoryJobRepository } from "./infra/repositories/InMemoryJobRepository";
import { InMemoryApplicationRepository } from "./infra/repositories/InMemoryApplicationRepository";
import { PostgresJobRepository } from "./infra/repositories/PostgresJobRepository";
import { PostgresApplicationRepository } from "./infra/repositories/PostgresApplicationRepository";
import type { JobRepository } from "./infra/repositories/JobRepository";
import type { ApplicationRepository } from "./infra/repositories/ApplicationRepository";
import { JobsService } from "./application/jobs.service";
import { ApplicationsService } from "./application/applications.service";
import { JobsController } from "./controllers/jobs.controller";
import { ApplicationsController } from "./controllers/applications.controller";
import { createJobsRouter } from "./api/jobs.routes";
import { createApplicationsRouter, createJobApplicationsRouter } from "./api/applications.routes";
import { logger } from "./shared/logger";
import { openApiSpec } from "./shared/openapi";
import { closePool } from "./infra/database/config";

// Initialize repositories based on configuration
const useInMemory = process.env.USE_IN_MEMORY === "true";

let jobRepository: JobRepository;
let applicationRepository: ApplicationRepository;

if (useInMemory) {
  logger.info("Using in-memory storage");
  jobRepository = new InMemoryJobRepository();
  applicationRepository = new InMemoryApplicationRepository();
} else {
  logger.info("Using PostgreSQL storage");
  jobRepository = new PostgresJobRepository();
  applicationRepository = new PostgresApplicationRepository();
}

// Initialize services
const jobsService = new JobsService(jobRepository);
const applicationsService = new ApplicationsService(applicationRepository, jobRepository);

// Initialize controllers
const jobsController = new JobsController(jobsService);
const applicationsController = new ApplicationsController(applicationsService);

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// API Documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: "Job Application Service API",
  customCss: ".swagger-ui .topbar { display: none }"
}));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/v1/jobs", createJobsRouter(jobsController));
app.use("/api/v1/jobs", createJobApplicationsRouter(applicationsController));
app.use("/api/v1/applications", createApplicationsRouter(applicationsController));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Endpoint not found"
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/docs`);
  logger.info(`Storage mode: ${useInMemory ? "In-Memory" : "PostgreSQL"}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    logger.info("HTTP server closed");
    if (!useInMemory) {
      await closePool();
    }
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(async () => {
    logger.info("HTTP server closed");
    if (!useInMemory) {
      await closePool();
    }
    process.exit(0);
  });
});

export { app };

