import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import websocketService from '../services/websocket.js';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children, serverUrl = 'ws://localhost:3001' }) => {
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState([]);
  const [streamingMessages, setStreamingMessages] = useState(new Map());
  const [error, setError] = useState(null);
  const [currentToken, setCurrentToken] = useState(() => localStorage.getItem('token'));
  const [isTyping, setIsTyping] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState(new Map()); // Track feedback for each message
  const typingTimeoutRef = useRef(null);
  const connectionInitialized = useRef(false); // Track if connection has been initialized
  const connectionMessageShown = useRef(false); // Track if connection message was already shown

  // Monitor token changes and reconnect if needed
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token !== currentToken) {
      setCurrentToken(token);
      if (connectionStatus === 'CONNECTED') {
        // Reconnect with new token
        websocketService.reconnectWithToken();
      }
    }
  }, [currentToken, connectionStatus]);

  // Set up event listeners
  useEffect(() => {
    const handleConnected = () => {
      setConnectionStatus('CONNECTED');
      setError(null);
    };

    const handleDisconnected = () => {
      setConnectionStatus('DISCONNECTED');
      connectionMessageShown.current = false; // Reset when disconnected
    };

    const handleSystemMessage = (data) => {
      // Prevent duplicate connection messages using ref to avoid closure issues
      if (data.text && data.text.toLowerCase().includes('connected')) {
        if (connectionMessageShown.current) {
          return; // Don't add duplicate connection message
        }
        connectionMessageShown.current = true; // Mark that we've shown the connection message
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'system',
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: data.timestamp,
        type: data.type || 'info'
      }]);
    };

    const handleStreamStart = (data) => {
      // Clear typing timeout and hide typing indicator when actual streaming starts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsTyping(false);
      setStreamingMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(data.messageId, {
          id: data.messageId,
          sender: 'ai',
          text: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: data.timestamp,
          isStreaming: true
        });
        return newMap;
      });
    };

    const handleStreamToken = (data) => {
      setStreamingMessages(prev => {
        const newMap = new Map(prev);
        const existingMsg = newMap.get(data.messageId);
        if (existingMsg) {
          newMap.set(data.messageId, {
            ...existingMsg,
            text: data.fullContent
          });
        }
        return newMap;
      });
    };

    const handleStreamEnd = (data) => {
      setStreamingMessages(prev => {
        const newMap = new Map(prev);
        const completedMsg = newMap.get(data.messageId);
        if (completedMsg) {
          // Move from streaming to final messages
          setMessages(prevMessages => [...prevMessages, {
            ...completedMsg,
            isStreaming: false
          }]);
          newMap.delete(data.messageId);
        }
        return newMap;
      });
    };

    const handleAiResponse = (data) => {
      // Handle complete AI response (non-streaming)
      // Clear typing timeout and hide typing indicator when response arrives
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: data.messageId,
        sender: 'ai',
        text: data.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: data.timestamp,
        patient_context: data.patient_context
      }]);
    };

    const handleError = (error) => {
      setError(error.message || 'WebSocket connection error');
      setConnectionStatus('DISCONNECTED');
    };

    // Register event listeners
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('system-message', handleSystemMessage);
    websocketService.on('stream-start', handleStreamStart);
    websocketService.on('stream-token', handleStreamToken);
    websocketService.on('stream-end', handleStreamEnd);
    websocketService.on('ai-response', handleAiResponse);
    websocketService.on('error', handleError);

    // Connect to WebSocket server only if not already initialized
    websocketService.setServerUrl(serverUrl);
    
    // Prevent duplicate connections in StrictMode
    if (!connectionInitialized.current) {
      connectionInitialized.current = true;
      websocketService.connect();
    }

    // Cleanup on unmount
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Don't reset connectionInitialized.current here to prevent StrictMode double connection
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('system-message', handleSystemMessage);
      websocketService.off('stream-start', handleStreamStart);
      websocketService.off('stream-token', handleStreamToken);
      websocketService.off('stream-end', handleStreamEnd);
      websocketService.off('ai-response', handleAiResponse);
      websocketService.off('error', handleError);
      // Only disconnect if component is truly unmounting, not just StrictMode cleanup
      if (!connectionInitialized.current) {
        websocketService.disconnect();
      }
    };
  }, [serverUrl]);

  const sendMessage = useCallback((message) => {
    if (connectionStatus === 'CONNECTED') {
      setIsTyping(true); // Show typing indicator when sending message
      
      // Set a timeout to hide typing indicator if no response comes within 10 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        typingTimeoutRef.current = null;
      }, 10000);
      
      return websocketService.sendMessage(message);
    } else {
      setError('WebSocket not connected. Cannot send message.');
      return false;
    }
  }, [connectionStatus]);

  const connect = useCallback((url) => {
    setError(null);
    return websocketService.connect(url);
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendHumanEscalation = useCallback((reason) => {
    if (connectionStatus === 'CONNECTED') {
      return websocketService.sendHumanEscalation(reason);
    } else {
      setError('WebSocket not connected. Cannot send escalation request.');
      return false;
    }
  }, [connectionStatus]);

  const reconnectWithToken = useCallback(() => {
    setError(null);
    setCurrentToken(localStorage.getItem('token'));
    return websocketService.reconnectWithToken();
  }, []);

  const submitFeedback = useCallback((messageId, feedbackType, comment = '') => {
    // Store feedback locally
    setMessageFeedback(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, {
        type: feedbackType, // 'positive' or 'negative'
        comment: comment,
        timestamp: new Date().toISOString()
      });
      return newMap;
    });

    // Send feedback to server if connected
    if (connectionStatus === 'CONNECTED') {
      websocketService.sendFeedback(messageId, feedbackType, comment);
    }

    return true;
  }, [connectionStatus]);

  const value = {
    connectionStatus,
    messages,
    streamingMessages: Array.from(streamingMessages.values()),
    error,
    isTyping,
    messageFeedback,
    sendMessage,
    sendHumanEscalation,
    submitFeedback,
    connect,
    disconnect,
    clearMessages,
    clearError,
    reconnectWithToken,
    isConnected: connectionStatus === 'CONNECTED',
    isConnecting: connectionStatus === 'CONNECTING',
    isDisconnected: connectionStatus === 'DISCONNECTED'
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};