export class ValidationError extends Error {
  constructor(
    public details: string[]
  ) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(
    public resource: string,
    public id: string
  ) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: string[];
}

export function formatErrorResponse(error: Error): { status: number; body: ErrorResponse } {
  if (error instanceof ValidationError) {
    return {
      status: 400,
      body: {
        error: "VALIDATION_ERROR",
        details: error.details
      }
    };
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      body: {
        error: "NOT_FOUND",
        message: error.message
      }
    };
  }

  // Generic server error
  return {
    status: 500,
    body: {
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred"
    }
  };
}

