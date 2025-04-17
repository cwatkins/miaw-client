import fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { MessagingInAppWebClient } from 'miaw-client';
import dotenv from 'dotenv';
import fastifyStatic from '@fastify/static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = fastify({ logger: true });

// Initialize MIAW client
const client = new MessagingInAppWebClient({
  baseUrl: process.env.BASE_URL,
  orgId: process.env.ORG_ID,
  developerName: process.env.DEVELOPER_NAME,
  logger: console
});

// Store active conversations
const conversations = new Map();

// Helper function to get a conversation from the in-memory store
function getConversation(conversationId) {
  const conversation = conversations.get(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  return conversation;
}

// Register static file serving
app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  decorateReply: true
});

// Serve index.html
app.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Initialize chat session
app.post('/api/chat/init', async () => {
  const { accessToken } = await client.tokens.create();
  const { id: conversationId } = await client.conversations.create(accessToken);
  
  // Store the token and conversation ID
  conversations.set(conversationId, { accessToken });
  
  return { conversationId };
});

// Send message
app.post('/api/chat/send', async (request) => {
  const { conversationId, text } = request.body;
  const conversation = await getConversation(conversationId);

  const messageEntry = await client.conversations.messages.send(
    conversation.accessToken,
    conversationId,
    { text }
  );

  return messageEntry;
});

// Stream events (SSE endpoint)
app.get('/api/chat/events/:conversationId', async (request, reply) => {
  const { conversationId } = request.params;
  const conversation = await getConversation(conversationId);

  // Set headers for SSE
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Set up event stream
  const eventStream = client.events.stream(conversation.accessToken, {
    lastEventId: '0',
    onEvent: (event) => {
      try {
        // Send the raw event data
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (error) {
        console.error('Error processing event:', error);
      }
    },
    onError: (error) => {
      console.error('Stream error:', error);
      reply.raw.end();
    }
  });

  // Clean up on connection close
  request.raw.on('close', () => {
    if (eventStream) {
      eventStream.close();
    }
  });
});

// Close conversation
app.post('/api/chat/close', async (request) => {
  const { conversationId } = request.body;
  const conversation = await getConversation(conversationId);

  // Close the conversation
  await client.conversations.close(conversation.accessToken, conversationId);
  
  // Remove the conversation from our store
  conversations.delete(conversationId);
  
  return { success: true };
});

// Start the server
const start = async () => {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 