import { TokenService } from './services/TokenService.js';
import { ConversationService } from './services/ConversationService.js';
import { EventService } from './services/EventService.js';
import { EventSourceClient } from 'eventsource-client';
import type {
  Logger,
  MessagingInAppWebConfig,
  SSEOptions,
  ConversationEntry,
  ConversationResponse,
  ConversationStatus,
  MessageParams,
  ReceiptParams
} from './types.js';

const REQUIRED_CONFIG = ['baseUrl', 'orgId', 'developerName'];

/**
 * Messaging In-App and Web Client
 * A comprehensive API wrapper for Messaging for In-App and Web APIs.
 * This client provides functionality for managing conversations, messages, and real-time events.
 */
export class MessagingInAppWebClient {
  private config: MessagingInAppWebConfig;
  private logger: Logger;
  private tokenService: TokenService;
  private conversationService: ConversationService;
  private eventService: EventService;

  /**
   * Creates a new Messaging In-App and Web client.
   * @param {MessagingInAppWebConfig} config - Configuration parameters from an Embedded Services Deployment Custom Client
   * @throws {Error} If configuration is missing or invalid
   */
  constructor(config: MessagingInAppWebConfig) {
    if (!config) {
      throw new Error('Missing client configuration.');
    }

    for (const param of REQUIRED_CONFIG) {
      if (!(param in config)) {
        throw new Error(`Missing configuration parameter: ${param}`);
      }
    }

    this.config = {
      baseUrl: config.baseUrl,
      orgId: config.orgId,
      developerName: config.developerName,
    };

    this.logger = config.logger || console;
    this.logger.info(`Messaging In-App and Web client initialized.`);

    this.tokenService = new TokenService(
      this.config.baseUrl,
      this.config.orgId,
      this.config.developerName,
      this.logger
    );
    this.conversationService = new ConversationService(
      this.config.baseUrl,
      this.config.developerName,
      this.logger,
      this.config.orgId
    );
    this.eventService = new EventService(
      this.config.baseUrl,
      this.config.orgId,
      this.logger
    );
  }

  /** 
   * Access token and session management service.
   * Provides functionality for managing authentication tokens and user sessions.
   * This service handles token generation, validation, and session lifecycle management.
   * @returns {TokenService} Service for managing authentication tokens and sessions
   */
  get tokens(): TokenService {
    return this.tokenService;
  }

  /** 
   * Real-time event streaming service.
   * Enables real-time communication through Server-Sent Events (SSE).
   * This service allows subscribing to various event types and handling them in real-time.
   * @returns {Object} Object containing methods for managing event streams
   */
  get events(): {
    /** 
     * Creates a new event source stream for real-time event handling. Events include messages, routing results, participant changes, and more.
     * You can see example payloads for all events in the [official Salesforce documentation](https://developer.salesforce.com/docs/service/messaging-api/references/about/server-sent-events-structure.html).
     * @param {string} token - Authentication token for the API
     * @param {SSEOptions} options - Configuration options for the event source stream
     * @returns {EventSourceClient} An event source client instance for handling real-time events
     */
    stream: (token: string, options: SSEOptions) => EventSourceClient;
  } {
    return {
      stream: (token: string, options: SSEOptions) => this.eventService.createEventSourceStream(token, options)
    };
  }
  
  /** 
   * Conversation and message management service.
   * Provides comprehensive functionality for managing conversations and messages.
   * This service handles conversation lifecycle (creation, closing, status), message sending,
   * typing indicators, message receipts, and conversation listing with filtering capabilities.
   * @returns {Object} Object containing methods for managing conversations, messages, and related functionality
   */
  get conversations(): {
    /** 
     * Creates a new conversation. This method can pass pre-chat data as routing attributes.
     * @param {string} token - Authentication token for the API
     * @param {Record<string, unknown>} [params] - Optional parameters for conversation creation
     * @returns {Promise<{id: string}>} A promise that resolves with the created conversation ID
     */
    create: (token: string, params?: Record<string, unknown>) => Promise<{id: string}>;
    
    /** 
     * Close an existing conversation between a user and agent. Messages cannot be sent after the conversation is closed.
     * @param {string} token - Authentication token for the API
     * @param {string} conversationId - ID of the conversation to close
     * @returns {Promise<{success: boolean}>} A promise that resolves with the success status
     */
    close: (token: string, conversationId: string) => Promise<{success: boolean}>;
    
    /** 
     * End the current session for a conversation. This methods lets the end users indicate that they have ended the conversation.
     * @param {string} token - Authentication token for the API
     * @param {string} conversationId - ID of the conversation to end session for
     * @returns {Promise<{success: boolean}>} A promise that resolves with the success status
     */
    endSession: (token: string, conversationId: string) => Promise<{success: boolean}>;
    
    /** 
     * Get the current status of a conversation. This method can be used to check the conversation's routing status.
     * @param {string} token - Authentication token for the API
     * @param {string} conversationId - ID of the conversation to get status for
     * @returns {Promise<ConversationStatus>} A promise that resolves with the conversation status
     */
    status: (token: string, conversationId: string) => Promise<ConversationStatus>;
    
    /** 
     * Message management namespace
     * Provides functionality for sending and managing messages within conversations.
     * This includes text messages, rich content, and message metadata management.
     */
    messages: {
      /** 
       * Send a message in an active conversation.
       * @param {string} token - Authentication token for the API
       * @param {string} conversationId - ID of the conversation to send message to
       * @param {MessageParams} params - Parameters for the message to send
       * @returns {Promise<ConversationEntry>} A promise that resolves with the sent message entry
       */
      send: (token: string, conversationId: string, params: MessageParams) => Promise<ConversationEntry>;
    };
    
    /** 
     * Typing indicator management namespace.
     * Handles real-time typing indicators to show when users are typing messages.
     * This provides better user experience by showing typing status in real-time.
     */
    typing: {
      /** 
       * Start typing indicator.
       * @param {string} token - Authentication token for the API
       * @param {string} conversationId - ID of the conversation to show typing indicator in
       * @returns {Promise<{success: boolean}>} A promise that resolves with the success status
       */
      start: (token: string, conversationId: string) => Promise<{success: boolean}>;
      
      /** 
       * Stop typing indicator.
       * @param {string} token - Authentication token for the API
       * @param {string} conversationId - ID of the conversation to stop typing indicator in
       * @returns {Promise<{success: boolean}>} A promise that resolves with the success status
       */
      stop: (token: string, conversationId: string) => Promise<{success: boolean}>;
    };
    
    /** 
     * Message receipt management namespace
     * Handles message delivery and read receipts to track message status.
     * This ensures reliable message delivery and read status tracking.
     */
    receipts: {
      /** 
       * Send message receipts.
       * @param {string} token - Authentication token for the API
       * @param {string} conversationId - ID of the conversation to send receipts for
       * @param {ReceiptParams} params - Parameters for the message receipts
       * @returns {Promise<{success: boolean}>} A promise that resolves with the success status
       */
      send: (token: string, conversationId: string, params: ReceiptParams) => Promise<{success: boolean}>;
    };
    
    /** 
     * List conversations with optional filtering.
     * @param {string} token - Authentication token for the API
     * @param {string} conversationId - ID of the conversation to list
     * @param {Record<string, unknown>} [params] - Optional parameters for filtering the list
     * @returns {Promise<ConversationResponse>} A promise that resolves with the conversation list response
     */
    list: (
      token: string,
      conversationId: string,
      params?: Record<string, unknown>
    ) => Promise<ConversationResponse>;
  } {
    return {
      create: (token: string, params = {}) => this.conversationService.create(token, params),
      close: (token: string, conversationId: string) =>
        this.conversationService.close(token, conversationId),
      endSession: (token: string, conversationId: string) =>
        this.conversationService.endSession(token, conversationId),
      status: (token: string, conversationId: string) =>
        this.conversationService.status(token, conversationId),
      messages: {
        send: (token: string, conversationId: string, params: MessageParams) =>
          this.conversationService.sendMessage(token, conversationId, params),
      },
      typing: {
        start: (token: string, conversationId: string) =>
          this.conversationService.sendTypingIndicator(token, conversationId, true),
        stop: (token: string, conversationId: string) =>
          this.conversationService.sendTypingIndicator(token, conversationId, false),
      },
      receipts: {
        send: (token: string, conversationId: string, params: ReceiptParams) =>
          this.conversationService.sendReceipts(token, conversationId, params),
      },
      list: (token: string, conversationId: string, params = {}) =>
        this.conversationService.list(token, conversationId, params),
    };
  }
}

export default MessagingInAppWebClient;
