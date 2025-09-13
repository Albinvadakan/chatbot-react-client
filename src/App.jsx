
import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [username, setUsername] = useState(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).username : '';
  });

  useEffect(() => {
    if (!isLoggedIn && localStorage.getItem('token')) {
      setIsLoggedIn(true);
    }
    const user = localStorage.getItem('user');
    setUsername(user ? JSON.parse(user).username : '');
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <WebSocketProvider serverUrl="ws://localhost:3001">
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} username={username} />
      ) : (
        <Login onLogin={() => {
          setIsLoggedIn(true);
          const user = localStorage.getItem('user');
          setUsername(user ? JSON.parse(user).username : '');
        }} />
      )}
    </WebSocketProvider>
  );
}

export default App;
