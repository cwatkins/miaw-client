import { createEventSource, EventSourceClient, EventSourceMessage } from 'eventsource-client';
import type { Logger } from '../SalesforceMessaging.js';

export interface SSEOptions {
  /** Optional last event ID to resume connection from a specific point */
  lastEventId?: string;
  onEvent: (event: EventSourceMessage) => void;
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

/**
 * Service class for managing Server-Sent Events (SSE) connections.
 * Handles creation and management of event streams for real-time updates.
 */
export class EventService {
  constructor(
    private baseUrl: string,
    private orgId: string,
    private logger: Logger
  ) {}

  /**
   * Creates a Server-Sent Events (SSE) connection using create-eventsource library.
   * Works in both browser and Node.js environments.
   *
   * @param {string} token - Authentication token
   * @param {SSEOptions} options - Connection options
   * @returns {EventSourceInstance} The created EventSource instance
   */
  createEventSourceStream(token: string, options: SSEOptions): EventSourceClient {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    this.logger.debug('Creating EventSource stream connection');

    const eventSource = createEventSource({
      url: `${this.baseUrl}/eventrouter/v1/sse`,
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        'X-Org-Id': this.orgId,
        ...(options.lastEventId ? { 'Last-Event-Id': options.lastEventId } : {}),
      },
      onConnect: () => {
        this.logger.info('EventSource connection opened');
        options.onOpen?.();
      },
      onDisconnect: () => {
        this.logger.info('SSE disconnected. Preventing auto reconnect.');
        eventSource.close();
      },
      onMessage: options.onEvent,
    });

    return eventSource;
  }
} 