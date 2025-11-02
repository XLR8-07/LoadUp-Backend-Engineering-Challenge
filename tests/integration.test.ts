import { describe, it, expect, beforeEach } from "vitest";
import { JobsService } from "../src/application/jobs.service";
import { ApplicationsService } from "../src/application/applications.service";
import { InMemoryJobRepository } from "../src/infra/repositories/InMemoryJobRepository";
import { InMemoryApplicationRepository } from "../src/infra/repositories/InMemoryApplicationRepository";
import { ValidationError, NotFoundError } from "../src/shared/errors";

describe("Integration Tests", () => {
  let jobsService: JobsService;
  let applicationsService: ApplicationsService;
  let jobRepository: InMemoryJobRepository;
  let applicationRepository: InMemoryApplicationRepository;

  beforeEach(() => {
    jobRepository = new InMemoryJobRepository();
    applicationRepository = new InMemoryApplicationRepository();
    jobsService = new JobsService(jobRepository);
    applicationsService = new ApplicationsService(applicationRepository, jobRepository);
  });

  describe("Complete Job Application Flow", () => {
    it("should create job, submit applications, and retrieve them", async () => {
      // Step 1: Create a job
      const jobData = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer-test",
        description: "Build data pipelines",
        questions: [
          {
            text: "Primary language?",
            type: "single_choice",
            options: ["Python", "Go"],
            scoring: {
              kind: "single_choice",
              maxPoints: 10,
              correctOption: "Python"
            }
          },
          {
            text: "Years experience?",
            type: "number",
            scoring: {
              kind: "number",
              maxPoints: 10,
              min: 3,
              max: 10
            }
          }
        ]
      };

      const job = await jobsService.createJob(jobData);
      expect(job.id).toBeDefined();
      expect(job.questions).toHaveLength(2);
      expect(job.questions[0].id).toBeDefined(); // Auto-generated IDs

      // Step 2: Submit a perfect application
      const application1 = await applicationsService.createApplication(job.id, {
        candidate: {
          name: "Alice Smith",
          email: "alice@example.com"
        },
        answers: [
          { questionId: job.questions[0].id, answer: "Python" },
          { questionId: job.questions[1].id, answer: 5 }
        ]
      });

      expect(application1.id).toBeDefined();
      expect(application1.score.total).toBe(20);
      expect(application1.score.maxTotal).toBe(20);

      // Step 3: Submit an imperfect application
      const application2 = await applicationsService.createApplication(job.id, {
        candidate: {
          name: "Bob Jones",
          email: "bob@example.com"
        },
        answers: [
          { questionId: job.questions[0].id, answer: "Go" },
          { questionId: job.questions[1].id, answer: 5 }
        ]
      });

      expect(application2.score.total).toBe(10);
      expect(application2.score.maxTotal).toBe(20);

      // Step 4: List applications for the job
      const applications = await applicationsService.listApplicationsForJob(job.id, {});

      expect(applications).toHaveLength(2);
      expect(applications[0].totalScore).toBe(20); // Sorted by score desc
      expect(applications[1].totalScore).toBe(10);

      // Step 5: Get individual application
      const retrievedApp = await applicationsService.getApplication(application1.id);
      expect(retrievedApp.id).toBe(application1.id);
      expect(retrievedApp.candidate.name).toBe("Alice Smith");
    });

    it("should handle multiple jobs independently", async () => {
      // Create first job
      const job1 = await jobsService.createJob({
        title: "Job 1",
        location: "Location 1",
        customer: "Customer 1",
        jobName: "job-1",
        description: "Description 1",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      // Create second job
      const job2 = await jobsService.createJob({
        title: "Job 2",
        location: "Location 2",
        customer: "Customer 2",
        jobName: "job-2",
        description: "Description 2",
        questions: [
          {
            text: "Q1",
            type: "number",
            scoring: { kind: "number", maxPoints: 5, min: 0, max: 10 }
          }
        ]
      });

      // Submit applications to each job
      await applicationsService.createApplication(job1.id, {
        candidate: { name: "Candidate 1", email: "c1@example.com" },
        answers: [{ questionId: job1.questions[0].id, answer: "A" }]
      });

      await applicationsService.createApplication(job2.id, {
        candidate: { name: "Candidate 2", email: "c2@example.com" },
        answers: [{ questionId: job2.questions[0].id, answer: 5 }]
      });

      // List applications for each job
      const job1Apps = await applicationsService.listApplicationsForJob(job1.id, {});
      const job2Apps = await applicationsService.listApplicationsForJob(job2.id, {});

      expect(job1Apps).toHaveLength(1);
      expect(job2Apps).toHaveLength(1);
      expect(job1Apps[0].candidateName).toBe("Candidate 1");
      expect(job2Apps[0].candidateName).toBe("Candidate 2");
    });
  });

  describe("Application Sorting and Pagination", () => {
    it("should sort applications by score descending", async () => {
      const job = await jobsService.createJob({
        title: "Test Job",
        location: "Remote",
        customer: "Test",
        jobName: "test-job-sort",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "text",
            scoring: { 
              kind: "text", 
              maxPoints: 100, 
              keywords: ["keyword1", "keyword2", "keyword3"] 
            }
          }
        ]
      });

      const questionId = job.questions[0].id;

      // Submit applications with different scores
      await applicationsService.createApplication(job.id, {
        candidate: { name: "Low", email: "low@example.com" },
        answers: [{ questionId, answer: "keyword1" }] // 33.33 points (1/3)
      });

      await applicationsService.createApplication(job.id, {
        candidate: { name: "High", email: "high@example.com" },
        answers: [{ questionId, answer: "keyword1 keyword2 keyword3" }] // 100 points (3/3)
      });

      await applicationsService.createApplication(job.id, {
        candidate: { name: "Medium", email: "med@example.com" },
        answers: [{ questionId, answer: "keyword1 keyword2" }] // 66.67 points (2/3)
      });

      const applications = await applicationsService.listApplicationsForJob(job.id, {
        sort: "score_desc"
      });

      expect(applications[0].candidateName).toBe("High");
      expect(applications[1].candidateName).toBe("Medium");
      expect(applications[2].candidateName).toBe("Low");
    });

    it("should sort applications by score ascending", async () => {
      const job = await jobsService.createJob({
        title: "Test Job",
        location: "Remote",
        customer: "Test",
        jobName: "test-job-sort-asc",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "text",
            scoring: { 
              kind: "text", 
              maxPoints: 100, 
              keywords: ["keyword1", "keyword2"] 
            }
          }
        ]
      });

      const questionId = job.questions[0].id;

      await applicationsService.createApplication(job.id, {
        candidate: { name: "Low", email: "low@example.com" },
        answers: [{ questionId, answer: "keyword1" }] // 50 points (1/2)
      });

      await applicationsService.createApplication(job.id, {
        candidate: { name: "High", email: "high@example.com" },
        answers: [{ questionId, answer: "keyword1 keyword2" }] // 100 points (2/2)
      });

      const applications = await applicationsService.listApplicationsForJob(job.id, {
        sort: "score_asc"
      });

      expect(applications[0].candidateName).toBe("Low");
      expect(applications[1].candidateName).toBe("High");
    });

    it("should handle pagination with limit and offset", async () => {
      const job = await jobsService.createJob({
        title: "Test Job",
        location: "Remote",
        customer: "Test",
        jobName: "test-job-pagination",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      // Create 10 applications
      for (let i = 0; i < 10; i++) {
        await applicationsService.createApplication(job.id, {
          candidate: { name: `Candidate ${i}`, email: `c${i}@example.com` },
          answers: [{ questionId: job.questions[0].id, answer: "A" }]
        });
      }

      // Get first 3
      const page1 = await applicationsService.listApplicationsForJob(job.id, {
        limit: 3,
        offset: 0
      });
      expect(page1).toHaveLength(3);

      // Get next 3
      const page2 = await applicationsService.listApplicationsForJob(job.id, {
        limit: 3,
        offset: 3
      });
      expect(page2).toHaveLength(3);

      // Ensure different results
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it("should handle default pagination (limit 50)", async () => {
      const job = await jobsService.createJob({
        title: "Test Job",
        location: "Remote",
        customer: "Test",
        jobName: "test-job-default-pagination",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      // Create 5 applications
      for (let i = 0; i < 5; i++) {
        await applicationsService.createApplication(job.id, {
          candidate: { name: `Candidate ${i}`, email: `c${i}@example.com` },
          answers: [{ questionId: job.questions[0].id, answer: "A" }]
        });
      }

      const applications = await applicationsService.listApplicationsForJob(job.id, {});
      expect(applications).toHaveLength(5);
    });
  });

  describe("Error Handling", () => {
    it("should throw NotFoundError when job does not exist", async () => {
      await expect(
        jobsService.getJob("non-existent-id")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when application does not exist", async () => {
      await expect(
        applicationsService.getApplication("non-existent-id")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when listing applications for non-existent job", async () => {
      await expect(
        applicationsService.listApplicationsForJob("non-existent-job-id", {})
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when creating application for non-existent job", async () => {
      await expect(
        applicationsService.createApplication("non-existent-job-id", {
          candidate: { name: "Test", email: "test@example.com" },
          answers: []
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for invalid job data", async () => {
      await expect(
        jobsService.createJob({
          title: "",
          location: "Test",
          customer: "Test",
          jobName: "test",
          description: "Test",
          questions: []
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid application data", async () => {
      const job = await jobsService.createJob({
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test-validation",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      await expect(
        applicationsService.createApplication(job.id, {
          candidate: { name: "Test", email: "invalid-email" },
          answers: []
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when answer references non-existent question", async () => {
      const job = await jobsService.createJob({
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test-answer-validation",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      await expect(
        applicationsService.createApplication(job.id, {
          candidate: { name: "Test", email: "test@example.com" },
          answers: [{ questionId: "non-existent-question", answer: "A" }]
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when answer type does not match question type", async () => {
      const job = await jobsService.createJob({
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test-type-validation",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      await expect(
        applicationsService.createApplication(job.id, {
          candidate: { name: "Test", email: "test@example.com" },
          answers: [{ questionId: job.questions[0].id, answer: ["A"] }] // Array instead of string
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Complex Scoring Scenarios", () => {
    it("should score application with all question types correctly", async () => {
      const job = await jobsService.createJob({
        title: "Complete Test",
        location: "Remote",
        customer: "Test",
        jobName: "complete-test",
        description: "Test all question types",
        questions: [
          {
            text: "Single choice question",
            type: "single_choice",
            options: ["A", "B", "C"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "B" }
          },
          {
            text: "Multi choice question",
            type: "multi_choice",
            options: ["X", "Y", "Z"],
            scoring: { kind: "multi_choice", maxPoints: 15, correctOptions: ["X", "Y"], penalizeExtras: true }
          },
          {
            text: "Number question",
            type: "number",
            scoring: { kind: "number", maxPoints: 10, min: 1, max: 5 }
          },
          {
            text: "Text question",
            type: "text",
            scoring: { kind: "text", maxPoints: 15, keywords: ["keyword1", "keyword2", "keyword3"] }
          }
        ]
      });

      const application = await applicationsService.createApplication(job.id, {
        candidate: { name: "Test User", email: "test@example.com" },
        answers: [
          { questionId: job.questions[0].id, answer: "B" }, // 10 points
          { questionId: job.questions[1].id, answer: ["X", "Y"] }, // 15 points
          { questionId: job.questions[2].id, answer: 3 }, // 10 points
          { questionId: job.questions[3].id, answer: "I know keyword1 and keyword2 very well" } // 10 points (2/3)
        ]
      });

      expect(application.score.total).toBe(45);
      expect(application.score.maxTotal).toBe(50);
      expect(application.score.perQuestion).toHaveLength(4);
    });

    it("should handle partial answers (some questions unanswered)", async () => {
      const job = await jobsService.createJob({
        title: "Partial Test",
        location: "Remote",
        customer: "Test",
        jobName: "partial-test",
        description: "Test partial answers",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          },
          {
            text: "Q2",
            type: "number",
            scoring: { kind: "number", maxPoints: 10, min: 0, max: 10 }
          },
          {
            text: "Q3",
            type: "text",
            scoring: { kind: "text", maxPoints: 10, keywords: ["test"] }
          }
        ]
      });

      // Only answer the first question
      const application = await applicationsService.createApplication(job.id, {
        candidate: { name: "Partial User", email: "partial@example.com" },
        answers: [
          { questionId: job.questions[0].id, answer: "A" }
        ]
      });

      expect(application.score.total).toBe(10);
      expect(application.score.maxTotal).toBe(30);
      expect(application.score.perQuestion[0].awarded).toBe(10);
      expect(application.score.perQuestion[1].awarded).toBe(0);
      expect(application.score.perQuestion[1].reason).toBe("No answer provided");
      expect(application.score.perQuestion[2].awarded).toBe(0);
      expect(application.score.perQuestion[2].reason).toBe("No answer provided");
    });

    it("should calculate scores consistently for the same answers", async () => {
      const job = await jobsService.createJob({
        title: "Consistency Test",
        location: "Remote",
        customer: "Test",
        jobName: "consistency-test",
        description: "Test consistency",
        questions: [
          {
            text: "Q1",
            type: "multi_choice",
            options: ["A", "B", "C", "D"],
            scoring: { kind: "multi_choice", maxPoints: 20, correctOptions: ["A", "B", "C"], penalizeExtras: true }
          }
        ]
      });

      const answerData = {
        candidate: { name: "Test", email: "test@example.com" },
        answers: [{ questionId: job.questions[0].id, answer: ["A", "B", "D"] }]
      };

      const app1 = await applicationsService.createApplication(job.id, answerData);
      
      // Create a new application with same answers
      const answerData2 = {
        candidate: { name: "Test2", email: "test2@example.com" },
        answers: [{ questionId: job.questions[0].id, answer: ["A", "B", "D"] }]
      };
      
      const app2 = await applicationsService.createApplication(job.id, answerData2);

      expect(app1.score.total).toBe(app2.score.total);
      expect(app1.score.perQuestion[0].awarded).toBe(app2.score.perQuestion[0].awarded);
    });
  });

  describe("Job Listing", () => {
    it("should list all jobs", async () => {
      await jobsService.createJob({
        title: "Job 1",
        location: "Location 1",
        customer: "Customer 1",
        jobName: "job-list-1",
        description: "Description 1",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      await jobsService.createJob({
        title: "Job 2",
        location: "Location 2",
        customer: "Customer 2",
        jobName: "job-list-2",
        description: "Description 2",
        questions: [
          {
            text: "Q1",
            type: "number",
            scoring: { kind: "number", maxPoints: 5, min: 0, max: 10 }
          }
        ]
      });

      const jobs = await jobsService.listJobs();
      expect(jobs.length).toBeGreaterThanOrEqual(2);
    });

    it("should retrieve job by id", async () => {
      const created = await jobsService.createJob({
        title: "Specific Job",
        location: "Specific Location",
        customer: "Specific Customer",
        jobName: "specific-job",
        description: "Specific Description",
        questions: [
          {
            text: "Q1",
            type: "text",
            scoring: { kind: "text", maxPoints: 10, keywords: ["test"] }
          }
        ]
      });

      const retrieved = await jobsService.getJob(created.id);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe("Specific Job");
      expect(retrieved.questions).toHaveLength(1);
    });
  });

  describe("Data Consistency", () => {
    it("should maintain candidate information correctly", async () => {
      const job = await jobsService.createJob({
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test-candidate-info",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      const candidateInfo = {
        name: "John Doe",
        email: "john.doe@example.com"
      };

      const application = await applicationsService.createApplication(job.id, {
        candidate: candidateInfo,
        answers: [{ questionId: job.questions[0].id, answer: "A" }]
      });

      expect(application.candidate.name).toBe(candidateInfo.name);
      expect(application.candidate.email).toBe(candidateInfo.email);

      const retrieved = await applicationsService.getApplication(application.id);
      expect(retrieved.candidate.name).toBe(candidateInfo.name);
      expect(retrieved.candidate.email).toBe(candidateInfo.email);
    });

    it("should preserve timestamps", async () => {
      const job = await jobsService.createJob({
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test-timestamps",
        description: "Test",
        questions: [
          {
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          }
        ]
      });

      expect(job.createdAt).toBeDefined();
      expect(new Date(job.createdAt).getTime()).not.toBeNaN();

      const application = await applicationsService.createApplication(job.id, {
        candidate: { name: "Test", email: "test@example.com" },
        answers: [{ questionId: job.questions[0].id, answer: "A" }]
      });

      expect(application.createdAt).toBeDefined();
      expect(new Date(application.createdAt).getTime()).not.toBeNaN();
    });
  });
});

