import { describe, it, expect } from "vitest";
import { scoreSingleChoice } from "../src/domain/scoring/scoreSingleChoice";
import { scoreMultiChoice } from "../src/domain/scoring/scoreMultiChoice";
import { scoreNumber } from "../src/domain/scoring/scoreNumber";
import { scoreText } from "../src/domain/scoring/scoreText";
import { scoreApplication } from "../src/domain/scoring/scoreApplication";
import type { Job } from "../src/domain/job";

describe("Edge Cases and Advanced Scenarios", () => {
  describe("Single Choice Edge Cases", () => {
    it("should handle case-sensitive matching", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Python"
      };

      const result = scoreSingleChoice(scoring, "python");

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("python");
    });

    it("should handle whitespace in answers", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Python"
      };

      const result = scoreSingleChoice(scoring, "   ");

      expect(result.awarded).toBe(0);
      expect(result.reason).toBe("Empty answer provided");
    });

    it("should handle special characters in options", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "C++"
      };

      const result = scoreSingleChoice(scoring, "C++");

      expect(result.awarded).toBe(10);
      expect(result.reason).toBe("Matched correct option");
    });

    it("should handle unicode characters", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: "Español 🇪🇸"
      };

      const result = scoreSingleChoice(scoring, "Español 🇪🇸");

      expect(result.awarded).toBe(10);
    });

    it("should handle very long option strings", () => {
      const longOption = "A".repeat(1000);
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 10,
        correctOption: longOption
      };

      const result = scoreSingleChoice(scoring, longOption);

      expect(result.awarded).toBe(10);
    });
  });

  describe("Multi Choice Edge Cases", () => {
    it("should handle all wrong selections with penalty", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["A", "B"],
        penalizeExtras: true
      };

      const result = scoreMultiChoice(scoring, ["C", "D"]);

      expect(result.awarded).toBe(0);
    });

    it("should handle duplicate selections", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["A", "B"]
      };

      // Even with duplicates, should count unique matches
      const result = scoreMultiChoice(scoring, ["A", "A", "B", "B"]);

      expect(result.awarded).toBe(10);
    });

    it("should handle single correct option in multi-choice", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["OnlyOne"]
      };

      const result = scoreMultiChoice(scoring, ["OnlyOne"]);

      expect(result.awarded).toBe(10);
      expect(result.reason).toContain("Matched 1/1");
    });

    it("should handle many correct options", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 20,
        correctOptions: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
      };

      const result = scoreMultiChoice(scoring, ["A", "B", "C", "D", "E"]);

      expect(result.awarded).toBe(10); // 5/10 = 50%
    });

    it("should handle penalty with partial match", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["A", "B", "C"],
        penalizeExtras: true
      };

      // 2/3 correct = 6.67, with penalty = 6.67 * 0.8 = 5.33
      const result = scoreMultiChoice(scoring, ["A", "B", "X"]);

      expect(result.awarded).toBeCloseTo(5.33, 1);
      expect(result.reason).toContain("penalty applied");
    });

    it("should handle when user selects all options including correct ones", () => {
      const scoring = {
        kind: "multi_choice" as const,
        maxPoints: 10,
        correctOptions: ["A", "B"],
        penalizeExtras: true
      };

      const result = scoreMultiChoice(scoring, ["A", "B", "C", "D", "E"]);

      expect(result.awarded).toBe(8); // 10 * 0.8 due to penalty
    });
  });

  describe("Number Edge Cases", () => {
    it("should handle negative numbers", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: -10,
        max: 0
      };

      expect(scoreNumber(scoring, -5).awarded).toBe(10);
      expect(scoreNumber(scoring, -10).awarded).toBe(10);
      expect(scoreNumber(scoring, 0).awarded).toBe(10);
      expect(scoreNumber(scoring, 1).awarded).toBe(0);
    });

    it("should handle decimal numbers", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 0,
        max: 1
      };

      expect(scoreNumber(scoring, 0.5).awarded).toBe(10);
      expect(scoreNumber(scoring, 0.999).awarded).toBe(10);
      expect(scoreNumber(scoring, 0.001).awarded).toBe(10);
    });

    it("should handle very large numbers", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 1000000,
        max: 9999999
      };

      expect(scoreNumber(scoring, 5000000).awarded).toBe(10);
      expect(scoreNumber(scoring, 10000000).awarded).toBe(0);
    });

    it("should handle zero", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 0,
        max: 10
      };

      expect(scoreNumber(scoring, 0).awarded).toBe(10);
    });

    it("should handle negative infinity", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 0,
        max: 10
      };

      const result = scoreNumber(scoring, -Infinity);

      expect(result.awarded).toBe(0);
      expect(result.reason).toContain("finite number");
    });

    it("should handle single point range", () => {
      const scoring = {
        kind: "number" as const,
        maxPoints: 10,
        min: 5,
        max: 5
      };

      expect(scoreNumber(scoring, 5).awarded).toBe(10);
      expect(scoreNumber(scoring, 4.99).awarded).toBe(0);
      expect(scoreNumber(scoring, 5.01).awarded).toBe(0);
    });
  });

  describe("Text Edge Cases", () => {
    it("should handle partial keyword matches (substring)", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["data", "pipeline"]
      };

      // "database" contains "data", "pipelined" contains "pipeline"
      const result = scoreText(scoring, "I work with database systems and pipelined processing");

      expect(result.awarded).toBe(10);
    });

    it("should handle keywords with special characters", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["C++", "Node.js", "React.js"]
      };

      const result = scoreText(scoring, "I use C++, Node.js, and React.js daily");

      expect(result.awarded).toBe(10);
    });

    it("should handle very long text answers", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "pipeline"]
      };

      const longText = "I have experience with " + "various technologies and tools. ".repeat(100) + "ETL and pipeline are my specialties.";
      const result = scoreText(scoring, longText);

      expect(result.awarded).toBe(10);
    });

    it("should handle keywords appearing multiple times", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "pipeline"]
      };

      const result = scoreText(scoring, "ETL ETL ETL pipeline pipeline pipeline");

      expect(result.awarded).toBe(10);
    });

    it("should handle minimum match ratio at boundary", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["A", "B", "C", "D"],
        minimumMatchRatio: 0.5
      };

      // Exactly 2/4 = 0.5 (boundary)
      const result1 = scoreText(scoring, "A B");
      expect(result1.awarded).toBe(5);

      // Less than 0.5
      const result2 = scoreText(scoring, "A");
      expect(result2.awarded).toBe(0);
    });

    it("should handle unicode and emoji in text", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["data", "pipeline"]
      };

      const result = scoreText(scoring, "I ❤️ working with data 🔥 and building pipeline systems 🚀");

      expect(result.awarded).toBe(10);
    });

    it("should handle case variations", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["ETL", "Pipeline"]
      };

      const result = scoreText(scoring, "etl ETLETL PiPeLiNe pipelINE");

      expect(result.awarded).toBe(10);
    });

    it("should handle keywords at start and end of text", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["start", "end"]
      };

      const result = scoreText(scoring, "start this is some text in the middle end");

      expect(result.awarded).toBe(10);
    });

    it("should handle single character keywords", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["a", "b", "c"]
      };

      const result = scoreText(scoring, "a b c");

      expect(result.awarded).toBe(10);
    });
  });

  describe("Complex Application Scenarios", () => {
    it("should handle application with mixed performance", () => {
      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions: [
          {
            id: "q1",
            text: "Q1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          },
          {
            id: "q2",
            text: "Q2",
            type: "multi_choice",
            options: ["X", "Y", "Z"],
            scoring: { kind: "multi_choice", maxPoints: 15, correctOptions: ["X", "Y"], penalizeExtras: true }
          },
          {
            id: "q3",
            text: "Q3",
            type: "number",
            scoring: { kind: "number", maxPoints: 5, min: 0, max: 10 }
          },
          {
            id: "q4",
            text: "Q4",
            type: "text",
            scoring: { kind: "text", maxPoints: 20, keywords: ["a", "b", "c"], minimumMatchRatio: 0.33 }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      const answers = [
        { questionId: "q1", answer: "A" }, // Perfect: 10
        { questionId: "q2", answer: ["X", "Z"] }, // Partial with penalty: 7.5 * 0.8 = 6
        { questionId: "q3", answer: 15 }, // Out of range: 0
        { questionId: "q4", answer: "a and b are here" } // Partial: 13.33
      ];

      const result = scoreApplication(job, answers);

      expect(result.total).toBeCloseTo(29.33, 1);
      expect(result.maxTotal).toBe(50);
    });

    it("should handle application with all questions unanswered", () => {
      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions: [
          {
            id: "q1",
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          },
          {
            id: "q2",
            text: "Q2",
            type: "number",
            scoring: { kind: "number", maxPoints: 5, min: 0, max: 10 }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      const result = scoreApplication(job, []);

      expect(result.total).toBe(0);
      expect(result.maxTotal).toBe(15);
      expect(result.perQuestion).toHaveLength(2);
      expect(result.perQuestion[0].reason).toBe("No answer provided");
      expect(result.perQuestion[1].reason).toBe("No answer provided");
    });

    it("should handle application with perfect score", () => {
      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions: [
          {
            id: "q1",
            text: "Q1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: { kind: "single_choice", maxPoints: 25, correctOption: "A" }
          },
          {
            id: "q2",
            text: "Q2",
            type: "multi_choice",
            options: ["X", "Y"],
            scoring: { kind: "multi_choice", maxPoints: 25, correctOptions: ["X", "Y"] }
          },
          {
            id: "q3",
            text: "Q3",
            type: "number",
            scoring: { kind: "number", maxPoints: 25, min: 5, max: 10 }
          },
          {
            id: "q4",
            text: "Q4",
            type: "text",
            scoring: { kind: "text", maxPoints: 25, keywords: ["alpha", "beta"] }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      const answers = [
        { questionId: "q1", answer: "A" },
        { questionId: "q2", answer: ["X", "Y"] },
        { questionId: "q3", answer: 7 },
        { questionId: "q4", answer: "I know alpha and beta very well" }
      ];

      const result = scoreApplication(job, answers);

      expect(result.total).toBe(100);
      expect(result.maxTotal).toBe(100);
      expect(result.perQuestion.every(q => q.awarded === q.max)).toBe(true);
    });

    it("should handle application with zero score", () => {
      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions: [
          {
            id: "q1",
            text: "Q1",
            type: "single_choice",
            options: ["A", "B"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          },
          {
            id: "q2",
            text: "Q2",
            type: "number",
            scoring: { kind: "number", maxPoints: 10, min: 5, max: 10 }
          },
          {
            id: "q3",
            text: "Q3",
            type: "text",
            scoring: { kind: "text", maxPoints: 10, keywords: ["keyword1", "keyword2"] }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      const answers = [
        { questionId: "q1", answer: "B" }, // Wrong
        { questionId: "q2", answer: 100 }, // Out of range
        { questionId: "q3", answer: "This has none of the expected words" } // No keywords
      ];

      const result = scoreApplication(job, answers);

      expect(result.total).toBe(0);
      expect(result.maxTotal).toBe(30);
    });

    it("should properly round scores to 2 decimal places", () => {
      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions: [
          {
            id: "q1",
            text: "Q1",
            type: "multi_choice",
            options: ["A", "B", "C"],
            scoring: { kind: "multi_choice", maxPoints: 10, correctOptions: ["A", "B", "C"] }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      // 2/3 = 6.666... should round to 6.67
      const answers = [{ questionId: "q1", answer: ["A", "B"] }];

      const result = scoreApplication(job, answers);

      expect(result.total).toBeCloseTo(6.67, 2);
      expect(result.perQuestion[0].awarded).toBeCloseTo(6.67, 2);
    });

    it("should handle job with many questions", () => {
      const questions = Array.from({ length: 20 }, (_, i) => ({
        id: `q${i}`,
        text: `Question ${i}`,
        type: "number" as const,
        scoring: {
          kind: "number" as const,
          maxPoints: 5,
          min: 0,
          max: 10
        }
      }));

      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions,
        createdAt: "2025-01-01T00:00:00Z"
      };

      const answers = questions.map(q => ({
        questionId: q.id,
        answer: 5
      }));

      const result = scoreApplication(job, answers);

      expect(result.total).toBe(100);
      expect(result.maxTotal).toBe(100);
      expect(result.perQuestion).toHaveLength(20);
    });

    it("should assign correct questionId to each score", () => {
      const job: Job = {
        id: "job1",
        title: "Test",
        location: "Test",
        customer: "Test",
        jobName: "test",
        description: "Test",
        questions: [
          {
            id: "unique-q1",
            text: "Q1",
            type: "single_choice",
            options: ["A"],
            scoring: { kind: "single_choice", maxPoints: 10, correctOption: "A" }
          },
          {
            id: "unique-q2",
            text: "Q2",
            type: "number",
            scoring: { kind: "number", maxPoints: 10, min: 0, max: 10 }
          }
        ],
        createdAt: "2025-01-01T00:00:00Z"
      };

      const answers = [
        { questionId: "unique-q1", answer: "A" },
        { questionId: "unique-q2", answer: 5 }
      ];

      const result = scoreApplication(job, answers);

      expect(result.perQuestion[0].questionId).toBe("unique-q1");
      expect(result.perQuestion[1].questionId).toBe("unique-q2");
    });
  });

  describe("Boundary and Stress Tests", () => {
    it("should handle zero maxPoints gracefully", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 0,
        correctOption: "A"
      };

      const result = scoreSingleChoice(scoring, "A");

      expect(result.awarded).toBe(0);
      expect(result.max).toBe(0);
    });

    it("should handle very high maxPoints", () => {
      const scoring = {
        kind: "single_choice" as const,
        maxPoints: 1000000,
        correctOption: "A"
      };

      const result = scoreSingleChoice(scoring, "A");

      expect(result.awarded).toBe(1000000);
    });

    it("should handle empty string keyword", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["", "valid"]
      };

      const result = scoreText(scoring, "valid text here");

      // Empty string matches everything
      expect(result.awarded).toBe(10);
    });

    it("should handle minimum match ratio of 0", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["never", "matching"],
        minimumMatchRatio: 0
      };

      const result = scoreText(scoring, "some other text");

      expect(result.awarded).toBe(0);
    });

    it("should handle minimum match ratio of 1", () => {
      const scoring = {
        kind: "text" as const,
        maxPoints: 10,
        keywords: ["all", "must", "match"],
        minimumMatchRatio: 1.0
      };

      // Only 2/3
      const result1 = scoreText(scoring, "all must be here");
      expect(result1.awarded).toBe(0);

      // All 3/3
      const result2 = scoreText(scoring, "all must match");
      expect(result2.awarded).toBe(10);
    });
  });
});

