class WebSocketService {
  constructor() {
    this.socket = null;
    this.baseUrl = 'ws://localhost:3001'; // Default WebSocket server URL
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 second
    this.listeners = new Map();
    this.pingInterval = null;
    this.pingIntervalTime = 30000; // 30 seconds
    this.streamingMessages = new Map(); // Track streaming messages
    this.connectionMessageShown = false; // Track if connection message was already emitted
  }

  getAuthenticatedUrl(baseUrl = this.baseUrl) {
    const token = localStorage.getItem('token');
    if (token) {
      return `${baseUrl}?token=${token}`;
    }
    return baseUrl;
  }

  connect(baseUrl = this.baseUrl) {
    // Prevent duplicate connections
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting, skipping duplicate connection');
      return true;
    }

    try {
      const authenticatedUrl = this.getAuthenticatedUrl(baseUrl);
      console.log('Connecting to WebSocket:', authenticatedUrl);
      this.socket = new WebSocket(authenticatedUrl);
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
      return false;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.onopen = (event) => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startPingInterval();
      this.emit('connected', event);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        this.handleIncomingMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.emit('error', { message: 'Error parsing message', originalError: error });
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.stopPingInterval();
      this.emit('disconnected', event);
      
      // Attempt to reconnect if not manually closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  handleIncomingMessage(message) {
    switch(message.type) {
      case 'connection':
        // Prevent duplicate connection messages at service level
        if (!this.connectionMessageShown) {
          this.connectionMessageShown = true;
          this.emit('system-message', {
            text: message.message,
            timestamp: message.timestamp
          });
        }
        break;
        
      case 'stream-start':
        this.streamingMessages.set(message.messageId, {
          id: message.messageId,
          content: '',
          timestamp: message.timestamp,
          isStreaming: true
        });
        this.emit('stream-start', message);
        break;
        
      case 'stream-token':
        const streamingMsg = this.streamingMessages.get(message.messageId);
        if (streamingMsg) {
          streamingMsg.content += message.token;
          this.emit('stream-token', {
            messageId: message.messageId,
            token: message.token,
            fullContent: streamingMsg.content,
            timestamp: message.timestamp
          });
        }
        break;
        
      case 'stream-end':
        const completedMsg = this.streamingMessages.get(message.messageId);
        if (completedMsg) {
          completedMsg.isStreaming = false;
          this.emit('stream-end', {
            messageId: message.messageId,
            fullContent: completedMsg.content,
            timestamp: message.timestamp
          });
          this.streamingMessages.delete(message.messageId);
        }
        break;
        
      case 'ai-response':
        // Handle complete AI response (non-streaming)
        this.emit('ai-response', {
          messageId: message.messageId,
          content: message.message,
          timestamp: message.timestamp,
          patient_context: message.patient_context
        });
        break;
        
      case 'human-escalation-response':
        this.emit('system-message', {
          text: message.message,
          timestamp: message.timestamp,
          type: 'escalation'
        });
        break;
        
      case 'error':
        this.emit('error', {
          message: message.message,
          timestamp: message.timestamp
        });
        break;
        
      case 'pong':
        console.log('Received pong - connection alive');
        this.emit('pong', message);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
        this.emit('unknown-message', message);
    }
  }

  attemptReconnect() {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const chatMessage = {
        type: 'chat',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(chatMessage));
      console.log('Chat message sent:', chatMessage);
      return true;
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
      this.emit('error', new Error('WebSocket not connected'));
      return false;
    }
  }

  sendHumanEscalation(reason = 'Need human assistance') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const escalationMessage = {
        type: 'human-escalation',
        reason: reason,
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(escalationMessage));
      console.log('Human escalation request sent:', escalationMessage);
      return true;
    } else {
      console.warn('WebSocket not connected. Cannot send escalation request.');
      this.emit('error', new Error('WebSocket not connected'));
      return false;
    }
  }

  sendFeedback(messageId, feedbackType, comment = '') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const feedbackMessage = {
        type: 'feedback',
        messageId: messageId,
        feedbackType: feedbackType, // 'positive' or 'negative'
        comment: comment,
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(feedbackMessage));
      console.log('Feedback sent:', feedbackMessage);
      return true;
    } else {
      console.warn('WebSocket not connected. Cannot send feedback.');
      this.emit('error', new Error('WebSocket not connected'));
      return false;
    }
  }

  sendPing() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const pingMessage = {
        type: 'ping',
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(pingMessage));
      console.log('Ping sent');
      return true;
    }
    return false;
  }

  startPingInterval() {
    this.stopPingInterval(); // Clear any existing interval
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.pingIntervalTime);
    console.log('Ping interval started');
  }

  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('Ping interval stopped');
    }
  }

  disconnect() {
    this.stopPingInterval();
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    this.connectionMessageShown = false; // Reset flag on disconnect
  }

  getConnectionState() {
    if (!this.socket) return 'DISCONNECTED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  // Event listener methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Utility method to set custom server URL
  setServerUrl(url) {
    this.baseUrl = url;
  }

  // Method to reconnect with fresh token
  reconnectWithToken() {
    if (this.socket) {
      this.disconnect();
    }
    return this.connect();
  }
}

// Export a singleton instance
const websocketService = new WebSocketService();
export default websocketService;