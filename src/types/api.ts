/**
 * Raw API response types for the Messaging In-App and Web API.
 * These types represent the exact structure of API responses and should not be used directly by clients.
 */

/**
 * Response from token creation/refresh endpoint
 */
export interface AccessTokenResponse {
  /** The access token for authentication */
  accessToken: string;
  /** ID of the last event processed */
  lastEventId: string;
  /** Context information about the token */
  context: {
    /** Unique identifier for the device */
    deviceId: string;
    /** Configuration information */
    configuration: {
      /** Embedded service configuration */
      embeddedServiceConfig: {
        /** Name of the service */
        name: string;
        /** Type of deployment */
        deploymentType: string;
        /** Messaging channel configuration */
        embeddedServiceMessagingChannel: {
          /** Channel address identifier */
          channelAddressIdentifier: string;
          /** Authentication mode */
          authMode: string;
        };
      };
    };
  };
}

/**
 * Response from conversation creation endpoint
 */
export interface ConversationCreateResponse {
  /** ID of the created conversation */
  conversationId: string;
}

/**
 * Response from conversation status endpoint
 */
export interface ConversationRoutingStatusResponse {
  /** ID of the conversation */
  conversationId: string;
  /** Current routing status */
  routingStatus: string;
}

/**
 * Response from conversation entries endpoint
 */
export interface ConversationEntryResponse {
  /** List of conversation entries */
  conversationEntries: Array<{
    /** Type of the entry */
    entryType: string;
    /** Content of the entry */
    entryPayload: string;
    /** Server timestamp of the entry */
    transcriptedTimestamp: number;
    /** Information about the sender */
    sender: {
      /** Role of the sender */
      role: string;
      /** Subject identifier */
      subject: string;
      /** Optional application type */
      appType?: string;
      /** Optional client identifier */
      clientIdentifier?: string;
    };
    /** Client timestamp of the entry */
    clientTimestamp: number;
    /** Unique identifier for the entry */
    identifier: string;
    /** Display name of the sender */
    senderDisplayName: string;
  }>;
}

/**
 * Response from message sending endpoint
 */
export interface MessageResponse {
  /** List of created message entries */
  conversationEntries: Array<{
    /** ID of the message entry */
    id: string;
    /** Client timestamp of the message */
    clientTimestamp: number;
  }>;
}

/**
 * Types of SSE events that can be received
 */
export type SSEEventType =
  | 'CONVERSATION_ROUTING_RESULT'
  | 'CONVERSATION_PARTICIPANT_CHANGED'
  | 'CONVERSATION_MESSAGE'
  | 'CONVERSATION_DELIVERY_ACKNOWLEDGEMENT'
  | 'CONVERSATION_READ_ACKNOWLEDGEMENT'
  | 'CONVERSATION_TYPING_STARTED_INDICATOR'
  | 'CONVERSATION_TYPING_STOPPED_INDICATOR'
  | 'CONVERSATION_CLOSE_CONVERSATION';

/**
 * Base interface for all SSE events
 */
export interface BaseSSEEvent {
  /** Platform key for the channel */
  channelPlatformKey: string;
  /** Type of the channel */
  channelType: string;
  /** Identifier for the channel address */
  channelAddressIdentifier: string;
  /** ID of the conversation */
  conversationId: string;
}

/**
 * SSE event for routing results
 */
export interface SSERoutingResult extends BaseSSEEvent {
  /** The routing result entry */
  conversationEntry: {
    /** Type of the entry */
    entryType: 'RoutingResult';
    /** Unique identifier */
    identifier: string;
    /** Server timestamp */
    transcriptedTimestamp: number;
    /** Client timestamp */
    clientTimestamp: number;
    /** Content of the entry */
    entryPayload: string; 
  };
}

/**
 * SSE event for participant changes
 */
export interface SSEParticipantChanged extends BaseSSEEvent {
  /** The participant change entry */
  conversationEntry: {
    /** Type of the entry */
    entryType: 'ParticipantChanged';
    /** Unique identifier */
    identifier: string;
    /** Server timestamp */
    transcriptedTimestamp: number;
    /** Client timestamp */
    clientTimestamp: number;
    /** Content of the entry */
    entryPayload: string;
  };
}

/**
 * SSE event for new messages
 */
export interface SSEMessage extends BaseSSEEvent {
  /** The message entry */
  conversationEntry: {
    /** Type of the entry */
    entryType: 'Message';
    /** Unique identifier */
    identifier: string;
    /** Optional display name of the sender */
    senderDisplayName?: string;
    /** Optional sender information */
    sender?: {
      /** Role of the sender */
      role: string;
      /** Type of application */
      appType: string;
      /** Subject identifier */
      subject: string;
      /** Client identifier */
      clientIdentifier: string;
    };
    /** Server timestamp */
    transcriptedTimestamp: number;
    /** Client timestamp */
    clientTimestamp: number;
    /** Content of the entry */
    entryPayload: string; 
  };
}

/**
 * SSE event for delivery acknowledgments
 */
export interface SSEDeliveryAcknowledgement extends BaseSSEEvent {
  /** The delivery acknowledgment entry */
  conversationEntry: {
    /** Type of the entry */
    entryType: 'DeliveryAcknowledgement';
    /** Unique identifier */
    identifier: string;
    /** Server timestamp */
    transcriptedTimestamp: number;
    /** Client timestamp */
    clientTimestamp: number;
    /** Content of the entry */
    entryPayload: string; 
  };
}

/**
 * SSE event for read acknowledgments
 */
export interface SSEReadAcknowledgement extends BaseSSEEvent {
  /** The read acknowledgment entry */
  conversationEntry: {
    /** Type of the entry */
    entryType: 'ReadAcknowledgement';
    /** Unique identifier */
    identifier: string;
    /** Server timestamp */
    transcriptedTimestamp: number;
    /** Client timestamp */
    clientTimestamp: number;
    /** Content of the entry */
    entryPayload: string;
  };
}

/**
 * SSE event for typing indicators
 */
export interface SSETypingIndicator extends BaseSSEEvent {
  /** The typing indicator entry */
  conversationEntry: {
    /** Type of the entry */
    entryType: 'TypingStartedIndicator' | 'TypingStoppedIndicator';
    /** Unique identifier */
    identifier: string;
    /** Server timestamp */
    transcriptedTimestamp: number;
    /** Client timestamp */
    clientTimestamp: number;
    /** Content of the entry */
    entryPayload: string; 
  };
}

/**
 * SSE event for conversation closure
 */
export interface SSECloseConversation extends BaseSSEEvent {
  /** The close conversation entry */
  conversationEntry: {
    /** Type of the entry */
    entryType: 'CloseConversation';
    /** Unique identifier */
    identifier: string;
    /** Server timestamp */
    transcriptedTimestamp: number;
    /** Client timestamp */
    clientTimestamp: number;
    /** Content of the entry */
    entryPayload: string; 
  };
}

/**
 * Union type of all possible SSE events
 */
export type SSEEvent =
  | SSERoutingResult
  | SSEParticipantChanged
  | SSEMessage
  | SSEDeliveryAcknowledgement
  | SSEReadAcknowledgement
  | SSETypingIndicator
  | SSECloseConversation;
