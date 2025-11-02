import type { NumberScoring } from "../job";
import type { PerQuestionScore } from "../application";

export function scoreNumber(
  scoring: NumberScoring,
  answer: string | string[] | number
): PerQuestionScore {
  const max = scoring.maxPoints;
  
  if (typeof answer !== "number") {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Invalid answer type for number question"
    };
  }

  // Handle NaN and Infinity
  if (!isFinite(answer)) {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Answer must be a finite number"
    };
  }

  const isInRange = answer >= scoring.min && answer <= scoring.max;
  
  return {
    questionId: "",
    awarded: isInRange ? max : 0,
    max,
    reason: isInRange 
      ? `Number within range [${scoring.min}, ${scoring.max}]`
      : `Number ${answer} is out of range [${scoring.min}, ${scoring.max}]`
  };
}

