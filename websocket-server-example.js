/**
 * Simple WebSocket Server Example with Token Authentication
 * 
 * This is a basic Node.js WebSocket server that handles token authentication
 * and can be used to test the WebSocket connection from your React application.
 * 
 * To use this server:
 * 1. Create a new directory for your server (e.g., 'websocket-server')
 * 2. Run: npm init -y
 * 3. Run: npm install ws url
 * 4. Copy this code to a file named 'server.js'
 * 5. Run: node server.js
 * 
 * The server will listen on ws://localhost:3001
 * Clients should connect with: ws://localhost:3001?token=your_token
 */

const WebSocket = require('ws');
const url = require('url');

const server = new WebSocket.Server({ 
  port: 3001,
  perMessageDeflate: false 
});

console.log('WebSocket server started on ws://localhost:3001');
console.log('Expecting connections with token: ws://localhost:3001?token=your_token');

server.on('connection', (ws, req) => {
  // Parse the URL to extract query parameters
  const queryParams = url.parse(req.url, true).query;
  const token = queryParams.token;
  
  console.log('New client connected from:', req.connection.remoteAddress);
  console.log('Token provided:', token ? 'Yes' : 'No');
  
  if (token) {
    console.log('Client authenticated with token:', token);
  } else {
    console.log('Client connected without token (anonymous)');
  }
  
  // Send welcome message to the client
  const welcomeMessage = {
    type: 'message',
    content: token 
      ? `Welcome! You are authenticated with token: ${token.substring(0, 10)}...` 
      : 'Welcome! You are connected as anonymous user.',
    timestamp: new Date().toISOString(),
    id: Date.now().toString()
  };
  
  ws.send(JSON.stringify(welcomeMessage));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);
      
      switch(message.type) {
        case 'chat':
          handleChatMessage(ws, message);
          break;
          
        case 'human-escalation':
          handleHumanEscalation(ws, message);
          break;
          
        case 'ping':
          handlePing(ws, message);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
      
    } catch (error) {
      console.error('Error parsing message:', error);
      
      // Send error response
      const errorResponse = {
        type: 'error',
        message: 'Invalid message format. Please send valid JSON.',
        timestamp: new Date().toISOString()
      };
      
      ws.send(JSON.stringify(errorResponse));
    }
  });

  // Handle client disconnect
  ws.on('close', (code, reason) => {
    console.log('Client disconnected:', code, reason);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send periodic heartbeat (optional)
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Every 30 seconds
});

// Message handlers
function handleChatMessage(ws, message) {
  console.log('Processing chat message:', message.content);
  
  const messageId = `msg_${Date.now()}`;
  
  // Send stream start
  ws.send(JSON.stringify({
    type: 'stream-start',
    messageId: messageId,
    timestamp: new Date().toISOString()
  }));
  
  // Simulate streaming response
  const response = `You said: "${message.content}". This is a streaming response from the WebSocket server.`;
  const words = response.split(' ');
  
  let wordIndex = 0;
  const streamInterval = setInterval(() => {
    if (wordIndex < words.length) {
      // Send stream token
      ws.send(JSON.stringify({
        type: 'stream-token',
        messageId: messageId,
        token: words[wordIndex] + ' ',
        timestamp: new Date().toISOString()
      }));
      wordIndex++;
    } else {
      // Send stream end
      ws.send(JSON.stringify({
        type: 'stream-end',
        messageId: messageId,
        timestamp: new Date().toISOString()
      }));
      clearInterval(streamInterval);
    }
  }, 100); // Stream one word every 100ms
}

function handleHumanEscalation(ws, message) {
  console.log('Human escalation requested:', message.reason);
  
  // Send escalation response
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'human-escalation-response',
      message: 'Your request for human assistance has been received. A human agent will contact you soon.',
      timestamp: new Date().toISOString()
    }));
  }, 500);
}

function handlePing(ws, message) {
  // Respond with pong
  ws.send(JSON.stringify({
    type: 'pong',
    timestamp: new Date().toISOString()
  }));
}

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  server.close(() => {
    console.log('WebSocket server closed.');
    process.exit(0);
  });
});