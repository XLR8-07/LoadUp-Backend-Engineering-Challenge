# LoadUp Backend Challenge - Job Application Service

> **Note:** This project was developed with assistance from AI tools (Claude 4.5 Sonnet Model with Cursor) for markdown generation and testing.

A production-ready HTTP service for creating job postings with structured questions, accepting candidate applications, and automatically scoring them based on configurable criteria.

**Company:** LoadUp SE  
**Challenge:** Backend Coding Challenge (2-3 hours)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Server                           │
│                   (Port 3000)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Routes     │─────▶│ Controllers  │                     │
│  └──────────────┘      └──────┬───────┘                     │
│                               │                            │
│                               ▼                            │
│                      ┌──────────────┐                      │
│                      │   Services   │                      │
│                      │  (Business   │                      │
│                      │    Logic)    │                      │
│                      └──────┬───────┘                      │
│                             │                              │
│                             ▼                              │
│                    ┌─────────────────┐                     │
│                    │  Domain Layer   │                     │
│                    │   - Scoring     │                     │
│                    │   - Validation  │                     │
│                    └─────────┬───────┘                     │
│                              │                             │
│                              ▼                             │
│                    ┌──────────────────┐                    │
│                    │  Repositories    │                    │
│                    │   (Data Access)  │                    │
│                    └────────┬─────────┘                    │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              ▼  
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │   (Production)   │
                    └──────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose

### Option 1: Docker Setup

```bash
# Install dependencies and run everything
npm install
docker-compose up --build
```

**Wait for the logs to show:** `✅ Starting application...`

This will automatically:
- ✅ Start PostgreSQL in Docker
- ✅ Create database and tables
- ✅ Load sample data (3 jobs + 6 applications)

Then visit:
- **Server:** http://localhost:3000
- **API Docs:** http://localhost:3000/docs (Interactive Swagger UI)
- **Try it out:** Sample jobs are already loaded - test the API immediately!

### Option 2: Local Development with PostgreSQL

```bash
# 1. Start PostgreSQL in Docker (runs in background)
npm run db:docker

# 2. Setup database (creates tables + seeds data)
npm run setup

# 3. Run the application
npm run dev
```

Then visit http://localhost:3000/docs

**To stop PostgreSQL later:**
```bash
npm run db:docker:stop
```

### Option 3: In-Memory Mode (No Database)

```bash
# Quick testing without any database
npm install
npm run dev:memory
```

Then visit http://localhost:3000/docs

---

## Sample Data

When you run `docker-compose up` or `npm run setup`, the database is automatically seeded with:

- **3 Sample Jobs:**
  - Senior Data Engineer (Remote)
  - Frontend Developer (San Francisco)
  - DevOps Engineer (New York)

- **6 Sample Applications** across these jobs

**Try it immediately:**
```bash
# List all jobs
curl http://localhost:3000/api/v1/jobs

# Get a specific job (copy an ID from the list)
curl http://localhost:3000/api/v1/jobs/{jobId}

# List applications for a job (sorted by score)
curl http://localhost:3000/api/v1/jobs/{jobId}/applications
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Jobs** |
| POST | `/jobs` | Create job with questions |
| GET | `/jobs` | List all jobs |
| GET | `/jobs/:id` | Get specific job |
| **Applications** |
| POST | `/jobs/:id/applications` | Submit application |
| GET | `/jobs/:id/applications` | List applications (sorted by score) |
| GET | `/applications/:id` | Get application details |

---

## Quick Example

> **Note:** If you used Docker or `npm run setup`, sample data is already loaded!  
> Visit http://localhost:3000/docs and try the GET endpoints first.

### Create a Job

```bash
# 1. Create a new job
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Data Engineer",
    "location": "Remote",
    "customer": "LoadUp",
    "jobName": "data-engineer-2025",
    "description": "Build scalable data pipelines",
    "questions": [
      {
        "text": "What is your primary programming language?",
        "type": "single_choice",
        "options": ["Python", "Java", "Go"],
        "scoring": {
          "kind": "single_choice",
          "maxPoints": 10,
          "correctOption": "Python"
        }
      }
    ]
  }'

# 2. Submit an application
curl -X POST http://localhost:3000/api/v1/jobs/{jobId}/applications \
  -H "Content-Type: application/json" \
  -d '{
    "candidate": {
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "answers": [
      { "questionId": "q1", "answer": "Python" }
    ]
  }'
```

---

## Scope

### In Scope (Implemented)

- **Job Management**
  - Create jobs with structured questions
  - List and retrieve jobs
  - Auto-generate question IDs
  
- **Application Management**
  - Submit applications with validation
  - Auto-scoring based on configurable rules
  - List applications sorted by score
  - Pagination support (limit/offset)
  - Detailed score breakdown per question

- **Question Types**
  - Single Choice (exact match)
  - Multi Choice (partial credit + penalties)
  - Number (range validation)
  - Text (keyword matching)

- **Quality**
  - Input validation with clear error messages
  - 107 comprehensive tests
  - Clean architecture with repository pattern
  - PostgreSQL and in-memory storage options
  - Structured logging
  - Interactive API documentation

### Out of Scope (Acknowledged Limitations for the time limit)

- **Security & Auth**
  - No authentication/authorization
  - No rate limiting
  - No CORS configuration
  - No input sanitization beyond validation

- **Scale & Performance**
  - No caching layer
  - No handling of concurrent application submissions
  - No distributed locking for race conditions
  - No pagination on job listings
  - No database query optimization beyond basic indexes

- **Business Rules**
  - No limit on number of applications per job
  - No limit on applications per candidate
  - No duplicate application prevention
  - No ranking/filtering of top candidates
  - No application deadline enforcement
  - No job status (open/closed)

- **Advanced Features**
  - No email notifications
  - No file uploads
  - No webhooks
  - No analytics/reporting
  - No audit logging
  - No soft deletes
  - No data retention policies

- **DevOps**
  - No CI/CD pipeline
  - No monitoring/alerting
  - No load balancing
  - No health checks beyond basic endpoint
  - No metrics collection

**Rationale:** These are production concerns that would be addressed in a real-world scenario but are beyond the scope of a 2-3 hour coding challenge. The focus was on demonstrating clean architecture, comprehensive testing, and core functionality.

---

## Testing

```bash
# Run all tests (107 tests)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:**
- ✅ 31 Scoring tests (all question types + edge cases)
- ✅ 17 Validation tests (comprehensive input validation)
- ✅ 21 Integration tests (full end-to-end workflows)
- ✅ 38 Edge case tests (Unicode, boundaries, NaN, etc.)

---

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
│   └── scoring/           # Question-type specific scorers
│       ├── scoreApplication.ts
│       ├── scoreSingleChoice.ts
│       ├── scoreMultiChoice.ts
│       ├── scoreNumber.ts
│       └── scoreText.ts
├── infra/                  # Infrastructure / data access
│   ├── repositories/      # Repository pattern implementations
│   └── database/          # PostgreSQL configuration
├── shared/                 # Shared utilities
│   ├── errors.ts
│   ├── validation.ts
│   ├── logger.ts
│   └── openapi.ts
└── server.ts              # Express app setup

tests/
├── scoring.test.ts        # Scoring logic tests
├── validation.test.ts     # Input validation tests
├── integration.test.ts    # End-to-end workflow tests
└── edge-cases.test.ts     # Boundary condition tests
```

---

## Scoring Rules

### Single Choice
- **Full points** if answer matches `correctOption`
- **Zero points** otherwise

### Multi Choice
- **Partial credit:** `(matched / total_correct) × maxPoints`
- **Penalty** (if `penalizeExtras: true`): Score × 0.8 when incorrect options selected

### Number
- **Full points** if answer in range `[min, max]` (inclusive)
- **Zero points** otherwise

### Text
- **Keyword matching:** Case-insensitive substring search
- **Score:** `(matched_keywords / total_keywords) × maxPoints`
- **Minimum ratio:** If set, score is 0 if below threshold

---

## Tech Stack

- **TypeScript** - Type-safe code
- **Node.js + Express** - HTTP server
- **PostgreSQL** - Production database
- **Docker** - Containerization
- **Vitest** - Fast testing framework
- **Swagger/OpenAPI** - Interactive API documentation

---

## Architecture Highlights

- **Clean Architecture** - Separation of domain, application, and infrastructure layers
- **Repository Pattern** - Swappable storage implementations (in-memory ↔ PostgreSQL)
- **Domain-Driven Design** - Business logic isolated in domain layer
- **Type Safety** - Full TypeScript strict mode
- **Comprehensive Testing** - 107 tests covering all scenarios
- **Error Handling** - Consistent JSON error responses



---

## Configuration

Create a `.env` file or use `.env.example`:

```env
# Storage mode
USE_IN_MEMORY=false

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=job_application_service
DB_USER=postgres
DB_PASSWORD=postgres

# Server
PORT=3000
NODE_ENV=development
```

---

## Error Handling

All errors return consistent JSON responses:

**Validation Error (400)**
```json
{
  "error": "VALIDATION_ERROR",
  "details": ["title is required"]
}
```

**Not Found (404)**
```json
{
  "error": "NOT_FOUND",
  "message": "Job not found"
}
```

**Server Error (500)**
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

