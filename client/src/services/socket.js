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

  // Vercel serverless functions do not support persistent WebSockets / Socket.IO.
  // If SOCKET_URL points to a vercel.app domain without a dedicated VITE_SOCKET_URL, warn gracefully.
  if (SOCKET_URL && SOCKET_URL.includes('.vercel.app') && !import.meta.env.VITE_SOCKET_URL) {
    console.warn(
      `[Socket.IO] Vercel serverless (${SOCKET_URL}) does not support WebSockets. ` +
      `To enable real-time Socket.IO updates, deploy the server to a persistent host (e.g. Render/Railway) and set VITE_SOCKET_URL=https://<your-backend-url> in Vercel settings.`
    );
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    // Socket connected successfully
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket.IO] Connection notice:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
