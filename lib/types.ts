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
  /**
   * Set when an operator confirms they have handled an escalation. The item
   * stays "escalated" (it was routed to a person, and that is a fact about what
   * happened) but drops out of the needs-attention queue.
   */
  reviewedAt?: string;
}

export interface ChatResponse {
  answer: string;
  sourceId: string | null;
  confidence: "high" | "low";
  escalate: boolean;
  escalationReason?: string;
  /**
   * Who the question is being handed to. The card used to always name the
   * director, which read as broken when a parent had just said they could not
   * reach her, so the model picks the destination from context instead.
   */
  routedTo?: string;
}

export interface ChatMessage {
  id: string;
  role: "parent" | "desk";
  text: string;
  response?: ChatResponse;
  pending?: boolean;
  error?: boolean;
}
