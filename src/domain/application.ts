export interface CandidateInfo {
  name: string;
  email: string;
}

export interface ApplicationAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export interface PerQuestionScore {
  questionId: string;
  awarded: number;
  max: number;
  reason: string;
}

export interface ScoreReport {
  total: number;
  maxTotal: number;
  perQuestion: PerQuestionScore[];
}

export interface Application {
  id: string;
  jobId: string;
  candidate: CandidateInfo;
  answers: ApplicationAnswer[];
  score: ScoreReport;
  createdAt: string;
}

