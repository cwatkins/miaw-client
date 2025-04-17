/**
 * Represents a single message entry in a conversation
 */
export interface ConversationEntry {
  /** Unique identifier for the message */
  id: string;
  /** The message content */
  text: string;
  /** ID of the message sender */
  senderId: string;
  /** ISO timestamp of when the message was sent */
  timestamp: string;
  /** Additional message metadata */
  metadata: Record<string, unknown>;
  /** Whether the message has been read */
  isRead: boolean;
}

/**
 * Response object containing conversation list and pagination info
 */
export interface ConversationResponse {
  /** List of conversation entries */
  entries: ConversationEntry[];
  /** Pagination information */
  pagination: {
    /** Total number of conversations */
    total: number;
    /** Current offset in the list */
    offset: number;
    /** Maximum number of entries per page */
    limit: number;
  };
}

/**
 * Current status of a conversation
 */
export interface ConversationStatus {
  /** Current status (e.g., 'active', 'closed', 'waiting') */
  status: string;
  /** Timestamp of last activity */
  lastActivity: string;
  /** Information about conversation participants */
  participants: Record<string, unknown>;
}

/**
 * Parameters required for sending a message
 */
export interface MessageParams {
  /** The message content to send */
  text: string;
  /** Optional metadata for the message */
  metadata?: Record<string, unknown>;
  /** Type of message (e.g., 'text', 'rich') */
  type?: string;
}

/**
 * Parameters for sending message receipts
 */
export interface ReceiptParams {
  /** IDs of messages to mark as received/read */
  messageIds: string[];
  /** Type of receipt ('delivered' or 'read') */
  type: string;
}

/**
 * Configuration options for Server-Sent Events stream
 */
export interface SSEOptions {
  /** Types of events to subscribe to */
  eventTypes?: string[];
  /** Time in ms to wait before reconnecting */
  reconnectInterval?: number;
  /** Connection timeout in ms */
  timeout?: number;
} 