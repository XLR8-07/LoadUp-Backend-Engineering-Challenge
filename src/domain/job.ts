export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "number"
  | "text";

export interface BaseScoring {
  maxPoints: number;
}

export interface SingleChoiceScoring extends BaseScoring {
  kind: "single_choice";
  correctOption: string;
}

export interface MultiChoiceScoring extends BaseScoring {
  kind: "multi_choice";
  correctOptions: string[];
  penalizeExtras?: boolean;
}

export interface NumberScoring extends BaseScoring {
  kind: "number";
  min: number;
  max: number;
}

export interface TextScoring extends BaseScoring {
  kind: "text";
  keywords: string[];
  minimumMatchRatio?: number;
}

export type QuestionScoring =
  | SingleChoiceScoring
  | MultiChoiceScoring
  | NumberScoring
  | TextScoring;

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scoring: QuestionScoring;
}

export interface Job {
  id: string;
  title: string;
  location: string;
  customer: string;
  jobName: string;
  description: string;
  questions: Question[];
  createdAt: string;
}

