/**
 * Chart source enumeration
 * Defines how a chart version was created
 */
export enum ChartSource {
  GENERATION = 'generation',
  FIX = 'fix',
}

/**
 * Result status enumeration
 * Defines the possible states of a result/chart generation
 */
export enum ResultStatus {
  PENDING = 'pending',
  PLANNING = 'planning',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error',
  FIXING = 'fixing',
}

/**
 * Message role enumeration
 * Defines the possible roles in a conversation
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}
