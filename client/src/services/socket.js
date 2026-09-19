import { io } from 'socket.io-client';
import { SOCKET_URL, getToken } from './api';

let socket = null;

const noopSocket = {
  connected: false,
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => noopSocket,
  disconnect: () => { },
};

export function getSocket() {
  if (!socket) {
    initSocket();
  }
  return socket || noopSocket;
}

export function initSocket() {
  const token = getToken();
  if (!token) return noopSocket;

  if (socket && socket.connected) {
    return socket;
  }

  if (socket && typeof socket.disconnect === 'function') {
    socket.disconnect();
  }

  // Vercel serverless functions do not host persistent WebSockets / Socket.IO servers.
  // Silently assign noopSocket to prevent repeated calls, failed handshakes, and console warnings.
  if (SOCKET_URL && SOCKET_URL.includes('.vercel.app') && !import.meta.env.VITE_SOCKET_URL) {
    socket = noopSocket;
    return socket;
  }

  try {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    socket.on('connect_error', () => {
      // Graceful silent fallback
    });

    return socket;
  } catch {
    socket = noopSocket;
    return socket;
  }
}

export function disconnectSocket() {
  if (socket && typeof socket.disconnect === 'function') {
    socket.disconnect();
    socket = null;
  }
}
