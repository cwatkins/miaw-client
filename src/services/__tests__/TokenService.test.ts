/// <reference types="jest" />
import { jest } from '@jest/globals';
import { TokenService } from '../TokenService.js';
import type { Logger } from '../../types.js';
import type { MockResponse, MockFetch } from './types.js';

describe('TokenService', () => {
  let service: TokenService;
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

    service = new TokenService('https://test.com', 'test-org', 'test-dev', mockLogger);
  });

  describe('create', () => {
    it('should create an unauthenticated token successfully', async () => {
      const mockResponse: MockResponse<{ accessToken: string; lastEventId: string }> = {
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'mock-token',
          lastEventId: 'mock-event-id',
        }),
        text: () => Promise.resolve(JSON.stringify({
          accessToken: 'mock-token',
          lastEventId: 'mock-event-id',
        })),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        statusText: 'OK',
        type: 'default',
        url: 'https://test.com/iamessage/api/v2/authorization/unauthenticated/access-token',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await service.create({});

      expect(result).toEqual({
        accessToken: 'mock-token',
        lastEventId: 'mock-event-id',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/authorization/unauthenticated/access-token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: 'test-org',
            esDeveloperName: 'test-dev',
            capabilitiesVersion: '1',
            platform: 'Web',
            context: {
              appName: 'MessagingInAppWebClient',
              clientVersion: '1.0.0',
            },
          }),
        })
      );
    });

    it('should create an authenticated token successfully', async () => {
      const mockResponse: MockResponse<{ accessToken: string; lastEventId: string }> = {
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'mock-token',
          lastEventId: 'mock-event-id',
        }),
        text: () => Promise.resolve(JSON.stringify({
          accessToken: 'mock-token',
          lastEventId: 'mock-event-id',
        })),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        statusText: 'OK',
        type: 'default',
        url: 'https://test.com/iamessage/api/v2/authorization/authenticated/access-token',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await service.create({
        authorizationType: 'Bearer',
        customerIdentityToken: 'customer-token',
      });

      expect(result).toEqual({
        accessToken: 'mock-token',
        lastEventId: 'mock-event-id',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/authorization/authenticated/access-token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: 'test-org',
            esDeveloperName: 'test-dev',
            capabilitiesVersion: '1',
            platform: 'Web',
            context: {
              appName: 'MessagingInAppWebClient',
              clientVersion: '1.0.0',
            },
            authorizationType: 'Bearer',
            customerIdentityToken: 'customer-token',
          }),
        })
      );
    });

    it('should throw error when token creation fails', async () => {
      const mockResponse: MockResponse<{ message: string }> = {
        ok: false,
        json: () => Promise.reject(new Error('Bad Request')),
        text: () => Promise.reject(new Error('Bad Request')),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        statusText: 'Bad Request',
        type: 'error',
        url: 'https://test.com/iamessage/api/v2/authorization/unauthenticated/access-token',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.reject(new Error('Bad Request')),
        blob: () => Promise.reject(new Error('Bad Request')),
        formData: () => Promise.reject(new Error('Bad Request')),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(service.create({})).rejects.toThrow();
    });
  });

  describe('continue', () => {
    it('should refresh token successfully', async () => {
      const mockResponse: MockResponse<{ accessToken: string; lastEventId: string }> = {
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'new-mock-token',
          lastEventId: 'new-mock-event-id',
        }),
        text: () => Promise.resolve(JSON.stringify({
          accessToken: 'new-mock-token',
          lastEventId: 'new-mock-event-id',
        })),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        statusText: 'OK',
        type: 'default',
        url: 'https://test.com/iamessage/api/v2/authorization/continuation-access-token',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await service.continue('old-token');

      expect(result).toEqual({
        accessToken: 'new-mock-token',
        lastEventId: 'new-mock-event-id',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/authorization/continuation-access-token',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer old-token' },
        })
      );
    });

    it('should throw error when token refresh fails', async () => {
      const mockResponse: MockResponse<{ message: string }> = {
        ok: false,
        json: () => Promise.reject(new Error('Unauthorized')),
        text: () => Promise.reject(new Error('Unauthorized')),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        statusText: 'Unauthorized',
        type: 'error',
        url: 'https://test.com/iamessage/api/v2/authorization/continuation-access-token',
        redirected: false,
        clone: () => mockResponse as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.reject(new Error('Unauthorized')),
        blob: () => Promise.reject(new Error('Unauthorized')),
        formData: () => Promise.reject(new Error('Unauthorized')),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(service.continue('old-token')).rejects.toThrow();
    });
  });
});
