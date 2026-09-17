import { io } from 'socket.io-client';
import { SOCKET_URL, getToken } from './api';

let socket = null;

export function getSocket() {
  if (!socket) {
    initSocket();
  }
  return socket;
}

export function initSocket() {
  const token = getToken();
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    // Socket connected
  });

  socket.on('connect_error', (err) => {
    // Graceful fallback
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
