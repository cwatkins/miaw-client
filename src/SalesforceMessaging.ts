import { TokenService } from './services/TokenService.js';
import { ConversationEntry, ConversationService, ConversationStatus, MessageParams, ReceiptParams } from './services/ConversationService.js';
import { EventService, SSEOptions } from './services/EventService.js';
import { EventSourceClient } from 'eventsource-client';
import { ConversationEntryResponse } from './types/api.js';

/**
 * Logger interface
 */
export interface Logger {
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Salesforce Messaging configuration
 */
interface SalesforceMessagingConfig {
  baseUrl: string;
  orgId: string;
  developerName: string;
  logger?: Logger;
}

const REQUIRED_CONFIG = ['baseUrl', 'orgId', 'developerName'];

/**
 * Salesforce Messaging Client
 * A Stripe-inspired API wrapper for Salesforce's Messaging for In-App and Web APIs.
 */
export class SalesforceMessaging {
  private config: SalesforceMessagingConfig;
  private logger: Logger;
  private tokenService: TokenService;
  private conversationService: ConversationService;
  private eventService: EventService;

  /**
   * Create a new Salesforce Messaging client
   * @param {SalesforceMessagingConfig} config config - Configuration parameters from an Embedded Services Deployment Custom Client.
   */
  constructor(config: SalesforceMessagingConfig) {
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
    this.logger.info(`Salesforce Messaging client initialized.`);

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
   * Token-related operations
   */
  get tokens(): TokenService {
    return this.tokenService;
  }

  /**
   * Event-related operations
   */
  get events(): {
    stream: (token: string, options: SSEOptions) => EventSourceClient;
  } {
    return {
      stream: (token: string, options: SSEOptions) => this.eventService.createEventSourceStream(token, options)
    };
  }
  
  /**
   * Conversation-related operations
   */
  get conversations(): {
    create: (token: string, params?: Record<string, unknown>) => Promise<{id: string}>;
    close: (token: string, conversationId: string) => Promise<{success: boolean}>;
    endSession: (token: string, conversationId: string) => Promise<{success: boolean}>;
    status: (token: string, conversationId: string) => Promise<ConversationStatus>;
    messages: {
      send: (token: string, conversationId: string, params: MessageParams) => Promise<ConversationEntry>;
    };
    typing: {
      create: (token: string, conversationId: string) => Promise<{success: boolean}>;
      delete: (token: string, conversationId: string) => Promise<{success: boolean}>;
    };
    receipts: {
      create: (token: string, conversationId: string, params: ReceiptParams) => Promise<{success: boolean}>;
    };
    list: (
      token: string,
      conversationId: string,
      params?: Record<string, unknown>
    ) => Promise<ConversationEntryResponse>;
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
        create: (token: string, conversationId: string) =>
          this.conversationService.sendTypingIndicator(token, conversationId, true),
        delete: (token: string, conversationId: string) =>
          this.conversationService.sendTypingIndicator(token, conversationId, false),
      },
      receipts: {
        create: (token: string, conversationId: string, params: ReceiptParams) =>
          this.conversationService.sendReceipts(token, conversationId, params),
      },
      list: (token: string, conversationId: string, params = {}) =>
        this.conversationService.list(token, conversationId, params),
    };
  }
}

export default SalesforceMessaging;
