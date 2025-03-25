import { randomUUID } from 'crypto';
import type { Logger } from '../MessagingInAppWeb.js';
import { makeRequest } from '../utils/request.js';
import type {
  ConversationRoutingStatusResponse,
  ConversationEntryResponse,
  MessageResponse,
} from '../types/api.ts';

/** Parameters for creating a new conversation */
export interface ConversationCreateParams {
  id?: string;
  routingAttributes?: Record<string, unknown>;
}

/** Parameters for sending a message in a conversation */
export interface MessageParams {
  text: string;
  id?: string;
  isNewSession?: boolean;
  routingAttributes?: Record<string, unknown>;
  language?: string;
}

/** Parameters for listing conversation entries */
export interface ConversationEntryListParams {
  limit?: number;
  startTimestamp?: string;
  endTimestamp?: string;
  direction?: 'FromEnd' | 'FromStart';
  entryTypeFilter?: string[];
}

/** Represents a single entry in a conversation */
export interface ConversationEntry {
  id: string;
  type: string;
  text?: string;
  timestamp: string;
  sender: {
    id: string;
    type: string;
  };
  routingAttributes?: Record<string, unknown>;
}

/** Represents the current status of a conversation */
export interface ConversationStatus {
  id: string;
  status: string;
  lastActivityTimestamp: string;
  isActive: boolean;
}

/** Response structure for conversation data */
export interface ConversationResponse {
  id: string;
  entries: ConversationEntry[];
}

/** Represents a receipt entry for message delivery/read status */
export interface ReceiptEntry {
  id?: string;
  type?: 'Delivery' | 'Read';
  conversationEntryId: string;
}

/** Parameters for sending message receipts */
export interface ReceiptParams {
  entries: ReceiptEntry[];
}

/**
 * Service class for managing conversations with the Messaging In-App and Web API.
 * Handles creation, messaging, and management of conversation sessions.
 */
export class ConversationService {
  constructor(
    private baseUrl: string,
    private developerName: string,
    private logger: Logger,
    private orgId: string
  ) {}

  /**
   * Creates a new conversation.
   * @param {string} token - Authentication token
   * @param {ConversationCreateParams} params - Optional parameters for conversation creation
   * @returns {Promise<{ id: string }>} Promise containing the created conversation ID
   */
  async create(token: string, params: ConversationCreateParams = {}): Promise<{ id: string }> {
    const conversationId = params.id || randomUUID().toLowerCase();
    this.logger.debug(`Creating conversation with ID: ${conversationId}`);

    await makeRequest(
      `${this.baseUrl}/iamessage/api/v2/conversation`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          conversationId,
          esDeveloperName: this.developerName,
          ...(params.routingAttributes ? { routingAttributes: params.routingAttributes } : {}),
        },
      },
      'conversations.create_conversation',
      this.logger
    );

    return { id: conversationId };
  }

  /**
   * Closes an existing conversation.
   * @param {string} token - Authentication token
   * @param {string} conversationId - ID of the conversation to close
   * @returns {Promise<{ success: boolean }>} Promise indicating success
   */
  async close(token: string, conversationId: string): Promise<{ success: boolean }> {
    this.logger.debug(`Closing conversation: ${conversationId}`);

    await makeRequest(
      `${this.baseUrl}/iamessage/api/v2/conversation/${conversationId}?esDeveloperName=${this.developerName}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
      'conversations.close_conversation',
      this.logger
    );

    return { success: true };
  }

  /**
   * Ends the current session for a conversation.
   * @param {string} token - Authentication token
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise<{ success: boolean }>} Promise indicating success
   */
  async endSession(token: string, conversationId: string): Promise<{ success: boolean }> {
    this.logger.debug(`Ending session for conversation: ${conversationId}`);

    await makeRequest(
      `${this.baseUrl}/iamessage/api/v2/conversation/${conversationId}/session?esDeveloperName=${this.developerName}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
      'conversations.end_conversation_session',
      this.logger
    );

    return { success: true };
  }

  /**
   * Retrieves the current status of a conversation.
   * @param {string} token - Authentication token
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise<ConversationStatus>} Promise containing conversation status details
   */
  async status(token: string, conversationId: string): Promise<ConversationStatus> {
    this.logger.debug(`Getting status for conversation: ${conversationId}`);

    const response = await makeRequest<Response>(
      `${this.baseUrl}/iamessage/api/v2/conversation/${conversationId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
      'conversations.retrieve_routing_status',
      this.logger
    );

    const responseData = (await response.json()) as ConversationRoutingStatusResponse;
    return {
      id: conversationId,
      status: responseData.routingStatus,
      lastActivityTimestamp: new Date().toISOString(),
      isActive: true,
    };
  }

  /**
   * Sends a message in a conversation.
   * @param {string} token - Authentication token
   * @param {string} conversationId - ID of the conversation
   * @param {MessageParams} params - Message parameters including text content
   * @returns {Promise<ConversationEntry>} Promise containing the created conversation entry
   * @throws {Error} if message text is empty
   */
  async sendMessage(
    token: string,
    conversationId: string,
    params: MessageParams
  ): Promise<ConversationEntry> {
    if (!params.text) {
      throw new Error('Message text is required');
    }

    const response = await makeRequest<Response>(
      `${this.baseUrl}/iamessage/api/v2/conversation/${conversationId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: {
          message: {
            id: params.id || randomUUID().toLowerCase(),
            messageType: 'StaticContentMessage',
            staticContent: {
              formatType: 'Text',
              text: params.text,
            },
          },
          esDeveloperName: this.developerName,
          isNewMessagingSession: params.isNewSession,
          ...(params.routingAttributes ? { routingAttributes: params.routingAttributes } : {}),
          ...(params.language ? { language: params.language } : {}),
        },
      },
      'conversations.send_message',
      this.logger
    );

    const responseData = (await response.json()) as MessageResponse;
    const entry = responseData.conversationEntries[0];

    return {
      id: entry.id,
      type: 'Message',
      text: params.text,
      timestamp: new Date(entry.clientTimestamp).toISOString(),
      sender: {
        id: 'user',
        type: 'endUser',
      },
    };
  }

  /**
   * Sends a typing indicator for a conversation.
   * @param {string} token - Authentication token
   * @param {string} conversationId - ID of the conversation
   * @param {boolean} isTyping - Whether the user is currently typing
   * @returns {Promise<{ success: boolean }>} Promise indicating success
   */
  async sendTypingIndicator(
    token: string,
    conversationId: string,
    isTyping: boolean
  ): Promise<{ success: boolean }> {
    await makeRequest(
      `${this.baseUrl}/iamessage/api/v2/conversation/${conversationId}/entry`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: {
          entryType: isTyping ? 'TypingStartedIndicator' : 'TypingStoppedIndicator',
          id: randomUUID().toLowerCase(),
        },
      },
      'conversations.typing_indicator',
      this.logger
    );

    return { success: true };
  }

  /**
   * Sends delivery/read receipts for conversation entries.
   * @param {string} token - Authentication token
   * @param {string} conversationId - ID of the conversation
   * @param {ReceiptParams} params - Receipt parameters
   * @returns {Promise<{ success: boolean }>} Promise indicating success
   */
  async sendReceipts(
    token: string,
    conversationId: string,
    params: ReceiptParams
  ): Promise<{ success: boolean }> {
    await makeRequest(
      `${this.baseUrl}/iamessage/api/v2/conversation/${conversationId}/acknowledge-entries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: {
          acks: params.entries.map(entry => ({
            id: entry.id || randomUUID().toLowerCase(),
            entryType: entry.type || 'Delivery',
            conversationEntryId: entry.conversationEntryId,
          })),
        },
      },
      'conversations.sending_receipts',
      this.logger
    );

    return { success: true };
  }

  /**
   * Lists entries in a conversation with optional filtering.
   * @param {string} token - Authentication token
   * @param {string} conversationId - ID of the conversation
   * @param {ConversationEntryListParams} params - Optional parameters for filtering and pagination
   * @returns {Promise<ConversationResponse>} Promise containing conversation entries
   */
  async list(
    token: string,
    conversationId: string,
    params: ConversationEntryListParams = {}
  ): Promise<ConversationResponse> {
    this.logger.debug(`Listing entries for conversation: ${conversationId}`);

    const queryParams = new URLSearchParams(
      Object.entries({
        limit: params.limit?.toString(),
        startTimestamp: params.startTimestamp,
        endTimestamp: params.endTimestamp,
        direction: params.direction,
        entryTypeFilter: params.entryTypeFilter?.join(','),
      } as Record<string, string | undefined>).filter(
        (entry): entry is [string, string] => entry[1] !== undefined
      )
    );

    const response = await makeRequest<Response>(
      `${this.baseUrl}/iamessage/api/v2/conversation/${conversationId}/entries?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
      'conversations.list_entries',
      this.logger
    );

    const responseData = (await response.json()) as ConversationEntryResponse;
    return this.transformListResponse(responseData);
  }

    /**
   * Transforms a raw conversation entry response into a standardized format
   * @param {ConversationEntryResponse} response - Raw response from the API
   * @returns {ConversationResponse} Transformed response
   */
    private transformListResponse(response: ConversationEntryResponse): ConversationResponse {
      return {
        id: response.conversationEntries[0]?.identifier || '',
        entries: response.conversationEntries.map(entry => ({
          id: entry.identifier,
          type: entry.entryType,
          text: entry.entryPayload,
          timestamp: new Date(entry.clientTimestamp).toISOString(),
          sender: {
            id: entry.sender.subject,
            type: entry.sender.role
          }
        }))
      };
    }
}
