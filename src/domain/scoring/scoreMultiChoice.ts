import type { MultiChoiceScoring } from "../job";
import type { PerQuestionScore } from "../application";

export function scoreMultiChoice(
  scoring: MultiChoiceScoring,
  answer: string | string[] | number
): PerQuestionScore {
  const max = scoring.maxPoints;
  
  if (!Array.isArray(answer)) {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Invalid answer type for multi choice question"
    };
  }

  const userAnswers = answer as string[];
  const correctOptions = scoring.correctOptions;
  
  // Handle empty arrays
  if (userAnswers.length === 0) {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "No options selected"
    };
  }

  // Edge case: if correctOptions is somehow empty (shouldn't happen with validation)
  if (correctOptions.length === 0) {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Invalid scoring configuration: no correct options defined"
    };
  }
  
  // Count matches
  const matches = userAnswers.filter(a => correctOptions.includes(a)).length;
  
  // Check for extras (answers not in correct options)
  const hasExtras = userAnswers.some(a => !correctOptions.includes(a));
  
  // Calculate base score
  let awarded = (matches / correctOptions.length) * max;
  
  // Apply penalty if configured
  if (hasExtras && scoring.penalizeExtras) {
    awarded = awarded * 0.8;
  }
  
  // Ensure awarded is not NaN and is within bounds
  awarded = Math.max(0, Math.min(awarded, max));
  
  const reason = `Matched ${matches}/${correctOptions.length} correct options${
    hasExtras && scoring.penalizeExtras ? " (penalty applied for extra selections)" : ""
  }`;
  
  return {
    questionId: "",
    awarded: Math.round(awarded * 100) / 100, // Round to 2 decimals
    max,
    reason
  };
}

