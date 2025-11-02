import { describe, it, expect } from "vitest";
import { validateCreateJob, validateCreateApplication } from "../src/shared/validation";
import { ValidationError } from "../src/shared/errors";
import type { Job } from "../src/domain/job";

describe("Validation", () => {
  describe("validateCreateJob", () => {
    it("should pass for valid job", () => {
      const validJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
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
          }
        ]
      };

      expect(() => validateCreateJob(validJob)).not.toThrow();
    });

    it("should fail when title is missing", () => {
      const invalidJob = {
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: []
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
      
      try {
        validateCreateJob(invalidJob);
      } catch (error) {
        expect((error as ValidationError).details).toContain("title is required");
      }
    });

    it("should fail when questions is empty", () => {
      const invalidJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: []
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
      
      try {
        validateCreateJob(invalidJob);
      } catch (error) {
        expect((error as ValidationError).details).toContain("questions must have at least one question");
      }
    });

    it("should fail when question type is invalid", () => {
      const invalidJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: [
          {
            text: "Question?",
            type: "invalid_type",
            scoring: {
              kind: "invalid_type",
              maxPoints: 10
            }
          }
        ]
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
      
      try {
        validateCreateJob(invalidJob);
      } catch (error) {
        expect((error as ValidationError).details.some(d => d.includes("type must be one of"))).toBe(true);
      }
    });

    it("should fail when single_choice missing options", () => {
      const invalidJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: [
          {
            text: "Question?",
            type: "single_choice",
            scoring: {
              kind: "single_choice",
              maxPoints: 10,
              correctOption: "A"
            }
          }
        ]
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
    });

    it("should fail when single_choice missing correctOption", () => {
      const invalidJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: [
          {
            text: "Question?",
            type: "single_choice",
            options: ["A", "B"],
            scoring: {
              kind: "single_choice",
              maxPoints: 10
            }
          }
        ]
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
    });

    it("should fail when multi_choice missing correctOptions", () => {
      const invalidJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: [
          {
            text: "Question?",
            type: "multi_choice",
            options: ["A", "B"],
            scoring: {
              kind: "multi_choice",
              maxPoints: 10
            }
          }
        ]
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
    });

    it("should fail when number missing min/max", () => {
      const invalidJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: [
          {
            text: "Question?",
            type: "number",
            scoring: {
              kind: "number",
              maxPoints: 10
            }
          }
        ]
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
    });

    it("should fail when text missing keywords", () => {
      const invalidJob = {
        title: "Data Engineer",
        location: "Remote",
        customer: "LoadUp",
        jobName: "data-engineer",
        description: "Build data pipelines",
        questions: [
          {
            text: "Question?",
            type: "text",
            scoring: {
              kind: "text",
              maxPoints: 10
            }
          }
        ]
      };

      expect(() => validateCreateJob(invalidJob)).toThrow(ValidationError);
    });

    it("should fail for multiple validation errors", () => {
      const invalidJob = {
        location: "Remote",
        questions: []
      };

      try {
        validateCreateJob(invalidJob);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.details.length).toBeGreaterThan(1);
      }
    });
  });

  describe("validateCreateApplication", () => {
    const job: Job = {
      id: "job1",
      title: "Data Engineer",
      location: "Remote",
      customer: "LoadUp",
      jobName: "data-engineer",
      description: "Build pipelines",
      questions: [
        {
          id: "q1",
          text: "Language?",
          type: "single_choice",
          options: ["Python", "Go"],
          scoring: {
            kind: "single_choice",
            maxPoints: 10,
            correctOption: "Python"
          }
        },
        {
          id: "q2",
          text: "Tools?",
          type: "multi_choice",
          options: ["Airflow", "DBT"],
          scoring: {
            kind: "multi_choice",
            maxPoints: 10,
            correctOptions: ["Airflow"]
          }
        },
        {
          id: "q3",
          text: "Years?",
          type: "number",
          scoring: {
            kind: "number",
            maxPoints: 5,
            min: 0,
            max: 10
          }
        }
      ],
      createdAt: "2025-01-01T00:00:00Z"
    };

    it("should pass for valid application", () => {
      const validApplication = {
        candidate: {
          name: "Jane Doe",
          email: "jane@example.com"
        },
        answers: [
          { questionId: "q1", answer: "Python" },
          { questionId: "q2", answer: ["Airflow"] },
          { questionId: "q3", answer: 5 }
        ]
      };

      expect(() => validateCreateApplication(validApplication, job)).not.toThrow();
    });

    it("should fail when candidate name is missing", () => {
      const invalidApplication = {
        candidate: {
          email: "jane@example.com"
        },
        answers: []
      };

      expect(() => validateCreateApplication(invalidApplication, job)).toThrow(ValidationError);
    });

    it("should fail when candidate email is invalid", () => {
      const invalidApplication = {
        candidate: {
          name: "Jane Doe",
          email: "invalid-email"
        },
        answers: []
      };

      expect(() => validateCreateApplication(invalidApplication, job)).toThrow(ValidationError);
    });

    it("should fail when answer references non-existent question", () => {
      const invalidApplication = {
        candidate: {
          name: "Jane Doe",
          email: "jane@example.com"
        },
        answers: [
          { questionId: "q999", answer: "Python" }
        ]
      };

      expect(() => validateCreateApplication(invalidApplication, job)).toThrow(ValidationError);
    });

    it("should fail when answer type does not match question type", () => {
      const invalidApplication = {
        candidate: {
          name: "Jane Doe",
          email: "jane@example.com"
        },
        answers: [
          { questionId: "q1", answer: ["Python"] } // Array instead of string
        ]
      };

      expect(() => validateCreateApplication(invalidApplication, job)).toThrow(ValidationError);
      
      try {
        validateCreateApplication(invalidApplication, job);
      } catch (error) {
        expect((error as ValidationError).details.some(d => d.includes("must be a string for single_choice"))).toBe(true);
      }
    });

    it("should fail when multi_choice answer is not an array", () => {
      const invalidApplication = {
        candidate: {
          name: "Jane Doe",
          email: "jane@example.com"
        },
        answers: [
          { questionId: "q2", answer: "Airflow" } // String instead of array
        ]
      };

      expect(() => validateCreateApplication(invalidApplication, job)).toThrow(ValidationError);
    });

    it("should fail when number answer is not a number", () => {
      const invalidApplication = {
        candidate: {
          name: "Jane Doe",
          email: "jane@example.com"
        },
        answers: [
          { questionId: "q3", answer: "5" } // String instead of number
        ]
      };

      expect(() => validateCreateApplication(invalidApplication, job)).toThrow(ValidationError);
    });
  });
});

