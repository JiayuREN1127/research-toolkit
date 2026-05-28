export type ToolType = 'idea' | 'proposal' | 'design' | 'abstraction' | 'causality';

export type ConversationPhase = 'idea' | 'clarifying' | 'done';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  phase: ConversationPhase;
  idea: string;
  messages: Message[];
  clarificationsAsked: number;
}

export interface KnowledgePoint {
  id: string;
  session: number;
  topic: string;
  concept: string;
  pdfFile: string;
  pdfPage: number;
  keywords: string[];
}

export type Severity = 'error' | 'warning' | 'ok';

export interface ChecklistItem {
  category: string;
  point: string;
  reason: string;
  example: string;
  severity?: Severity;
  suggestion?: string;
  knowledgePoint: {
    session: number;
    topic: string;
    concept: string;
    pdfFile: string;
    pdfPage: number;
  };
}
