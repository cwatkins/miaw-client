/// <reference types="jest" />
import { TokenService } from '../TokenService.js';
import type { Logger } from '../../SalesforceMessaging.js';

describe('TokenService', () => {
  let service: TokenService;
  let mockFetch: jest.Mock;
  let mockLogger: Logger;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;

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
      const mockResponse = {
        accessToken: 'mock-token',
        lastEventId: 'mock-event-id',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.create({});

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/authorization/unauthenticated/access-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: 'test-org',
            esDeveloperName: 'test-dev',
            capabilitiesVersion: '1',
            platform: 'Web',
            context: {
              appName: 'SalesforceMessagingClient',
              clientVersion: '1.0.0',
            },
          }),
        }
      );
    });

    it('should create an authenticated token successfully', async () => {
      const mockResponse = {
        accessToken: 'mock-token',
        lastEventId: 'mock-event-id',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.create({
        authorizationType: 'test-auth-type',
        customerIdentityToken: 'test-identity-token',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/authorization/authenticated/access-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: 'test-org',
            esDeveloperName: 'test-dev',
            capabilitiesVersion: '1',
            platform: 'Web',
            context: {
              appName: 'SalesforceMessagingClient',
              clientVersion: '1.0.0',
            },
            authorizationType: 'test-auth-type',
            customerIdentityToken: 'test-identity-token',
          }),
        }
      );
    });

    it('should throw error when token creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' }),
      });

      await expect(service.create({})).rejects.toThrow();
    });
  });

  describe('continue', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        accessToken: 'new-mock-token',
        lastEventId: 'new-mock-event-id',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.continue('test-token');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/iamessage/api/v2/authorization/continuation-access-token',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-token' },
        }
      );
    });

    it('should throw error when token refresh fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(service.continue('test-token')).rejects.toThrow();
    });
  });
});
