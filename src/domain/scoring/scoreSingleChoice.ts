import type { SingleChoiceScoring } from "../job";
import type { PerQuestionScore } from "../application";

export function scoreSingleChoice(
  scoring: SingleChoiceScoring,
  answer: string | string[] | number
): PerQuestionScore {
  const max = scoring.maxPoints;
  
  if (typeof answer !== "string") {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Invalid answer type for single choice question"
    };
  }

  // Handle empty answer
  if (answer.trim() === "") {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Empty answer provided"
    };
  }

  const isCorrect = answer === scoring.correctOption;
  
  return {
    questionId: "",
    awarded: isCorrect ? max : 0,
    max,
    reason: isCorrect 
      ? "Matched correct option" 
      : `Selected "${answer}" but correct option is "${scoring.correctOption}"`
  };
}

