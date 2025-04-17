import { EventSourceMessage } from 'eventsource-client';

/**
 * Logger interface for handling different types of log messages
 */
export interface Logger {
  /** Log an error message with optional arguments */
  error(message: string, ...args: unknown[]): void;
  /** Log a warning message with optional arguments */
  warn(message: string, ...args: unknown[]): void;
  /** Log an informational message with optional arguments */
  info(message: string, ...args: unknown[]): void;
  /** Log a debug message with optional arguments */
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Configuration interface for Messaging In-App and Web client
 */
export interface MessagingInAppWebConfig {
  /** Base URL for the Messaging API */
  baseUrl: string;
  /** Organization ID */
  orgId: string;
  /** Developer name for the application */
  developerName: string;
  /** Optional logger instance for debugging and monitoring */
  logger?: Logger;
}

/**
 * Event Service Types
 */
export interface SSEOptions {
  /** Optional last event ID to resume connection from a specific point */
  lastEventId?: string;
  /** Callback function for handling incoming events */
  onEvent: (event: EventSourceMessage) => void;
  /** Optional callback for when connection is opened */
  onOpen?: () => void;
  /** Optional callback for handling connection errors */
  onError?: (error: Event) => void;
  /** Optional callback for when connection is closed */
  onClose?: () => void;
}

/**
 * Token Service Types
 */
export interface TokenCreateParams {
  /** Version of the capabilities to use */
  capabilitiesVersion?: string;
  /** Platform the token is being used on */
  platform?: 'Web' | 'Mobile';
  /** Unique identifier for the device */
  deviceId?: string;
  /** Context information about the application */
  context?: {
    /** Name of the application */
    appName: string;
    /** Version of the client */
    clientVersion: string;
  };
  /** Type of authorization being used */
  authorizationType?: string;
  /** Token for customer identity */
  customerIdentityToken?: string;
}

export interface TokenResponse {
  /** The access token for authentication */
  accessToken: string;
  /** ID of the last event processed */
  lastEventId: string;
}

/**
 * Conversation Service Types
 */
export interface ConversationCreateParams {
  /** Optional ID for the conversation */
  id?: string;
  /** Optional routing attributes for conversation handling */
  routingAttributes?: Record<string, unknown>;
}

export interface MessageParams {
  /** The text content of the message */
  text: string;
  /** Optional ID for the message */
  id?: string;
  /** Whether this message starts a new session */
  isNewSession?: boolean;
  /** Optional routing attributes for message handling */
  routingAttributes?: Record<string, unknown>;
  /** Optional language code for the message */
  language?: string;
}

export interface ConversationEntryListParams {
  /** Maximum number of entries to return */
  limit?: number;
  /** Start timestamp for filtering entries */
  startTimestamp?: string;
  /** End timestamp for filtering entries */
  endTimestamp?: string;
  /** Direction to list entries from */
  direction?: 'FromEnd' | 'FromStart';
  /** Types of entries to include in the list */
  entryTypeFilter?: string[];
}

export interface ConversationEntry {
  /** Unique identifier for the entry */
  id: string;
  /** Type of the entry (e.g., 'Message', 'TypingIndicator') */
  type: string;
  /** Optional text content of the entry */
  text?: string;
  /** Timestamp when the entry was created */
  timestamp: string;
  /** Information about the sender */
  sender: {
    /** ID of the sender */
    id: string;
    /** Type of the sender (e.g., 'endUser', 'agent') */
    type: string;
  };
  /** Optional routing attributes */
  routingAttributes?: Record<string, unknown>;
}

export interface ConversationStatus {
  /** ID of the conversation */
  id: string;
  /** Current status of the conversation */
  status: string;
  /** Timestamp of the last activity */
  lastActivityTimestamp: string;
  /** Whether the conversation is currently active */
  isActive: boolean;
}

export interface ConversationResponse {
  /** ID of the conversation */
  id: string;
  /** List of conversation entries */
  entries: ConversationEntry[];
}

export interface ReceiptEntry {
  /** Optional ID for the receipt */
  id?: string;
  /** Type of receipt */
  type?: 'Delivery' | 'Read';
  /** ID of the conversation entry being acknowledged */
  conversationEntryId: string;
}

export interface ReceiptParams {
  /** List of receipt entries to send */
  entries: ReceiptEntry[];
} 