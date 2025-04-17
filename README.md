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

This project uses [pnpm](https://pnpm.io/) as its package manager. You can install it using:

```bash
# Using npm
npm install -g pnpm

# Using Homebrew
brew install pnpm
```

Then install the package:

```bash
pnpm add miaw-client
```

Or using npm:

```bash
npm install miaw-client
```

## Quick Start

```typescript
import { MessagingInAppWebClient } from 'miaw-client';

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
