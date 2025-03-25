/// <reference types="jest" />
import { config } from 'dotenv';
import { MessagingInAppWebClient } from '../../MessagingInAppWeb.js';
import type { AccessTokenResponse, ConversationEntryResponse } from '../../types/api.js';
import { ConversationResponse } from '../../services/ConversationService.js';

config();

const REQUIRED_ENV_VARS = [
  'BASE_URL',
  'ORG_ID',
  'DEVELOPER_NAME',
] as const;

REQUIRED_ENV_VARS.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const TEST_TIMEOUT = 15000;

describe('MessagingInAppWebClient Integration', () => {
  let client: MessagingInAppWebClient;
  let accessToken: string;
  let conversationId: string;
  let lastMessageId: string;

  beforeAll(() => {
    client = new MessagingInAppWebClient({
      baseUrl: process.env.BASE_URL!,
      orgId: process.env.ORG_ID!,
      developerName: process.env.DEVELOPER_NAME!,
      logger: console,
    });
  });

  describe('Token Management', () => {
    it(
      'should create an unauthenticated token',
      async () => {
        const result = (await client.tokens.create({})) as AccessTokenResponse;
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('lastEventId');
        accessToken = result.accessToken;
      },
      TEST_TIMEOUT
    );

    it(
      'should refresh the token',
      async () => {
        const result = (await client.tokens.continue(accessToken)) as AccessTokenResponse;
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('lastEventId');
        expect(result.accessToken).not.toBe(accessToken);
        accessToken = result.accessToken;
      },
      TEST_TIMEOUT
    );
  });

  describe('Conversation Management', () => {
    it(
      'should create a new conversation',
      async () => {
        try {
          const result = (await client.conversations.create(accessToken)) as { id: string };
          expect(result).toHaveProperty('id');
          expect(typeof result.id).toBe('string');
          expect(result.id).not.toBe('');
          conversationId = result.id;
        } catch (error) {
          console.error('Failed to create conversation:', error);
          throw error;
        }
      },
      TEST_TIMEOUT
    );

    it(
      'should send a message to the conversation',
      async () => {
        expect(conversationId).toBeDefined();
        const testMessage = 'Hello, this is a test message!';

        const result = (await client.conversations.messages.send(accessToken, conversationId, {
          text: testMessage,
        })) as {
          id: string;
          type: string;
          text: string;
          timestamp: string;
          sender: {
            id: string;
            type: string;
          };
        };

        expect(result).toMatchObject({
          type: 'Message',
          text: testMessage,
          sender: {
            type: 'endUser',
          },
        });

        lastMessageId = result.id;
      },
      TEST_TIMEOUT
    );

    it(
      'should send typing indicator',
      async () => {
        expect(conversationId).toBeDefined();
        const result = (await client.conversations.typing.start(accessToken, conversationId)) as {
          success: boolean;
        };
        expect(result.success).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      'should stop typing indicator',
      async () => {
        expect(conversationId).toBeDefined();
        const result = (await client.conversations.typing.stop(accessToken, conversationId)) as {
          success: boolean;
        };
        expect(result.success).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      'should send message receipt',
      async () => {
        expect(conversationId).toBeDefined();
        expect(lastMessageId).toBeDefined();

        const result = (await client.conversations.receipts.send(accessToken, conversationId, {
          entries: [
            {
              conversationEntryId: lastMessageId,
              type: 'Delivery',
            },
          ],
        })) as { success: boolean };

        expect(result.success).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      'should list conversation entries',
      async () => {
        expect(conversationId).toBeDefined();

        const result = (await client.conversations.list(accessToken, conversationId, {
          limit: 10,
          direction: 'FromEnd',
        })) as ConversationResponse;

        expect(Array.isArray(result.entries)).toBe(true);
        expect(result.entries.length).toBeGreaterThan(0);

        const lastMessage = result.entries.find(entry => entry.id === lastMessageId);
        expect(lastMessage).toBeDefined();
        expect(lastMessage?.type).toBe('Message');
      },
      TEST_TIMEOUT
    );

    it(
      'should get conversation status',
      async () => {
        expect(conversationId).toBeDefined();

        const result = (await client.conversations.status(accessToken, conversationId)) as {
          id: string;
          status: string;
          lastActivityTimestamp: string;
          isActive: boolean;
        };

        expect(result).toMatchObject({
          id: conversationId,
          isActive: true,
        });
        expect(new Date(result.lastActivityTimestamp)).toBeInstanceOf(Date);
      },
      TEST_TIMEOUT
    );

    it(
      'should end conversation session',
      async () => {
        expect(conversationId).toBeDefined();

        const result = (await client.conversations.endSession(accessToken, conversationId)) as {
          success: boolean;
        };
        expect(result.success).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      'should close the conversation',
      async () => {
        expect(conversationId).toBeDefined();

        const result = (await client.conversations.close(accessToken, conversationId)) as {
          success: boolean;
        };
        expect(result.success).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('Event Streaming', () => {
    let eventSource: any;
    let receivedEvents: any[] = [];

    afterEach(async () => {
      if (eventSource) {
        eventSource.close();
        eventSource = undefined;
      }
    });

    it(
      'should establish SSE connection and receive events',
      async () => {
        expect(conversationId).toBeDefined();

        return new Promise<void>((resolve, reject) => {
          try {
            eventSource = client.events.stream(accessToken, {
              onEvent: event => {
                receivedEvents.push(event);
              },
              onOpen: () => {
                resolve();
              },
              onError: error => {
                reject(error);
              },
            });

            expect(eventSource).toBeDefined();
            expect(typeof eventSource.close).toBe('function');
          } catch (error) {
            reject(error);
          }
        });
      },
      TEST_TIMEOUT
    );
  });
});
