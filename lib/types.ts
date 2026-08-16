export type KnowledgeCategory =
  | "hours"
  | "tuition"
  | "health"
  | "food"
  | "enrollment"
  | "policies"
  | "contact";

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  body: string;
  /** Set when an operator answered a gap from the inbox. */
  addedByOperator?: boolean;
  updatedAt: string;
}

export type AnswerStatus = "answered" | "escalated" | "gap";

export interface QuestionLogItem {
  id: string;
  question: string;
  answer: string;
  status: AnswerStatus;
  sourceId: string | null;
  askedAt: string;
  /** Set once an operator closes a gap by writing a knowledge entry. */
  resolvedByEntryId?: string;
}

export interface ChatResponse {
  answer: string;
  sourceId: string | null;
  confidence: "high" | "low";
  escalate: boolean;
  escalationReason?: string;
}

export interface ChatMessage {
  id: string;
  role: "parent" | "desk";
  text: string;
  response?: ChatResponse;
  pending?: boolean;
  error?: boolean;
}
