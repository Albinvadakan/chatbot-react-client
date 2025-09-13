import React, { useState, useEffect, useMemo } from 'react';
import styles from '../styles/Chat.module.css';
import { useWebSocket } from '../contexts/WebSocketContext';

const Chat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your AI assistant. How can I help you today?",
      time: '18:23',
    },
  ]);

  const { 
    sendMessage, 
    sendHumanEscalation,
    messages: wsMessages, 
    streamingMessages,
    connectionStatus, 
    error, 
    isConnected,
    clearError 
  } = useWebSocket();

  // Merge WebSocket messages with local messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestWsMessage = wsMessages[wsMessages.length - 1];
      // Check if this message is already in our local messages
      const exists = messages.some(msg => 
        msg.id === latestWsMessage.id || 
        (msg.text === latestWsMessage.text && msg.sender === latestWsMessage.sender)
      );
      
      if (!exists) {
        setMessages(prev => [...prev, latestWsMessage]);
      }
    }
  }, [wsMessages]);

  // Combine regular messages with streaming messages for display
  const allMessages = useMemo(() => {
    return [...messages, ...streamingMessages];
  }, [messages, streamingMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear any previous errors
    clearError();

    // Add user message to local state immediately
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);

    // Send message via WebSocket
    if (isConnected) {
      const success = sendMessage(input);
      if (!success) {
        // Add error message if sending failed
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Sorry, I cannot respond right now. Please check your connection.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }]);
      }
    } else {
      // Add offline message if not connected
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'I am currently offline. Please wait while I try to reconnect...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    }

    setInput('');
  };

  const handleHumanEscalation = () => {
    const reason = prompt('Please describe why you need human assistance:');
    if (reason) {
      sendHumanEscalation(reason);
    }
  };

  const getMessageStyle = (msg) => {
    if (msg.sender === 'system') {
      return msg.type === 'escalation' ? styles.escalationMessage : styles.systemMessage;
    }
    return msg.isError ? styles.errorMessage : '';
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.headerRow}>
        <div className={styles.avatar}><span role="img" aria-label="bot">🤖</span></div>
        <div>
          <div className={styles.aiName}>AI Assistant</div>
          <div className={styles.status}>
            <span className={`${styles.statusIndicator} ${isConnected ? styles.online : styles.offline}`}>
              {connectionStatus === 'CONNECTING' ? 'Connecting...' : 
               connectionStatus === 'CONNECTED' ? 'Online' : 
               'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={clearError} className={styles.errorClose}>×</button>
        </div>
      )}
      
      <div className={styles.subTitle}>
        Start a conversation with the AI assistant
        {isConnected && (
          <button 
            onClick={handleHumanEscalation} 
            className={styles.escalateBtn}
            title="Request human assistance"
          >
            👤 Human Help
          </button>
        )}
      </div>
      <div className={styles.messages}>
        {allMessages.map(msg => (
          msg.sender === 'ai' || msg.sender === 'system' ? (
            <div key={msg.id} className={`${styles.messageRow} ${getMessageStyle(msg)}`}>
              <div className={styles.avatarSmall}>
                <span role="img" aria-label="bot">
                  {msg.sender === 'system' ? '🔔' : '🤖'}
                </span>
              </div>
              <div>
                <div className={`${styles.message} ${msg.isStreaming ? styles.streamingMessage : ''}`}>
                  {msg.text}
                  {msg.isStreaming && <span className={styles.cursor}>|</span>}
                </div>
                <div className={styles.time}>{msg.time}</div>
              </div>
            </div>
          ) : (
            <div key={msg.id} className={styles.messageRowUser}>
              <div className={styles.userMsgWrap}>
                <div className={styles.userMessage}>{msg.text}</div>
                <div className={styles.timeUser}>{msg.time}</div>
              </div>
              <div className={styles.avatarUser}><span role="img" aria-label="user">👤</span></div>
            </div>
          )
        ))}
      </div>
      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={isConnected ? "Type your message..." : "Connecting to server..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className={`${styles.sendBtn} ${!isConnected ? styles.disabled : ''}`}
          disabled={!isConnected || !input.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;
