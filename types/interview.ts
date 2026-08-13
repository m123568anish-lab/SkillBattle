export interface Interview {
  id: string;
  title: string;
  description?: string;
  interview_type: "technical" | "behavioral" | "mock";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  difficulty: "easy" | "medium" | "hard";
  candidate_id: string;
  interviewer_id: string;
  questions_count: number;
  duration: number;
  score?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: string;
  question_text: string;
  type: "coding" | "multiple_choice" | "essay" | "verbal";
  difficulty: "easy" | "medium" | "hard";
  expected_answer?: string;
  hints?: string[];
}

export interface InterviewCreate {
  title: string;
  description?: string;
  interview_type: "technical" | "behavioral" | "mock";
  difficulty: "easy" | "medium" | "hard";
  interviewer_id: string;
  questions: InterviewQuestion[];
  duration: number;
}

export interface InterviewUpdate {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
}

export interface InterviewAnswer {
  question_id: string;
  answer: string;
  score?: number;
  feedback?: string;
}
