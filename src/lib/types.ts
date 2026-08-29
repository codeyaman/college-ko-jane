/** Shared client-safe view models (no server imports). */

export interface SourceRef {
  documentId: string;
  title: string;
  category: string;
  score: number;
  snippet: string;
}

export interface ChatMessageVM {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[] | null;
  confidence?: number | null;
  pending?: boolean;
  unknown?: boolean;
  errorText?: string;
}

export interface ConversationVM {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface UserVM {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
}

export interface KbInfo {
  docs: number;
  chunks: number;
}
