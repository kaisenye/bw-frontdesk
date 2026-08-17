/**
 * Canonical list, with the union derived from it. The drafting route runs on the
 * server and needs these values, and the admin components are client-only, so
 * the list lives here rather than in either.
 */
export const KNOWLEDGE_CATEGORIES = ['hours', 'tuition', 'health', 'food', 'enrollment', 'policies', 'contact'] as const

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number]

export interface KnowledgeEntry {
  id: string
  title: string
  category: KnowledgeCategory
  body: string
  /** Set when an operator answered a gap from the inbox. */
  addedByOperator?: boolean
  updatedAt: string
}

/**
 * "chitchat" covers thanks, greetings, and anything else that needs no handbook
 * entry. Without it every "Thanks!" became a knowledge gap and told the operator
 * to go write a policy about gratitude.
 */
export type AnswerStatus = 'answered' | 'escalated' | 'gap' | 'chitchat'

export interface QuestionLogItem {
  id: string
  question: string
  answer: string
  status: AnswerStatus
  sourceId: string | null
  askedAt: string
  /** Set once an operator closes a gap by writing a knowledge entry. */
  resolvedByEntryId?: string
  /**
   * Set when an operator confirms they have handled an escalation. The item
   * stays "escalated" (it was routed to a person, and that is a fact about what
   * happened) but drops out of the needs-attention queue.
   */
  reviewedAt?: string
}

export interface ChatResponse {
  answer: string
  sourceId: string | null
  confidence: 'high' | 'low'
  escalate: boolean
  /**
   * False when the message is not really a question about the center (thanks,
   * greetings, small talk). Such a message has no citation, but it is not a
   * knowledge gap and must never land in the operator's queue.
   */
  needsKnowledge?: boolean
  escalationReason?: string
  /**
   * Who the question is being handed to. The card used to always name the
   * director, which read as broken when a parent had just said they could not
   * reach her, so the model picks the destination from context instead.
   */
  routedTo?: string
}

/**
 * A proposed knowledge entry, written from the center's existing entries so the
 * operator edits instead of starting from a blank box. The operator is always
 * the author: this is a first pass they correct and own.
 */
export interface DraftResponse {
  ok: true
  /** Empty means the client keeps its own suggestTitle heuristic. */
  title: string
  category: KnowledgeCategory
  body: string
  /** How well the existing entries supported the draft, not how true it is. */
  confidence: 'high' | 'low'
  /** Things the operator must confirm before saving. Drives the checklist. */
  assumptions: string[]
}

export interface DraftFailure {
  ok: false
  reason: string
}

export type DraftResult = DraftResponse | DraftFailure

export interface ChatMessage {
  id: string
  role: 'parent' | 'desk'
  text: string
  response?: ChatResponse
  pending?: boolean
  error?: boolean
}
