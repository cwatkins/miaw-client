import { TokenService } from './services/TokenService.js';
import { ConversationEntry, ConversationResponse, ConversationService, ConversationStatus, MessageParams, ReceiptParams } from './services/ConversationService.js';
import { EventService, SSEOptions } from './services/EventService.js';
import { EventSourceClient } from 'eventsource-client';

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
 * Messaging In-App and Web configuration
 */
interface MessagingInAppWebConfig {
  baseUrl: string;
  orgId: string;
  developerName: string;
  logger?: Logger;
}

const REQUIRED_CONFIG = ['baseUrl', 'orgId', 'developerName'];

/**
 * Messaging In-App and Web Client
 * An API wrapper for Messaging for In-App and Web APIs.
 */
export class MessagingInAppWebClient {
  private config: MessagingInAppWebConfig;
  private logger: Logger;
  private tokenService: TokenService;
  private conversationService: ConversationService;
  private eventService: EventService;

  /**
   * Create a new Messaging In-App and Web client
   * @param {MessagingInAppWebConfig} config config - Configuration parameters from an Embedded Services Deployment Custom Client.
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

  /** Access token and session management */
  get tokens(): TokenService {
    return this.tokenService;
  }

  /** Real-time event streaming */
  get events(): {
    stream: (token: string, options: SSEOptions) => EventSourceClient;
  } {
    return {
      stream: (token: string, options: SSEOptions) => this.eventService.createEventSourceStream(token, options)
    };
  }
  
  /** Conversation and message management */
  get conversations(): {
    create: (token: string, params?: Record<string, unknown>) => Promise<{id: string}>;
    close: (token: string, conversationId: string) => Promise<{success: boolean}>;
    endSession: (token: string, conversationId: string) => Promise<{success: boolean}>;
    status: (token: string, conversationId: string) => Promise<ConversationStatus>;
    messages: {
      send: (token: string, conversationId: string, params: MessageParams) => Promise<ConversationEntry>;
    };
    typing: {
      start: (token: string, conversationId: string) => Promise<{success: boolean}>;
      stop: (token: string, conversationId: string) => Promise<{success: boolean}>;
    };
    receipts: {
      send: (token: string, conversationId: string, params: ReceiptParams) => Promise<{success: boolean}>;
    };
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
