import { useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { WebSocketMessage } from '@shared/schema';

// Generate a unique ID for this user session
const userId = nanoid();

export function useCollaboration() {
  let socket: WebSocket | null = null;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      // Handle incoming messages
      console.log('Received message:', message);
    };

    socket.onclose = () => {
      // Attempt to reconnect after a delay
      setTimeout(connect, 3000);
    };
  }, []);

  const startEditing = useCallback((featureId: number) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'start_editing',
        featureId,
        userId,
        timestamp: new Date().toISOString(),
      };
      socket.send(JSON.stringify(message));
    }
  }, []);

  const stopEditing = useCallback((featureId: number) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'stop_editing',
        featureId,
        userId,
        timestamp: new Date().toISOString(),
      };
      socket.send(JSON.stringify(message));
    }
  }, []);

  const viewing = useCallback((featureId: number) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'viewing',
        featureId,
        userId,
        timestamp: new Date().toISOString(),
      };
      socket.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  return {
    userId,
    startEditing,
    stopEditing,
    viewing,
  };
}
