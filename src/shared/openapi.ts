export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Job Application Service API",
    version: "1.0.0",
    description: "Production-ready HTTP service for creating jobs with structured questions, submitting applications, and auto-scoring candidates based on configurable criteria.",
    contact: {
      name: "API Support"
    }
  },
  tags: [
    {
      name: "Jobs",
      description: "Job management endpoints"
    },
    {
      name: "Applications",
      description: "Application submission and retrieval endpoints"
    },
    {
      name: "Health",
      description: "Service health check"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check if the service is running",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/jobs": {
      post: {
        tags: ["Jobs"],
        summary: "Create a new job",
        description: "Create a job posting with structured questions. Question IDs are auto-generated if not provided.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "location", "customer", "jobName", "description", "questions"],
                properties: {
                  title: { type: "string", example: "Data Engineer" },
                  location: { type: "string", example: "Remote" },
                  customer: { type: "string", example: "LoadUp" },
                  jobName: { type: "string", example: "data-engineer-remote" },
                  description: { type: "string", example: "Build data pipelines and infrastructure" },
                  questions: {
                    type: "array",
                    minItems: 1,
                    items: {
                      oneOf: [
                        { $ref: "#/components/schemas/SingleChoiceQuestion" },
                        { $ref: "#/components/schemas/MultiChoiceQuestion" },
                        { $ref: "#/components/schemas/NumberQuestion" },
                        { $ref: "#/components/schemas/TextQuestion" }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Job created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Job" }
              }
            }
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" }
              }
            }
          }
        }
      },
      get: {
        tags: ["Jobs"],
        summary: "List all jobs",
        description: "Retrieve a list of all job postings",
        responses: {
          "200": {
            description: "List of jobs",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Job" }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get a specific job",
        description: "Retrieve details of a specific job by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Job ID"
          }
        ],
        responses: {
          "200": {
            description: "Job details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Job" }
              }
            }
          },
          "404": {
            description: "Job not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotFoundError" }
              }
            }
          }
        }
      }
    },
    "/api/v1/jobs/{id}/applications": {
      post: {
        tags: ["Applications"],
        summary: "Submit an application",
        description: "Submit a candidate application for a job. The application will be automatically scored based on the job's question criteria.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Job ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["candidate", "answers"],
                properties: {
                  candidate: {
                    type: "object",
                    required: ["name", "email"],
                    properties: {
                      name: { type: "string", example: "Jane Doe" },
                      email: { type: "string", format: "email", example: "jane@example.com" }
                    }
                  },
                  answers: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["questionId", "answer"],
                      properties: {
                        questionId: { type: "string", example: "q1" },
                        answer: {
                          oneOf: [
                            { type: "string", example: "Python" },
                            { type: "array", items: { type: "string" }, example: ["Airflow", "DBT"] },
                            { type: "number", example: 5 }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Application submitted and scored successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Application" }
              }
            }
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" }
              }
            }
          },
          "404": {
            description: "Job not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotFoundError" }
              }
            }
          }
        }
      },
      get: {
        tags: ["Applications"],
        summary: "List applications for a job",
        description: "Retrieve applications for a specific job, sorted by score (descending by default)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Job ID"
          },
          {
            name: "sort",
            in: "query",
            schema: { type: "string", enum: ["score_desc", "score_asc"], default: "score_desc" },
            description: "Sort order"
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
            description: "Maximum number of results"
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0, minimum: 0 },
            description: "Number of results to skip"
          }
        ],
        responses: {
          "200": {
            description: "List of applications",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ApplicationSummary" }
                }
              }
            }
          },
          "404": {
            description: "Job not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotFoundError" }
              }
            }
          }
        }
      }
    },
    "/api/v1/applications/{id}": {
      get: {
        tags: ["Applications"],
        summary: "Get a specific application",
        description: "Retrieve full details of an application including score breakdown",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Application ID"
          }
        ],
        responses: {
          "200": {
            description: "Application details with score breakdown",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Application" }
              }
            }
          },
          "404": {
            description: "Application not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotFoundError" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Job: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          location: { type: "string" },
          customer: { type: "string" },
          jobName: { type: "string" },
          description: { type: "string" },
          questions: { type: "array", items: { type: "object" } },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      SingleChoiceQuestion: {
        type: "object",
        required: ["text", "type", "options", "scoring"],
        properties: {
          id: { type: "string", description: "Auto-generated if not provided" },
          text: { type: "string", example: "What is your primary programming language?" },
          type: { type: "string", enum: ["single_choice"] },
          options: { type: "array", items: { type: "string" }, example: ["Python", "Go", "Node.js"] },
          scoring: {
            type: "object",
            required: ["kind", "maxPoints", "correctOption"],
            properties: {
              kind: { type: "string", enum: ["single_choice"] },
              maxPoints: { type: "number", example: 10 },
              correctOption: { type: "string", example: "Python" }
            }
          }
        }
      },
      MultiChoiceQuestion: {
        type: "object",
        required: ["text", "type", "options", "scoring"],
        properties: {
          id: { type: "string", description: "Auto-generated if not provided" },
          text: { type: "string", example: "Which tools do you use?" },
          type: { type: "string", enum: ["multi_choice"] },
          options: { type: "array", items: { type: "string" }, example: ["Airflow", "DBT", "Spark"] },
          scoring: {
            type: "object",
            required: ["kind", "maxPoints", "correctOptions"],
            properties: {
              kind: { type: "string", enum: ["multi_choice"] },
              maxPoints: { type: "number", example: 10 },
              correctOptions: { type: "array", items: { type: "string" }, example: ["Airflow", "DBT"] },
              penalizeExtras: { type: "boolean", default: false, description: "Apply 0.8x penalty if candidate selects incorrect options" }
            }
          }
        }
      },
      NumberQuestion: {
        type: "object",
        required: ["text", "type", "scoring"],
        properties: {
          id: { type: "string", description: "Auto-generated if not provided" },
          text: { type: "string", example: "Years of experience?" },
          type: { type: "string", enum: ["number"] },
          scoring: {
            type: "object",
            required: ["kind", "maxPoints", "min", "max"],
            properties: {
              kind: { type: "string", enum: ["number"] },
              maxPoints: { type: "number", example: 5 },
              min: { type: "number", example: 3 },
              max: { type: "number", example: 10 }
            }
          }
        }
      },
      TextQuestion: {
        type: "object",
        required: ["text", "type", "scoring"],
        properties: {
          id: { type: "string", description: "Auto-generated if not provided" },
          text: { type: "string", example: "Describe your experience" },
          type: { type: "string", enum: ["text"] },
          scoring: {
            type: "object",
            required: ["kind", "maxPoints", "keywords"],
            properties: {
              kind: { type: "string", enum: ["text"] },
              maxPoints: { type: "number", example: 15 },
              keywords: { type: "array", items: { type: "string" }, example: ["ETL", "pipeline", "data"] },
              minimumMatchRatio: { type: "number", minimum: 0, maximum: 1, example: 0.5, description: "Minimum ratio of keywords that must match (optional)" }
            }
          }
        }
      },
      Application: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          jobId: { type: "string", format: "uuid" },
          candidate: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" }
            }
          },
          answers: { type: "array", items: { type: "object" } },
          score: {
            type: "object",
            properties: {
              total: { type: "number", example: 32.5 },
              maxTotal: { type: "number", example: 40 },
              perQuestion: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    questionId: { type: "string" },
                    awarded: { type: "number" },
                    max: { type: "number" },
                    reason: { type: "string", example: "Matched correct option" }
                  }
                }
              }
            }
          },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      ApplicationSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          candidateName: { type: "string", example: "Jane Doe" },
          totalScore: { type: "number", example: 32.5 },
          maxTotalScore: { type: "number", example: 40 },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "VALIDATION_ERROR" },
          details: {
            type: "array",
            items: { type: "string" },
            example: ["title is required", "questions must have at least one question"]
          }
        }
      },
      NotFoundError: {
        type: "object",
        properties: {
          error: { type: "string", example: "NOT_FOUND" },
          message: { type: "string", example: "Job not found" }
        }
      }
    }
  }
};

