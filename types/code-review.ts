export interface CodeReview {
  id: string;
  code: string;
  language: string;
  submitter_id: string;
  reviewer_id?: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  overall_score?: number;
  feedback?: string;
  comments: ReviewComment[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ReviewComment {
  id: string;
  line_number: number;
  comment: string;
  author_id: string;
  severity: "info" | "warning" | "error";
  created_at: string;
}

export interface CodeReviewCreate {
  code: string;
  language: string;
  description?: string;
}

export interface CodeQuality {
  readability_score: number;
  efficiency_score: number;
  maintainability_score: number;
  security_score: number;
  overall_score: number;
  suggestions: string[];
}
