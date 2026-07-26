import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext({ socket: null, connected: false });
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { token, user, siteIds } = useAuth();
  const [connected, setConnected] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!token || !user) return undefined;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    ref.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:sites', siteIds);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => { socket.close(); ref.current = null; setConnected(false); };
  }, [token, user, siteIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ socket: ref.current, connected }), [connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** Subscribe to a realtime event for the lifetime of a component. */
export function useSocketEvent(event, handler) {
  const { socket } = useSocket();
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const fn = (...args) => saved.current(...args);
    socket.on(event, fn);
    return () => socket.off(event, fn);
  }, [socket, event]);
}
