/// <reference types="jest" />
import { jest } from '@jest/globals';
import type { Logger } from '../../types.js';

const mockCreateEventSource = jest.fn();
jest.unstable_mockModule('eventsource-client', () => ({
  createEventSource: mockCreateEventSource,
}));

const { EventService } = await import('../EventService.js');

describe('EventService', () => {
  let service: InstanceType<typeof EventService>;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    service = new EventService('https://test.com', 'test-org', mockLogger);
  });

  describe('createEventSourceStream', () => {
    it('should create SSE connection successfully', () => {
      const mockEventSource = {
        close: jest.fn(),
      };
      mockCreateEventSource.mockReturnValue(mockEventSource);

      const options = {
        onEvent: jest.fn(),
        onOpen: jest.fn(),
        onError: jest.fn(),
        onClose: jest.fn(),
        lastEventId: 'test-event-id',
      };

      const result = service.createEventSourceStream('test-token', options);

      expect(mockCreateEventSource).toHaveBeenCalledWith({
        url: 'https://test.com/eventrouter/v1/sse',
        headers: {
          Accept: 'text/event-stream',
          Authorization: 'Bearer test-token',
          'X-Org-Id': 'test-org',
          'Last-Event-Id': 'test-event-id',
        },
        onConnect: expect.any(Function),
        onDisconnect: expect.any(Function),
        onMessage: options.onEvent,
      });
      expect(result).toBe(mockEventSource);
    });

    it('should throw error when token is missing', () => {
      const options = {
        onEvent: jest.fn(),
      };

      expect(() => service.createEventSourceStream('', options)).toThrow(
        'Authentication token is required'
      );
    });

    it('should handle connection events correctly', () => {
      const mockEventSource = {
        close: jest.fn(),
      };
      let savedConfig: any;
      mockCreateEventSource.mockImplementation(config => {
        savedConfig = config;
        return mockEventSource;
      });

      const options = {
        onEvent: jest.fn(),
        onOpen: jest.fn(),
      };

      service.createEventSourceStream('test-token', options);

      savedConfig.onConnect();
      expect(options.onOpen).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('EventSource connection opened');

      savedConfig.onDisconnect();
      expect(mockEventSource.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('SSE disconnected. Preventing auto reconnect.');
    });
  });
}); 