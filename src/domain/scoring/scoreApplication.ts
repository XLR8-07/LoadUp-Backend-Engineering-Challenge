import type { Job } from "../job";
import type { ApplicationAnswer, ScoreReport, PerQuestionScore } from "../application";
import { scoreSingleChoice } from "./scoreSingleChoice";
import { scoreMultiChoice } from "./scoreMultiChoice";
import { scoreNumber } from "./scoreNumber";
import { scoreText } from "./scoreText";

export function scoreApplication(
  job: Job,
  answers: ApplicationAnswer[]
): ScoreReport {
  const perQuestion: PerQuestionScore[] = [];
  let total = 0;
  let maxTotal = 0;

  for (const question of job.questions) {
    // Find the answer for this question
    const answerObj = answers.find(a => a.questionId === question.id);
    
    if (!answerObj) {
      // No answer provided
      perQuestion.push({
        questionId: question.id,
        awarded: 0,
        max: question.scoring.maxPoints,
        reason: "No answer provided"
      });
      maxTotal += question.scoring.maxPoints;
      continue;
    }

    let score: PerQuestionScore;
    const maxPoints = question.scoring.maxPoints;

    // Call the appropriate scorer based on question type
    switch (question.scoring.kind) {
      case "single_choice":
        score = scoreSingleChoice(question.scoring, answerObj.answer);
        break;
      case "multi_choice":
        score = scoreMultiChoice(question.scoring, answerObj.answer);
        break;
      case "number":
        score = scoreNumber(question.scoring, answerObj.answer);
        break;
      case "text":
        score = scoreText(question.scoring, answerObj.answer);
        break;
      default:
        // This should never happen with proper TypeScript
        score = {
          questionId: question.id,
          awarded: 0,
          max: maxPoints,
          reason: "Unknown question type"
        };
    }

    // Set the questionId
    score.questionId = question.id;
    
    perQuestion.push(score);
    total += score.awarded;
    maxTotal += score.max;
  }

  return {
    total: Math.round(total * 100) / 100, // Round to 2 decimals
    maxTotal,
    perQuestion
  };
}

