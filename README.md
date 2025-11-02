# Job Application Service

A production-ready HTTP service for creating job postings with structured questions, accepting candidate applications, and automatically scoring them based on configurable criteria.

## Features

- **Job Management**: Create and manage job postings with custom questions
- **Application Submission**: Candidates can submit applications with answers
- **Auto-Scoring**: Automatically score applications based on question types and criteria
- **Flexible Question Types**: Support for single-choice, multi-choice, number, and text questions
- **Score Breakdown**: Detailed per-question scoring with explanations
- **Clean Architecture**: Layered design with domain, application, and infrastructure separation

## Tech Stack

- **TypeScript** - Type-safe code
- **Node.js** - Runtime
- **Express** - HTTP framework
- **Vitest** - Testing framework
- **In-Memory Storage** - Easily swappable with database

## Getting Started

### Quick Setup (One Command)

If you have PostgreSQL installed:
```bash
npm run setup
```

This command installs dependencies, creates the database, and runs migrations automatically!

### Alternative: Docker Setup

```bash
# Start PostgreSQL in Docker (fresh setup)
docker-compose down -v   # Remove old data if any
docker-compose up -d     # Start with password
sleep 10                 # Wait for initialization

# Run setup
npm run setup
```

### Manual Installation

```bash
npm install
```

### Database Setup

The service supports both **PostgreSQL** (production) and **in-memory** (testing) storage.

#### Option 1: PostgreSQL (Recommended)
1. Install PostgreSQL locally or use Docker
2. Run: `npm run setup`
3. Done! ✅

For detailed database setup instructions, see [DATABASE_SETUP.md](DATABASE_SETUP.md)

#### Option 2: In-Memory Storage (Testing Only)
Set in your `.env` file:
```env
USE_IN_MEMORY=true
```

### Running the Service

Development mode (with auto-reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

The service will start on port `3000` by default. You can change this by setting the `PORT` environment variable.

### Configuration

Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Key configurations:
- `USE_IN_MEMORY` - true for testing, false for PostgreSQL
- `DB_HOST`, `DB_PORT`, `DB_NAME` - Database connection
- `DB_POOL_MIN`, `DB_POOL_MAX` - Connection pool settings

### API Documentation

Once the server is running, visit the interactive API documentation:

```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- Complete API endpoint reference
- Request/response schemas
- Interactive "Try it out" functionality
- Detailed descriptions of all parameters

### Running Tests

```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

> 💡 **Tip**: Visit `http://localhost:3000/api-docs` for interactive Swagger documentation with "Try it out" functionality.

### Jobs

#### Create a Job
```
POST /api/v1/jobs
```

Create a new job posting with questions.

**Request Body:**
```json
{
  "title": "Data Engineer",
  "location": "Remote",
  "customer": "LoadUp",
  "jobName": "data-engineer-remote",
  "description": "Build data pipelines and infrastructure",
  "questions": [
    {
      "text": "What is your primary programming language?",
      "type": "single_choice",
      "options": ["Python", "Go", "Node.js"],
      "scoring": {
        "kind": "single_choice",
        "maxPoints": 10,
        "correctOption": "Python"
      }
    },
    {
      "text": "Which tools do you have experience with?",
      "type": "multi_choice",
      "options": ["Airflow", "DBT", "Spark", "Kafka"],
      "scoring": {
        "kind": "multi_choice",
        "maxPoints": 10,
        "correctOptions": ["Airflow", "DBT"],
        "penalizeExtras": true
      }
    },
    {
      "text": "How many years of experience do you have?",
      "type": "number",
      "scoring": {
        "kind": "number",
        "maxPoints": 5,
        "min": 3,
        "max": 10
      }
    },
    {
      "text": "Describe your data engineering experience",
      "type": "text",
      "scoring": {
        "kind": "text",
        "maxPoints": 15,
        "keywords": ["ETL", "pipeline", "data", "warehouse"],
        "minimumMatchRatio": 0.5
      }
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "Data Engineer",
  "location": "Remote",
  "customer": "LoadUp",
  "jobName": "data-engineer-remote",
  "description": "Build data pipelines and infrastructure",
  "questions": [...],
  "createdAt": "2025-10-31T12:00:00.000Z"
}
```

#### List All Jobs
```
GET /api/v1/jobs
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Data Engineer",
    ...
  }
]
```

#### Get a Specific Job
```
GET /api/v1/jobs/:id
```

**Response:** `200 OK` or `404 Not Found`

### Applications

#### Submit an Application
```
POST /api/v1/jobs/:id/applications
```

Submit an application for a specific job.

**Request Body:**
```json
{
  "candidate": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "answers": [
    { "questionId": "q1", "answer": "Python" },
    { "questionId": "q2", "answer": ["Airflow", "Spark"] },
    { "questionId": "q3", "answer": 5 },
    { "questionId": "q4", "answer": "I have 5 years of experience building ETL pipelines and data warehouses" }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "jobId": "job-uuid",
  "candidate": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "answers": [...],
  "score": {
    "total": 32.5,
    "maxTotal": 40,
    "perQuestion": [
      {
        "questionId": "q1",
        "awarded": 10,
        "max": 10,
        "reason": "Matched correct option"
      },
      {
        "questionId": "q2",
        "awarded": 4,
        "max": 10,
        "reason": "Matched 1/2 correct options (penalty applied for extra selections)"
      },
      {
        "questionId": "q3",
        "awarded": 5,
        "max": 5,
        "reason": "Number within range [3, 10]"
      },
      {
        "questionId": "q4",
        "awarded": 11.25,
        "max": 15,
        "reason": "Matched 3/4 keywords: ETL, pipeline, data"
      }
    ]
  },
  "createdAt": "2025-10-31T12:30:00.000Z"
}
```

#### List Applications for a Job
```
GET /api/v1/jobs/:id/applications?sort=score_desc&limit=50&offset=0
```

List all applications for a job, sorted by score.

**Query Parameters:**
- `sort` - Sort order: `score_desc` (default) or `score_asc`
- `limit` - Maximum number of results (default: 50)
- `offset` - Number of results to skip (default: 0)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "candidateName": "Jane Doe",
    "totalScore": 32.5,
    "maxTotalScore": 40,
    "createdAt": "2025-10-31T12:30:00.000Z"
  }
]
```

#### Get a Single Application
```
GET /api/v1/applications/:id
```

Get detailed information about a specific application, including score breakdown.

**Response:** `200 OK` (same format as application submission response)

## Scoring Rules

### Single Choice
- **Full points** if the answer matches the `correctOption`
- **Zero points** otherwise

### Multiple Choice
- **Partial credit** based on the ratio of correct selections: `(matches / totalCorrect) × maxPoints`
- **Penalty** (if `penalizeExtras` is true): If the candidate selects options that are not in `correctOptions`, the score is multiplied by 0.8

### Number
- **Full points** if the answer is within the range `[min, max]` (inclusive)
- **Zero points** otherwise

### Text
- **Keyword matching**: Count how many keywords appear in the answer (case-insensitive)
- **Score**: `(matchedKeywords / totalKeywords) × maxPoints`
- **Minimum ratio** (if configured): If the match ratio is below `minimumMatchRatio`, score is 0

## Project Structure

```
src/
├── api/                    # Route definitions
│   ├── jobs.routes.ts
│   └── applications.routes.ts
├── controllers/            # HTTP request handlers
│   ├── jobs.controller.ts
│   └── applications.controller.ts
├── application/            # Business logic / use cases
│   ├── jobs.service.ts
│   └── applications.service.ts
├── domain/                 # Core domain models and logic
│   ├── job.ts
│   ├── application.ts
│   └── scoring/
│       ├── scoreApplication.ts
│       ├── scoreSingleChoice.ts
│       ├── scoreMultiChoice.ts
│       ├── scoreNumber.ts
│       └── scoreText.ts
├── infra/                  # Infrastructure / data access
│   └── repositories/
│       ├── JobRepository.ts
│       ├── InMemoryJobRepository.ts
│       ├── ApplicationRepository.ts
│       └── InMemoryApplicationRepository.ts
├── shared/                 # Shared utilities
│   ├── errors.ts
│   ├── validation.ts
│   └── logger.ts
└── server.ts              # Express app setup

tests/
├── scoring.test.ts        # Scoring logic tests
└── validation.test.ts     # Validation tests
```

## Architecture Principles

- **Clean Architecture**: Separation of concerns with clear boundaries between layers
- **Domain-Driven Design**: Core business logic in the domain layer
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Repository Pattern**: Abstract data access with swappable implementations
- **Thin Controllers**: Controllers only handle HTTP, delegate to services
- **Type Safety**: Full TypeScript strict mode with comprehensive typing

## Error Handling

All errors are returned in a consistent JSON format:

**Validation Error (400):**
```json
{
  "error": "VALIDATION_ERROR",
  "details": [
    "title is required",
    "questions must have at least one question"
  ]
}
```

**Not Found (404):**
```json
{
  "error": "NOT_FOUND",
  "message": "Job not found"
}
```

**Server Error (500):**
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

## Database Maintenance

### Clean Old Applications

Remove applications older than 90 days (default):
```bash
npm run db:clean
```

Remove applications older than 30 days:
```bash
node scripts/clean-db.js 30
```

### Automated Cleanup

Schedule the cleanup script using cron (Linux/macOS) or Task Scheduler (Windows):
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/project && npm run db:clean
```

## Future Enhancements

- ✅ ~~Database integration (PostgreSQL)~~ - **IMPLEMENTED**
- Authentication and authorization
- Rate limiting
- Caching layer (Redis)
- Job search and filtering
- Email notifications
- File uploads for text answers
- Analytics and reporting
- Webhook support for application events

## Development

### Code Quality

- TypeScript strict mode enabled
- Named exports for better tree-shaking
- ESLint for code style
- Comprehensive test coverage

### Adding a New Question Type

1. Define the scoring interface in `src/domain/job.ts`
2. Create a scorer function in `src/domain/scoring/`
3. Update `scoreApplication.ts` to handle the new type
4. Add validation rules in `src/shared/validation.ts`
5. Write tests

### Switching to a Database

1. Implement `JobRepository` interface for your database
2. Implement `ApplicationRepository` interface for your database
3. Update `src/server.ts` to use the new implementations
4. No changes needed in domain, services, or controllers

## License

MIT

