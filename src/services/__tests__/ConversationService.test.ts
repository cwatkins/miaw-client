/// <reference types="jest" />
import { ConversationService } from '../ConversationService.js';
import type { Logger } from '../../MessagingInAppWeb.js';

jest.mock('crypto', () => ({
  randomUUID: (): string => 'mock-uuid',
}));

describe('ConversationService', () => {
  let service: ConversationService;
  let mockFetch: jest.Mock;
  let mockLogger: Logger;

  beforeEach((): void => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    service = new ConversationService('https://test.com', 'test-dev', mockLogger, 'test-org');
  });

  describe('create', () => {
    it('should create a conversation successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ conversationId: 'mock-uuid' }),
        text: () => Promise.resolve(JSON.stringify({ conversationId: 'mock-uuid' })),
      });

      const result = await service.create('test-token');

      expect(result).toEqual({ id: 'mock-uuid' });
      expect(mockFetch).toHaveBeenCalledWith('https://test.com/iamessage/api/v2/conversation', expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: 'mock-uuid',
          esDeveloperName: 'test-dev',
        }),
      }));
    });

    it('should throw error when creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' }),
      });

      await expect(service.create('test-token')).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            conversationEntries: [
              {
                id: 'mock-uuid',
                clientTimestamp: new Date().toISOString(),
                sender: {
                  subject: 'user-id',
                  role: 'user',
                },
              },
            ],
          }),
        text: () =>
          Promise.resolve(
            JSON.stringify({
              conversationEntries: [
                {
                  id: 'mock-uuid',
                  clientTimestamp: new Date().toISOString(),
                  sender: {
                    subject: 'user-id',
                    role: 'user',
                  },
                },
              ],
            })
          ),
      });

      await service.sendMessage('test-token', 'conv-id', {
        text: 'Hello world',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/conversation/conv-id/message',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            message: {
              id: 'mock-uuid',
              messageType: 'StaticContentMessage',
              staticContent: {
                formatType: 'Text',
                text: 'Hello world',
              },
            },
            esDeveloperName: 'test-dev',
          }),
        })
      );
    });

    it('should throw error when message text is empty', async () => {
      await expect(service.sendMessage('test-token', 'conv-id', { text: '' })).rejects.toThrow(
        'Message text is required'
      );
    });
  });

  describe('close', () => {
    it('should close a conversation successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await service.close('test-token', 'conv-id');

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/conversation/conv-id?esDeveloperName=test-dev',
        expect.objectContaining({
          method: 'DELETE',
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });
  });
});
