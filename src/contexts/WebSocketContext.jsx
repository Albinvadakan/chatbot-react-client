import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
    };

    const handleSystemMessage = (data) => {
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
    websocketService.on('error', handleError);

    // Connect to WebSocket server
    websocketService.setServerUrl(serverUrl);
    websocketService.connect();

    // Cleanup on unmount
    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('system-message', handleSystemMessage);
      websocketService.off('stream-start', handleStreamStart);
      websocketService.off('stream-token', handleStreamToken);
      websocketService.off('stream-end', handleStreamEnd);
      websocketService.off('error', handleError);
      websocketService.disconnect();
    };
  }, [serverUrl]);

  const sendMessage = useCallback((message) => {
    if (connectionStatus === 'CONNECTED') {
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

  const value = {
    connectionStatus,
    messages,
    streamingMessages: Array.from(streamingMessages.values()),
    error,
    sendMessage,
    sendHumanEscalation,
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