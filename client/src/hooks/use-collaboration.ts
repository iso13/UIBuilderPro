import { useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { WebSocketMessage } from '@shared/schema';

// Generate a unique ID for this user session
const userId = nanoid();

export function useCollaboration() {
  let socket: WebSocket | null = null;

  const connect = useCallback(() => {
    try {
      // Get the current protocol and host from the window location
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws`;

      console.log('Attempting WebSocket connection to:', wsUrl);

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connection established');
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('Received message:', message);
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        // Attempt to reconnect after a delay
        setTimeout(connect, 3000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      // Attempt to reconnect after a delay
      setTimeout(connect, 3000);
    }
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