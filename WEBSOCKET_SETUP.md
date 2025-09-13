# WebSocket Chat API Integration

This project implements a complete WebSocket chat system following the API specification with real-time streaming responses, token authentication, and human escalation features.

## Features Added

- ✅ **WebSocket service** for managing connections
- ✅ **Token-based authentication** (ws://localhost:3001?token=your_token)
- ✅ **Real-time streaming responses** (stream-start, stream-token, stream-end)
- ✅ **Multiple message types** (chat, human-escalation, ping/pong)
- ✅ **Connection status indicators** (Online/Offline/Connecting)
- ✅ **Automatic reconnection** with retry logic
- ✅ **Keep-alive mechanism** (30-second ping interval)
- ✅ **Human escalation** requests
- ✅ **Error handling** and user feedback
- ✅ **Streaming message display** with typing animation

## API Implementation

### Outgoing Message Types

**Chat Message:**
```javascript
{
  type: 'chat',
  content: 'Your message here',
  timestamp: '2025-09-12T...'
}
```

**Human Escalation:**
```javascript
{
  type: 'human-escalation',
  reason: 'Need human assistance',
  timestamp: '2025-09-12T...'
}
```

**Keep Alive:**
```javascript
{
  type: 'ping',
  timestamp: '2025-09-12T...'
}
```

### Incoming Message Handling

**Connection Established:**
- Type: `connection`
- Displays system message in chat

**AI Response Streaming:**
- `stream-start` → Creates new AI message placeholder
- `stream-token` → Appends text with typing animation
- `stream-end` → Finalizes message

**Human Escalation Response:**
- Type: `human-escalation-response`
- Shows escalation confirmation

**Error Messages:**
- Type: `error`
- Displays error notification

**Keep Alive Response:**
- Type: `pong`
- Maintains connection health

## WebSocket Setup

### 1. Token Authentication

The application automatically includes the user's authentication token in the WebSocket connection:
```
ws://localhost:3001?token=${token}
```

The token is retrieved from `localStorage.getItem('token')` and appended as a query parameter.

### 2. Default Configuration

The application is configured to connect to a WebSocket server at:
```
ws://localhost:3001?token=${token}
```

### 3. Custom Server URL

You can change the WebSocket server URL by:

**Option A: Environment Variable**
Create a `.env` file in the root directory:
```env
REACT_APP_WEBSOCKET_URL=ws://your-server:port
```

**Option B: Direct Configuration**
Edit `src/config/websocket.js`:
```javascript
SERVER_URL: 'ws://your-server:port'
```

**Note:** The token parameter will be automatically appended to any URL you configure.

### 4. Testing with Example Server

A sample WebSocket server with token authentication is included in `websocket-server-example.js`. To use it:

1. **Create a new directory for the server:**
   ```bash
   mkdir websocket-server
   cd websocket-server
   ```

2. **Initialize Node.js project:**
   ```bash
   npm init -y
   npm install ws url
   ```

3. **Copy the example server:**
   ```bash
   cp ../websocket-server-example.js ./server.js
   ```

4. **Run the server:**
   ```bash
   node server.js
   ```

5. **Start your React app:**
   ```bash
   cd ../
   npm run dev
   ```

The server will log the token provided by each client connection.

## WebSocket Message Format

### Outgoing Messages (Client to Server)
```javascript
{
  "type": "message",
  "content": "User's message text",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "id": "unique_message_id"
}
```

### Incoming Messages (Server to Client)
```javascript
{
  "type": "message",
  "content": "AI response text",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "id": "unique_message_id"
}
```

## WebSocket Service API

The WebSocket service provides the following methods:

- `connect(url)` - Connect to WebSocket server
- `disconnect()` - Disconnect from server
- `sendMessage(message)` - Send a message
- `on(event, callback)` - Listen for events
- `off(event, callback)` - Remove event listener
- `getConnectionState()` - Get current connection status

## React Hook Usage

Use the `useWebSocket` hook in any component:

```javascript
import { useWebSocket } from '../contexts/WebSocketContext';

const MyComponent = () => {
  const { 
    sendMessage,           // Send chat messages
    sendHumanEscalation,   // Request human help
    messages,              // Completed messages
    streamingMessages,     // Currently streaming messages
    connectionStatus,      // Connection state
    isConnected,          // Boolean connection status
    error,                // Error messages
    reconnectWithToken    // Manual reconnection
  } = useWebSocket();

  // Send a chat message
  const handleSend = () => {
    sendMessage("Hello from React!");
  };

  // Request human assistance
  const handleEscalation = () => {
    sendHumanEscalation("I need help with this complex issue");
  };

  // Reconnect with fresh token
  const handleReconnect = () => {
    reconnectWithToken();
  };

  return (
    <div>
      <button onClick={handleSend} disabled={!isConnected}>
        Send Message
      </button>
      <button onClick={handleEscalation} disabled={!isConnected}>
        Get Human Help
      </button>
      <button onClick={handleReconnect}>Reconnect</button>
      {error && <div>Error: {error}</div>}
      
      {/* Display streaming messages with typing indicator */}
      {streamingMessages.map(msg => (
        <div key={msg.id}>
          {msg.text}<span className="cursor">|</span>
        </div>
      ))}
    </div>
  );
};
```

## UI Features

### Streaming Response Display
- Real-time text streaming with typing animation
- Blinking cursor indicator during streaming
- Smooth transition from streaming to final message

### Human Escalation
- "👤 Human Help" button in chat interface
- Prompt for escalation reason
- System notification when escalation is processed

### Connection Status
- Visual indicators with pulsing animation
- Online (green) / Offline (red) / Connecting (gray)
- Automatic reconnection attempts

### Message Types
- **User messages**: Blue bubbles on the right
- **AI messages**: Gray bubbles on the left with bot icon
- **System messages**: Blue info bubbles with notification icon
- **Escalation messages**: Orange warning bubbles
- **Error messages**: Red error bubbles

## Token Management

### Automatic Token Handling

The WebSocket connection automatically:
- Retrieves the token from `localStorage.getItem('token')`
- Appends it as a query parameter: `?token=${token}`
- Monitors token changes and reconnects when needed
- Handles cases where no token is available

### Manual Token Refresh

If your token gets refreshed during the session:

```javascript
// After updating the token in localStorage
localStorage.setItem('token', newToken);

// Manually trigger reconnection with new token
const { reconnectWithToken } = useWebSocket();
reconnectWithToken();
```

## Connection States

- `CONNECTING` - Attempting to connect
- `CONNECTED` - Successfully connected
- `CLOSING` - Connection closing
- `DISCONNECTED` - No connection

## Error Handling

The application handles various error scenarios:

- Connection failures
- Message parsing errors
- Server disconnections
- Network issues

Errors are displayed in the chat interface and automatically cleared when sending new messages.

## Customization

### Reconnection Settings

Edit `src/config/websocket.js`:
```javascript
MAX_RECONNECT_ATTEMPTS: 5,    // Number of retry attempts
RECONNECT_DELAY: 1000,        // Delay between attempts (ms)
CONNECTION_TIMEOUT: 10000,    // Connection timeout (ms)
```

### Message Types

Add custom message types in `src/config/websocket.js`:
```javascript
export const MESSAGE_TYPES = {
  CHAT_MESSAGE: 'chat_message',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  TYPING: 'typing',
  // Add your custom types here
};
```

## Troubleshooting

### Connection Issues

1. **Check server is running:** Ensure your WebSocket server is running on the correct port
2. **Check URL:** Verify the WebSocket URL is correct
3. **Check firewall:** Ensure port 3001 (or your custom port) is not blocked
4. **Check browser console:** Look for WebSocket error messages

### Message Issues

1. **Check message format:** Ensure your server sends properly formatted JSON
2. **Check content field:** The React app expects a `content`, `text`, or `message` field
3. **Check server logs:** Verify your server is receiving and processing messages

### Development Tips

1. **Use browser DevTools:** Network tab shows WebSocket connections
2. **Enable console logging:** The WebSocket service logs connection events
3. **Test with example server:** Use the provided example server for testing

## Production Deployment

For production deployment:

1. **Use secure WebSocket (wss://)** for HTTPS sites
2. **Set production WebSocket URL** via environment variables
3. **Configure proper CORS** on your WebSocket server
4. **Implement authentication** if required
5. **Set up proper logging** and monitoring