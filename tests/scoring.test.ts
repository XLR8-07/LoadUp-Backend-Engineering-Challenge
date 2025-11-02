import { describe, it, expect } from "vitest";
import { scoreSingleChoice } from "../src/domain/scoring/scoreSingleChoice";
import { scoreMultiChoice } from "../src/domain/scoring/scoreMultiChoice";
import { scoreNumber } from "../src/domain/scoring/scoreNumber";
import { scoreText } from "../src/domain/scoring/scoreText";
import { scoreApplication } from "../src/domain/scoring/scoreApplication";
import type { Job } from "../src/domain/job";

describe("Scoring Engine", () => {
  describe("scoreSingleChoice", () => {
    it("should award full points for correct answer", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Python"
      };

      const result = scoreSingleChoice(scoring, "Python");

      expect(result.awarded).toBe(10);
      expect(result.max).toBe(10);
      expect(result.reason).toBe("Matched correct option");
    });

    it("should award zero points for incorrect answer", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Python"
      };

      const result = scoreSingleChoice(scoring, "Go");

      expect(result.awarded).toBe(0);
      expect(result.max).toBe(10);
      expect(result.reason).toContain("Go");
      expect(result.reason).toContain("Python");
    });

    it("should handle invalid answer type", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Python"
      };

      const result = scoreSingleChoice(scoring, ["Python"]);

      expect(result.awarded).toBe(0);
    });

    it("should handle empty string answer", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Python"
      };

      const result = scoreSingleChoice(scoring, "");

      expect(result.awarded).toBe(0);
      expect(result.reason).toBe("Empty answer provided");
    });

    it("should provide detailed reason for wrong answer", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Python"
      };

      const result = scoreSingleChoice(scoring, "JavaScript");

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("JavaScript");
      expect(result.reason).toContain("Python");
    });
  });

  describe("scoreMultiChoice", () => {
    it("should award full points for all correct options", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["Airflow", "DBT"]
      };

      const result = scoreMultiChoice(scoring, ["Airflow", "DBT"]);

      expect(result.awarded).toBe(10);
      expect(result.max).toBe(10);
      expect(result.reason).toContain("Matched 2/2 correct options");
    });

    it("should award partial points for partial overlap", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["Airflow", "DBT", "Spark"]
      };

      const result = scoreMultiChoice(scoring, ["Airflow", "DBT"]);

      expect(result.awarded).toBeCloseTo(6.67, 1);
      expect(result.max).toBe(10);
      expect(result.reason).toContain("Matched 2/3 correct options");
    });

    it("should penalize extra selections when configured", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["Airflow", "DBT"],
        penalizeExtras: true
      };

      const result = scoreMultiChoice(scoring, ["Airflow", "DBT", "Kafka"]);

      expect(result.awarded).toBe(8); // 10 * 0.8
      expect(result.reason).toContain("penalty applied");
    });

    it("should not penalize when penalizeExtras is false", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["Airflow", "DBT"],
        penalizeExtras: false
      };

      const result = scoreMultiChoice(scoring, ["Airflow", "DBT", "Kafka"]);

      expect(result.awarded).toBe(10);
    });

    it("should handle invalid answer type", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["Airflow", "DBT"]
      };

      const result = scoreMultiChoice(scoring, "Airflow");

      expect(result.awarded).toBe(0);
    });

    it("should handle empty array answer", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["Airflow", "DBT"]
      };

      const result = scoreMultiChoice(scoring, []);

      expect(result.awarded).toBe(0);
      expect(result.reason).toBe("No options selected");
    });

    it("should not divide by zero with empty correct options", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: [] as string[]
      };

      const result = scoreMultiChoice(scoring, ["Airflow"]);

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("Invalid scoring configuration");
    });

    it("should cap awarded points at max", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["A"]
      };

      const result = scoreMultiChoice(scoring, ["A"]);

      expect(result.awarded).toBeLessThanOrEqual(10);
      expect(result.awarded).toBe(10);
    });
  });

  describe("scoreNumber", () => {
    it("should award full points for number in range", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 10
      };

      const result = scoreNumber(scoring, 7);

      expect(result.awarded).toBe(10);
      expect(result.max).toBe(10);
      expect(result.reason).toContain("within range");
    });

    it("should award full points for number at boundaries", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 10
      };

      expect(scoreNumber(scoring, 5).awarded).toBe(10);
      expect(scoreNumber(scoring, 10).awarded).toBe(10);
    });

    it("should award zero points for number out of range", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 10
      };

      const result = scoreNumber(scoring, 15);

      expect(result.awarded).toBe(0);
      expect(result.max).toBe(10);
      expect(result.reason).toContain("out of range");
    });

    it("should handle invalid answer type", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 10
      };

      const result = scoreNumber(scoring, "7");

      expect(result.awarded).toBe(0);
    });

    it("should handle NaN values", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 10
      };

      const result = scoreNumber(scoring, NaN);

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("finite number");
    });

    it("should handle Infinity values", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 10
      };

      const result = scoreNumber(scoring, Infinity);

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("finite number");
    });

    it("should show actual value in out of range message", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 10
      };

      const result = scoreNumber(scoring, 15);

      expect(result.reason).toContain("15");
      expect(result.reason).toContain("out of range");
    });
  });

  describe("scoreText", () => {
    it("should award full points for all keywords matched", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "pipeline", "data"]
      };

      const result = scoreText(scoring, "I have experience with ETL pipelines and data processing");

      expect(result.awarded).toBeCloseTo(10, 1);
      expect(result.reason).toContain("Matched 3/3 keywords");
    });

    it("should award partial points for partial keyword match", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "pipeline", "data", "streaming"]
      };

      const result = scoreText(scoring, "I have experience with ETL pipelines");

      expect(result.awarded).toBe(5); // 2/4 = 50%
      expect(result.reason).toContain("Matched 2/4 keywords");
    });

    it("should be case-insensitive", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "Pipeline"]
      };

      const result = scoreText(scoring, "etl and pipeline experience");

      expect(result.awarded).toBe(10);
      expect(result.reason).toContain("Matched 2/2 keywords");
    });

    it("should respect minimum match ratio", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "pipeline", "data", "streaming"],
        minimumMatchRatio: 0.75
      };

      const result = scoreText(scoring, "I have ETL experience"); // Only 1/4 = 25%

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("below minimum ratio");
    });

    it("should handle invalid answer type", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL"]
      };

      const result = scoreText(scoring, 123);

      expect(result.awarded).toBe(0);
    });

    it("should handle empty string answer", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "pipeline"]
      };

      const result = scoreText(scoring, "");

      expect(result.awarded).toBe(0);
      expect(result.reason).toBe("Empty answer provided");
    });

    it("should handle whitespace-only answer", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "pipeline"]
      };

      const result = scoreText(scoring, "   ");

      expect(result.awarded).toBe(0);
      expect(result.reason).toBe("Empty answer provided");
    });

    it("should not divide by zero with empty keywords", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: [] as string[]
      };

      const result = scoreText(scoring, "some text");

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("Invalid scoring configuration");
    });

    it("should cap awarded points at max", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "data"]
      };

      const result = scoreText(scoring, "ETL and data processing");

      expect(result.awarded).toBeLessThanOrEqual(10);
      expect(result.awarded).toBe(10);
    });
  });

  describe("scoreApplication", () => {
    it("should score a complete application correctly", () => {
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
            options: ["Airflow", "DBT", "Spark"],
            scoring: {
              kind: "multi_choice",
              maxPoints: 10,
              correctOptions: ["Airflow", "DBT"]
            }
          },
          {
            id: "q3",
            text: "Years experience?",
            type: "number",
            scoring: {
              kind: "number",
              maxPoints: 5,
              min: 3,
              max: 10
            }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      const answers = [
        { questionId: "q1", answer: "Python" },
        { questionId: "q2", answer: ["Airflow"] },
        { questionId: "q3", answer: 5 }
      ];

      const result = scoreApplication(job, answers);

      expect(result.total).toBe(20); // 10 + 5 + 5
      expect(result.maxTotal).toBe(25);
      expect(result.perQuestion).toHaveLength(3);
      expect(result.perQuestion[0].awarded).toBe(10);
      expect(result.perQuestion[1].awarded).toBe(5);
      expect(result.perQuestion[2].awarded).toBe(5);
    });

    it("should handle missing answers", () => {
      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Remote",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions: [
          {
            id: "q1",
            text: "Question 1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: {
              kind: "single_choice",
              maxPoints: 10,
              correctOption: "A"
            }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      const answers: any[] = [];

      const result = scoreApplication(job, answers);

      expect(result.total).toBe(0);
      expect(result.maxTotal).toBe(10);
      expect(result.perQuestion[0].reason).toBe("No answer provided");
    });
  });
});

