# Messaging for In-App and Web Client

A TypeScript client library for Salesforce's [Messaging for In-App and Web](https://developer.salesforce.com/docs/service/messaging-api/overview) APIs.

This is a personal project and not an official Salesforce product. It is not officially supported by Salesforce.

## Features

- TypeScript support with full type definitions
- Token management for both authenticated and unauthenticated sessions
- Conversation management (create, close, end sessions)
- Real-time messaging with Server-Sent Events (SSE)
- Typing indicators
- Message receipts
- Logging support

## Installation

```bash
npm install @vibestack/miaw-client
```

## Quick Start

```typescript
import { MessagingInAppWebClient } from '@vibestack/miaw-client';

// Initialize the client
const client = new MessagingInAppWebClient({
  baseUrl: 'YOUR_BASE_URL',
  orgId: 'YOUR_ORG_ID',
  developerName: 'YOUR_DEVELOPER_NAME',
  // Optional: Custom logger
  logger: console,
});

// Create a token
const { accessToken } = await client.tokens.create();

// Create a conversation
const { id: conversationId } = await client.conversations.create(accessToken);

// Send a message
const messageEntry = await client.conversations.messages.send(accessToken, conversationId, {
  text: 'Hello, world!',
});

// Stream conversation events
const eventStream = client.events.stream(accessToken, {
  lastEventId: '0',
  onEvent: (event) => {
    console.log('Received event:', event);
  },
  onError: error => {
    console.error('Stream error:', error);
  },
});

// Later, when you need to clean up:
if (eventStream) {
  eventStream.close();
}
```

## API Reference

### Configuration

```typescript
interface MessagingInAppWebConfig {
  baseUrl: string; // Required: Custom Client instance URL
  orgId: string; // Required: Salesforce organization ID
  developerName: string; // Required: Custom Client developer name
  logger?: Logger; // Optional: Custom logger implementation
  appName?: string; // Application name (defaults to 'MessagingInAppWebClient')
}
```

### Token Service

#### `create(params?)`

Creates a new access token for interacting with the messaging API.

```typescript
interface TokenCreateParams {
  capabilitiesVersion?: string; // API capabilities version (defaults to '1')
  platform?: 'Web' | 'Mobile'; // Platform type (defaults to 'Web')
  deviceId?: string; // Unique device identifier
  context?: {
    appName: string; // Application name (defaults to 'MessagingInAppWebClient')
    clientVersion: string; // Client version (defaults to '1.0.0')
  };
  authorizationType?: string; // Required for authenticated sessions
  customerIdentityToken?: string; // Required for authenticated sessions
}

const { accessToken, lastEventId } = await client.tokens.create(params);
```

### Conversation Service

#### `create(token, params?)`

Creates a new conversation with optional routing attributes.

```typescript
const { id } = await client.conversations.create(token, params);
```

#### `close(token, conversationId)`

Closes an existing conversation.

```typescript
const { success } = await client.conversations.close(token, conversationId);
```

#### `endSession(token, conversationId)`

Ends the current messaging session for a conversation while keeping the conversation open.

```typescript
const { success } = await client.conversations.endSession(token, conversationId);
```

#### `status(token, conversationId)`

Retrieves the current status of a conversation.

```typescript
interface ConversationStatus {
  id: string;
  status: string;
  lastActivityTimestamp: string;
  isActive: boolean;
}

const status = await client.conversations.status(token, conversationId);
```

#### `messages.send(token, conversationId, params)`

Sends a text message to a conversation.

```typescript
interface MessageParams {
  text: string; // Required: Message content
  id?: string; // Optional: Custom message ID
  isNewSession?: boolean; // Optional: Start a new messaging session
  routingAttributes?: Record<string, unknown>; // Optional: Custom routing parameters
  language?: string; // Optional: Message language code
}

interface ConversationEntry {
  id: string;
  type: string;
  text?: string;
  timestamp: string;
  sender: {
    id: string;
    type: string;
  };
}

const entry = await client.conversations.messages.send(token, conversationId, params);
```

#### `typing.start(token, conversationId)` and `typing.stop(token, conversationId)`

Manages typing indicators in a conversation.

```typescript
// Start typing
const { success } = await client.conversations.typing.start(token, conversationId);
// Stop typing
const { success } = await client.conversations.typing.stop(token, conversationId);
```

#### `receipts.send(token, conversationId, params)`

Sends delivery or read receipts for messages.

```typescript
interface ReceiptParams {
  entries: Array<{
    id?: string; // Optional: Custom receipt ID
    type?: 'Delivery' | 'Read'; // Receipt type (defaults to 'Delivery')
    conversationEntryId: string; // ID of the message being acknowledged
  }>;
}

const { success } = await client.conversations.receipts.send(token, conversationId, params);
```

#### `list(token, conversationId, params?)`

Lists conversation entries with optional filtering parameters.

```typescript
interface ConversationEntryListParams {
  limit?: number;
  startTimestamp?: string;
  endTimestamp?: string;
  direction?: 'FromEnd' | 'FromStart';
  entryTypeFilter?: string[];
}

const response = await client.conversations.list(token, conversationId, params);
```

### Event Service

#### `stream(token, options?)`

Establishes a Server-Sent Events (SSE) connection for real-time conversation updates.

```typescript
interface SSEOptions {
  onEvent: (event: EventSourceMessage) => void; // Callback for handling incoming events
  lastEventId?: string; // Optional: Resume from a specific event ID
  onOpen?: () => void; // Optional: Callback for when the connection opens
  onError?: (error: Event) => void; // Optional: Callback for handling errors
  onClose?: () => void; // Optional: Callback for when the connection closes
}

const stream = await client.events.stream(token, {
  lastEventId: '0',
  onEvent: (event) => {
    console.log('Received event:', event);
  },
  onError: error => {
    console.error('Stream error:', error);
  },
});
```

## Forwarding server-sent events

You can integrate the Messaging client with frameworks like Fastify to stream conversation events. Below is an example of how to set up a Fastify route for streaming events.

```typescript
import fastify from 'fastify';
import { MessagingInAppWebClient } from '@vibestack/miaw-client';

const app = fastify();
const client = new MessagingInAppWebClient({
  baseUrl: 'YOUR_BASE_URL',
  orgId: 'YOUR_ORG_ID',
  developerName: 'YOUR_DEVELOPER_NAME',
  logger: console,
});

// Fastify route for streaming conversation events
app.get('/stream/:token', async (request, reply) => {
  const { token } = request.params;

  // Set headers for SSE
  reply.header('Content-Type', 'text/event-stream');
  reply.header('Cache-Control', 'no-cache');
  reply.header('Connection', 'keep-alive');

  // Stream conversation events
  const stream = await client.events.stream(token, {
    onEvent: (ev) => {
      reply.raw.write(
        `event: ${ev.event}\n` + 
        `data: ${JSON.stringify(ev.data)}\n\n`
      );
    },
    onError: (error) => {
      console.error('Stream error:', error);
    },
    onOpen: () => {
      console.log('Stream opened');
    },
    onClose: () => {
      console.log('Stream closed');
      reply.raw.end();
    },
  });

  // Clean up when the connection is closed
  request.raw.on('close', () => {
    stream.close();
  });
});
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Watch mode for development
- `npm test` - Run tests (unit and integration)
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
