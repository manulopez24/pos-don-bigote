import { io } from 'socket.io-client';

// En Vite, si no hay variable de entorno, se conecta al host actual
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});
