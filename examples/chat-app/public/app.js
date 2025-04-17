// Chat UI state
let conversationId = null;
let eventSource = null;
let typingIndicatorElement = null;
let isChatActive = false;

// DOM Elements
const statusElement = document.getElementById('status');
const messagesElement = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const closeButton = document.getElementById('closeButton');

// Update UI based on chat state
function updateUIState() {
    if (isChatActive) {
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.classList.remove('disabled');
        closeButton.textContent = 'End Chat';
        closeButton.style.display = 'block';
        closeButton.disabled = false;
        closeButton.classList.remove('disabled');
        closeButton.classList.remove('start-chat');
        const statusText = statusElement.querySelector('.status-text');
        statusText.textContent = 'Connected';
        statusElement.style.backgroundColor = '#d4edda';
    } else {
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.classList.add('disabled');
        closeButton.textContent = 'Start Chat';
        closeButton.style.display = 'block';
        closeButton.disabled = false;
        closeButton.classList.remove('disabled');
        closeButton.classList.add('start-chat');
        const statusText = statusElement.querySelector('.status-text');
        statusText.textContent = 'Not Connected';
        statusElement.style.backgroundColor = '#f8f9fa';
    }
}

// Initialize chat session
async function initChat() {
    try {
        // Disable the start button while connecting
        closeButton.disabled = true;
        const statusText = statusElement.querySelector('.status-text');
        statusText.textContent = 'Connecting...';
        statusElement.style.backgroundColor = '#e9ecef';
        
        // Clear existing messages
        messagesElement.innerHTML = '';
        
        const response = await fetch('/api/chat/init', { method: 'POST' });
        const data = await response.json();
        conversationId = data.conversationId;
        isChatActive = true;
        updateUIState();
        connectToEventStream();
    } catch (error) {
        console.error('Failed to initialize chat:', error);
        handleChatError('Failed to connect');
    }
}

// Connect to SSE event stream
function connectToEventStream() {
    if (!conversationId) return;
    
    eventSource = new EventSource(`/api/chat/events/${conversationId}`);
    
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleEvent(data);
    };
    
    eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        handleChatError('Connection lost');
    };
}

// Handle chat errors
function handleChatError(message) {
    isChatActive = false;
    updateUIState();
    
    // Close the current connection
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    
    // Clear conversation ID
    conversationId = null;
    
    // Update status
    const statusText = statusElement.querySelector('.status-text');
    statusText.textContent = message;
    statusElement.style.backgroundColor = '#f8d7da';
}

// Handle different event types
function handleEvent(event) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;  
    switch (event.event) {
        case 'CONVERSATION_MESSAGE':
            handleMessage(data);
            break;
        case 'CONVERSATION_ROUTING_RESULT':
            handleRoutingResult(data);
            break;
        case 'CONVERSATION_ROUTING_WORK_RESULT':
            handleRoutingResult(data);
            break;
        case 'CONVERSATION_PARTICIPANT_CHANGED':
            handleParticipantChange(data);
            break;
        case 'CONVERSATION_TYPING_STARTED_INDICATOR':
            handleTypingStarted(data);
            break;
        case 'CONVERSATION_TYPING_STOPPED_INDICATOR':
            handleTypingStopped(data);
            break;
        default:
            return;
    }
}

// Determine message type based on sender role
function getMessageType(senderRole, isInbound) {
    if (!isInbound) return 'sent';
    
    switch (senderRole.toLowerCase()) {
        case 'agent':
            return 'received';
        case 'bot':
            return 'received bot';
        default:
            return 'sent';
    }
}

// Handle incoming messages
function handleMessage(data) {
    const entry = data.conversationEntry;
    
    // Remove typing indicator if it exists when a new message arrives
    if (typingIndicatorElement) {
        typingIndicatorElement.remove();
        typingIndicatorElement = null;
    }
    
    const payload = typeof entry.entryPayload === 'string' 
        ? JSON.parse(entry.entryPayload)
        : entry.entryPayload;
    
    const text = payload.abstractMessage.staticContent.text;

    const messageType = entry.sender.role.toLowerCase() === 'enduser' ? 'sent' : 'received';    
    appendMessage(text, messageType);
}

// Handle typing started indicator
function handleTypingStarted(event) {
    const entry = event.conversationEntry;
    if (entry.sender.role.toLowerCase() === 'chatbot') {
        // Remove any existing typing indicator
        if (typingIndicatorElement) {
            typingIndicatorElement.remove();
            typingIndicatorElement = null;
        }
        // Create new typing indicator
        typingIndicatorElement = document.createElement('div');
        typingIndicatorElement.className = 'message system';
        typingIndicatorElement.textContent = 'Agent is typing...';
        messagesElement.appendChild(typingIndicatorElement);
        messagesElement.scrollTop = messagesElement.scrollHeight;
    }
}

// Handle typing stopped indicator
function handleTypingStopped(event) {
    const entry = event.conversationEntry;
    if (entry.sender.role.toLowerCase() === 'chatbot' && typingIndicatorElement) {
        typingIndicatorElement.remove();
        typingIndicatorElement = null;
    }
}

// Append a message to the chat UI
function appendMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messagesElement.appendChild(messageDiv);
    messagesElement.scrollTop = messagesElement.scrollHeight;
}

// Send a message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !conversationId) return;
    
    try {
        await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId,
                text
            })
        });
        
        // Clear input
        messageInput.value = '';
    } catch (error) {
        console.error('Failed to send message:', error);
        handleChatError('Failed to send message');
    }
}

// Handle routing result
function handleRoutingResult(data) {
    const payload = data.conversationEntry.entryPayload;

    // Check for routing errors
    if (payload.errorMessages && payload.errorMessages.length > 0) {
        appendMessage('Unable to connect to an agent: ' + payload.errorMessages.join(', '), 'system');
        return;
    }

    // Handle different routing states
    if (payload.routingType === 'Initial') {
        if (payload.failureType === 'None') {
            const waitTime = payload.estimatedWaitTime.estimatedWaitTimeInSeconds;
            let waitMessage = 'Connecting you to an agent...';
            
            if (waitTime > 0) {
                const minutes = Math.ceil(waitTime / 60);
                waitMessage += ` Estimated wait time: ${minutes} minute${minutes > 1 ? 's' : ''}.`;
            }
            
            appendMessage(waitMessage, 'system');
        } else {
            appendMessage('Unable to connect to an agent at this time.', 'system');
        }
    }
}

// Handle participant changes (including agent joins)
function handleParticipantChange(data) {
    const entry = data.conversationEntry;
    const payload = typeof entry.entryPayload === 'string' 
        ? JSON.parse(entry.entryPayload)
        : entry.entryPayload;
    
    if (payload.entries) {
        payload.entries.forEach(entry => {
            if (entry.operation === 'add' && entry.participant.role.toLowerCase() === 'chatbot') {
                const agentName = entry.participant.displayName || 'An agent';
                appendMessage(`${agentName} has joined the chat`, 'agent-join');
            }
            if (entry.operation === 'remove' && entry.participant.role.toLowerCase() === 'chatbot') {
                const agentName = entry.participant.displayName || 'An agent';
                appendMessage(`${agentName} has left the chat`, 'system');
            }
        });
    }
}

// Close conversation
async function closeChat() {
    if (!isChatActive) {
        // Start new chat if not active
        await initChat();
        return;
    }

    if (!conversationId) return;
    
    try {
        await fetch('/api/chat/close', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversationId })
        });
        
        // Disable chat input and button
        messageInput.disabled = true;
        sendButton.disabled = true;
        
        isChatActive = false;
        updateUIState();
        
        // Add a system message
        appendMessage('Chat session has been ended', 'system');
    } catch (error) {
        console.error('Failed to close chat:', error);
        handleChatError('Failed to end chat');
    }
}

// Initialize UI state
updateUIState();

// Event listeners
closeButton.addEventListener('click', closeChat);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize chat when page loads
initChat();
