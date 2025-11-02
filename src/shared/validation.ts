import type { Job, Question, QuestionType } from "../domain/job";
import type { ApplicationAnswer, CandidateInfo } from "../domain/application";
import { ValidationError } from "./errors";

const VALID_QUESTION_TYPES: QuestionType[] = ["single_choice", "multi_choice", "number", "text"];

export function validateCreateJob(data: unknown): void {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    throw new ValidationError(["Invalid request body"]);
  }

  const job = data as Partial<Job>;

  // Required fields
  if (!job.title || typeof job.title !== "string" || job.title.trim() === "") {
    errors.push("title is required");
  }

  if (!job.location || typeof job.location !== "string" || job.location.trim() === "") {
    errors.push("location is required");
  }

  if (!job.customer || typeof job.customer !== "string" || job.customer.trim() === "") {
    errors.push("customer is required");
  }

  if (!job.jobName || typeof job.jobName !== "string" || job.jobName.trim() === "") {
    errors.push("jobName is required");
  }

  if (!job.description || typeof job.description !== "string" || job.description.trim() === "") {
    errors.push("description is required");
  }

  // Questions validation
  if (!job.questions || !Array.isArray(job.questions)) {
    errors.push("questions must be an array");
  } else if (job.questions.length === 0) {
    errors.push("questions must have at least one question");
  } else {
    job.questions.forEach((q, index) => {
      validateQuestion(q, index, errors);
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

function validateQuestion(q: unknown, index: number, errors: string[]): void {
  if (!q || typeof q !== "object") {
    errors.push(`questions[${index}] must be an object`);
    return;
  }

  const question = q as Partial<Question>;

  if (!question.text || typeof question.text !== "string") {
    errors.push(`questions[${index}].text is required`);
  }

  if (!question.type || !VALID_QUESTION_TYPES.includes(question.type)) {
    errors.push(`questions[${index}].type must be one of: ${VALID_QUESTION_TYPES.join(", ")}`);
    return;
  }

  if (!question.scoring || typeof question.scoring !== "object") {
    errors.push(`questions[${index}].scoring is required`);
    return;
  }

  const scoring = question.scoring;

  // Validate maxPoints
  if (typeof scoring.maxPoints !== "number" || scoring.maxPoints <= 0 || !isFinite(scoring.maxPoints)) {
    errors.push(`questions[${index}].scoring.maxPoints must be a positive finite number`);
  }

  if (scoring.kind !== question.type) {
    errors.push(`questions[${index}].scoring.kind must match question type`);
  }

  // Type-specific validation
  switch (question.type) {
    case "single_choice":
      if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
        errors.push(`questions[${index}].options is required for single_choice and must have at least one option`);
      }
      if ("correctOption" in scoring) {
        if (typeof scoring.correctOption !== "string" || scoring.correctOption === "") {
          errors.push(`questions[${index}].scoring.correctOption is required for single_choice`);
        } else if (question.options && !question.options.includes(scoring.correctOption)) {
          errors.push(`questions[${index}].scoring.correctOption must be one of the provided options`);
        }
      } else {
        errors.push(`questions[${index}].scoring.correctOption is required for single_choice`);
      }
      break;

    case "multi_choice":
      if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
        errors.push(`questions[${index}].options is required for multi_choice and must have at least one option`);
      }
      if ("correctOptions" in scoring) {
        if (!Array.isArray(scoring.correctOptions) || scoring.correctOptions.length === 0) {
          errors.push(`questions[${index}].scoring.correctOptions is required for multi_choice and must have at least one option`);
        } else if (question.options) {
          const invalidOptions = scoring.correctOptions.filter(opt => !question.options!.includes(opt));
          if (invalidOptions.length > 0) {
            errors.push(`questions[${index}].scoring.correctOptions contains invalid options: ${invalidOptions.join(", ")}`);
          }
        }
      } else {
        errors.push(`questions[${index}].scoring.correctOptions is required for multi_choice`);
      }
      break;

    case "number":
      if ("min" in scoring && "max" in scoring) {
        if (typeof scoring.min !== "number" || typeof scoring.max !== "number") {
          errors.push(`questions[${index}].scoring.min and max must be numbers`);
        } else if (scoring.min > scoring.max) {
          errors.push(`questions[${index}].scoring.min must be less than or equal to max`);
        }
      } else {
        errors.push(`questions[${index}].scoring.min and max are required for number`);
      }
      break;

    case "text":
      if ("keywords" in scoring) {
        if (!Array.isArray(scoring.keywords) || scoring.keywords.length === 0) {
          errors.push(`questions[${index}].scoring.keywords is required for text and must have at least one keyword`);
        } else if (!scoring.keywords.every(k => typeof k === "string" && k.trim() !== "")) {
          errors.push(`questions[${index}].scoring.keywords must be non-empty strings`);
        }
        if ("minimumMatchRatio" in scoring && scoring.minimumMatchRatio !== undefined) {
          if (typeof scoring.minimumMatchRatio !== "number" || 
              scoring.minimumMatchRatio < 0 || 
              scoring.minimumMatchRatio > 1) {
            errors.push(`questions[${index}].scoring.minimumMatchRatio must be between 0 and 1`);
          }
        }
      } else {
        errors.push(`questions[${index}].scoring.keywords is required for text`);
      }
      break;
  }
}

export function validateCreateApplication(
  data: unknown,
  job: Job
): void {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    throw new ValidationError(["Invalid request body"]);
  }

  const application = data as { candidate?: unknown; answers?: unknown };

  // Validate candidate
  if (!application.candidate || typeof application.candidate !== "object") {
    errors.push("candidate is required");
  } else {
    const candidate = application.candidate as Partial<CandidateInfo>;
    if (!candidate.name || typeof candidate.name !== "string" || candidate.name.trim() === "") {
      errors.push("candidate.name is required");
    }
    if (!candidate.email || typeof candidate.email !== "string" || candidate.email.trim() === "") {
      errors.push("candidate.email is required");
    } else if (!isValidEmail(candidate.email)) {
      errors.push("candidate.email must be a valid email address");
    }
  }

  // Validate answers
  if (!application.answers || !Array.isArray(application.answers)) {
    errors.push("answers must be an array");
  } else {
    const answers = application.answers as ApplicationAnswer[];
    
    answers.forEach((answer, index) => {
      if (!answer.questionId || typeof answer.questionId !== "string") {
        errors.push(`answers[${index}].questionId is required`);
        return;
      }

      // Find the question
      const question = job.questions.find(q => q.id === answer.questionId);
      if (!question) {
        errors.push(`answers[${index}].questionId "${answer.questionId}" does not exist in this job`);
        return;
      }

      // Validate answer type matches question type
      validateAnswerType(answer.answer, question, index, errors);
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

function validateAnswerType(
  answer: unknown,
  question: Question,
  index: number,
  errors: string[]
): void {
  switch (question.type) {
    case "single_choice":
      if (typeof answer !== "string") {
        errors.push(`answers[${index}].answer must be a string for single_choice question`);
      }
      break;

    case "multi_choice":
      if (!Array.isArray(answer)) {
        errors.push(`answers[${index}].answer must be an array for multi_choice question`);
      } else if (answer.length === 0) {
        errors.push(`answers[${index}].answer must have at least one selection for multi_choice question`);
      } else if (!answer.every(a => typeof a === "string")) {
        errors.push(`answers[${index}].answer must be an array of strings for multi_choice question`);
      }
      break;

    case "number":
      if (typeof answer !== "number") {
        errors.push(`answers[${index}].answer must be a number for number question`);
      } else if (!isFinite(answer)) {
        errors.push(`answers[${index}].answer must be a finite number (not NaN or Infinity)`);
      }
      break;

    case "text":
      if (typeof answer !== "string") {
        errors.push(`answers[${index}].answer must be a string for text question`);
      }
      break;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

