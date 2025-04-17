/// <reference types="jest" />
import { jest } from '@jest/globals';
import type { Logger } from '../../types.js';
import type { MockResponse, MockFetch } from './types.js';

const mockUUID = 'mock-uuid';
jest.unstable_mockModule('crypto', () => ({
  randomUUID: () => mockUUID,
}));

const { ConversationService } = await import('../ConversationService.js');

describe('ConversationService', () => {
  let service: InstanceType<typeof ConversationService>;
  let mockFetch: MockFetch;
  let mockLogger: Logger;

  beforeEach(() => {
    mockFetch = jest.fn() as unknown as MockFetch;
    global.fetch = mockFetch as unknown as typeof fetch;

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
      const mockResponse: MockResponse<{ conversationId: string }> = {
        ok: true,
        json: () => Promise.resolve({ conversationId: 'mock-uuid' }),
        text: () => Promise.resolve(JSON.stringify({ conversationId: 'mock-uuid' })),
        headers: new Headers(),
        statusText: 'OK',
        type: 'default',
        url: 'https://test.com/iamessage/api/v2/conversation',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

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
      const mockResponse: MockResponse<{ message: string }> = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' }),
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad Request' })),
        headers: new Headers(),
        statusText: 'Bad Request',
        type: 'default',
        url: 'https://test.com/iamessage/api/v2/conversation',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(service.create('test-token')).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockResponse: MockResponse<{
        conversationEntries: Array<{
          id: string;
          clientTimestamp: string;
          sender: {
            subject: string;
            role: string;
          };
        }>;
      }> = {
        ok: true,
        json: () =>
          Promise.resolve({
            conversationEntries: [
              {
                id: 'mock-uuid',
                clientTimestamp: '2024-01-01T00:00:00Z',
                sender: {
                  subject: 'test',
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
                  clientTimestamp: '2024-01-01T00:00:00Z',
                  sender: {
                    subject: 'test',
                    role: 'user',
                  },
                },
              ],
            })
          ),
        headers: new Headers(),
        statusText: 'OK',
        type: 'default',
        url: 'https://test.com/iamessage/api/v2/conversation/mock-uuid/entries',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

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
      const mockResponse: MockResponse<{ success: boolean }> = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve(JSON.stringify({ success: true })),
        headers: new Headers(),
        statusText: 'OK',
        type: 'default',
        url: 'https://test.com/iamessage/api/v2/conversation/mock-uuid/entries',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

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
