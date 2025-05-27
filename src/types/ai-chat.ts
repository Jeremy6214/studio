
// src/types/ai-chat.ts

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  text?: string;
  imageUrl?: string;
  imageQuery?: string;
  suggestions?: string[];
  isLoading?: boolean;
  isError?: boolean; // Added to mark error messages from AI
  timestamp: number;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActivity: number;
}
