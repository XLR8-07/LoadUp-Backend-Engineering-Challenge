import type { TextScoring } from "../job";
import type { PerQuestionScore } from "../application";

export function scoreText(
  scoring: TextScoring,
  answer: string | string[] | number
): PerQuestionScore {
  const max = scoring.maxPoints;
  
  if (typeof answer !== "string") {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Invalid answer type for text question"
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

  const answerLower = answer.toLowerCase();
  const keywords = scoring.keywords;
  
  // Edge case: if keywords is somehow empty (shouldn't happen with validation)
  if (keywords.length === 0) {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: "Invalid scoring configuration: no keywords defined"
    };
  }
  
  // Find matched keywords
  const matchedKeywords = keywords.filter(keyword => 
    answerLower.includes(keyword.toLowerCase())
  );
  
  const matchCount = matchedKeywords.length;
  const matchRatio = matchCount / keywords.length;
  
  // Check minimum match ratio
  if (scoring.minimumMatchRatio !== undefined && matchRatio < scoring.minimumMatchRatio) {
    return {
      questionId: "",
      awarded: 0,
      max,
      reason: `Matched ${matchCount}/${keywords.length} keywords but below minimum ratio ${scoring.minimumMatchRatio}`
    };
  }
  
  let awarded = (matchCount / keywords.length) * max;
  
  // Ensure awarded is not NaN and is within bounds
  awarded = Math.max(0, Math.min(awarded, max));
  
  const reason = matchedKeywords.length > 0
    ? `Matched ${matchCount}/${keywords.length} keywords: ${matchedKeywords.join(", ")}`
    : `Matched 0/${keywords.length} keywords`;
  
  return {
    questionId: "",
    awarded: Math.round(awarded * 100) / 100, // Round to 2 decimals
    max,
    reason
  };
}

