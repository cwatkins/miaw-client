export interface AccessTokenResponse {
  accessToken: string;
  lastEventId: string;
  context: {
    deviceId: string;
    configuration: {
      embeddedServiceConfig: {
        name: string;
        deploymentType: string;
        embeddedServiceMessagingChannel: {
          channelAddressIdentifier: string;
          authMode: string;
        };
      };
    };
  };
}

export interface ConversationCreateResponse {
  conversationId: string;
}

export interface ConversationRoutingStatusResponse {
  conversationId: string;
  routingStatus: string;
}

export interface ConversationEntryResponse {
  conversationEntries: Array<{
    entryType: string;
    entryPayload: string;
    transcriptedTimestamp: number;
    sender: {
      role: string;
      subject: string;
      appType?: string;
      clientIdentifier?: string;
    };
    clientTimestamp: number;
    identifier: string;
    senderDisplayName: string;
  }>;
}

export interface MessageResponse {
  conversationEntries: Array<{
    id: string;
    clientTimestamp: number;
  }>;
}

export type SSEEventType =
  | 'CONVERSATION_ROUTING_RESULT'
  | 'CONVERSATION_PARTICIPANT_CHANGED'
  | 'CONVERSATION_MESSAGE'
  | 'CONVERSATION_DELIVERY_ACKNOWLEDGEMENT'
  | 'CONVERSATION_READ_ACKNOWLEDGEMENT'
  | 'CONVERSATION_TYPING_STARTED_INDICATOR'
  | 'CONVERSATION_TYPING_STOPPED_INDICATOR'
  | 'CONVERSATION_CLOSE_CONVERSATION';

export interface BaseSSEEvent {
  channelPlatformKey: string;
  channelType: string;
  channelAddressIdentifier: string;
  conversationId: string;
}

export interface SSERoutingResult extends BaseSSEEvent {
  conversationEntry: {
    entryType: 'RoutingResult';
    identifier: string;
    transcriptedTimestamp: number;
    clientTimestamp: number;
    entryPayload: string; 
  };
}

export interface SSEParticipantChanged extends BaseSSEEvent {
  conversationEntry: {
    entryType: 'ParticipantChanged';
    identifier: string;
    transcriptedTimestamp: number;
    clientTimestamp: number;
    entryPayload: string;
  };
}

export interface SSEMessage extends BaseSSEEvent {
  conversationEntry: {
    entryType: 'Message';
    identifier: string;
    senderDisplayName?: string;
    sender?: {
      role: string;
      appType: string;
      subject: string;
      clientIdentifier: string;
    };
    transcriptedTimestamp: number;
    clientTimestamp: number;
    entryPayload: string; 
  };
}

export interface SSEDeliveryAcknowledgement extends BaseSSEEvent {
  conversationEntry: {
    entryType: 'DeliveryAcknowledgement';
    identifier: string;
    transcriptedTimestamp: number;
    clientTimestamp: number;
    entryPayload: string; 
  };
}

export interface SSEReadAcknowledgement extends BaseSSEEvent {
  conversationEntry: {
    entryType: 'ReadAcknowledgement';
    identifier: string;
    transcriptedTimestamp: number;
    clientTimestamp: number;
    entryPayload: string;
  };
}

export interface SSETypingIndicator extends BaseSSEEvent {
  conversationEntry: {
    entryType: 'TypingStartedIndicator' | 'TypingStoppedIndicator';
    identifier: string;
    transcriptedTimestamp: number;
    clientTimestamp: number;
    entryPayload: string; 
  };
}

export interface SSECloseConversation extends BaseSSEEvent {
  conversationEntry: {
    entryType: 'CloseConversation';
    identifier: string;
    transcriptedTimestamp: number;
    clientTimestamp: number;
    entryPayload: string; 
  };
}

export type SSEEvent =
  | SSERoutingResult
  | SSEParticipantChanged
  | SSEMessage
  | SSEDeliveryAcknowledgement
  | SSEReadAcknowledgement
  | SSETypingIndicator
  | SSECloseConversation;
