import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      connectSocket(parsedUser._id);
    }
    setLoading(false);
  }, []);

  const connectSocket = (userId) => {
    if (socketRef.current?.connected) return;
    
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
      transports: ['websocket']
    });
    
    socket.on('connect', () => {
      socket.emit('join_user_room', userId);
    });

    socket.on('notification', (data) => {
      // Dispatches a custom DOM event that any component can listen to
      window.dispatchEvent(new CustomEvent('app_notification', { detail: data }));
    });
    
    socketRef.current = socket;
  };

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    connectSocket(userData._id);
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/logout`, {
        method: 'POST', credentials: 'include'
      });
    } catch (e) {}
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, socket: socketRef.current }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
