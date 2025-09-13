// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  // Default WebSocket server URL (token will be appended automatically)
  SERVER_URL: process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001',
  
  // Reconnection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000, // milliseconds
  
  // Connection timeout
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  
  // Authentication
  USE_TOKEN_AUTH: true, // Set to false to disable token authentication
};

// Message types that can be sent to the WebSocket server
export const MESSAGE_TYPES = {
  CHAT: 'chat',
  HUMAN_ESCALATION: 'human-escalation',
  PING: 'ping'
};

// Incoming message types from the WebSocket server
export const INCOMING_MESSAGE_TYPES = {
  CONNECTION: 'connection',
  STREAM_START: 'stream-start',
  STREAM_TOKEN: 'stream-token',
  STREAM_END: 'stream-end',
  HUMAN_ESCALATION_RESPONSE: 'human-escalation-response',
  ERROR: 'error',
  PONG: 'pong'
};

// WebSocket ready states
export const WS_READY_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};