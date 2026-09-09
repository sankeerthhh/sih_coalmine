import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/api';

export interface WebSocketEvent {
  type: string;
  data?: any;
  message?: string;
}

export function useWebSocket(onEvent?: (event: WebSocketEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);
  const pollingIntervalRef = useRef<any>(null);

  const startHttpPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    setIsConnected(true);
    setIsOffline(false);

    const poll = async () => {
      try {
        const token = localStorage.getItem('mine_subsidence_token');
        if (!token) return; // Only poll when logged in
        
        const sensors = await api.getSensors();
        if (sensors && sensors.length > 0 && onEvent) {
          onEvent({
            type: 'SENSOR_TELEMETRY_UPDATE',
            data: sensors
          });
          setLastUpdate(new Date());
        }
      } catch {
        // quiet fallback
      }
    };

    pollingIntervalRef.current = setInterval(poll, 6000);
  }, [onEvent]);

  const connect = useCallback(() => {
    // Only attempt WebSocket if we haven't failed repeatedly (e.g. serverless Vercel)
    if (retryCountRef.current >= 2) {
      startHttpPolling();
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/telemetry`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCountRef.current = 0;
        setIsConnected(true);
        setIsOffline(false);
        setLastUpdate(new Date());
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketEvent = JSON.parse(event.data);
          setLastUpdate(new Date());
          if (onEvent) {
            onEvent(parsed);
          }
        } catch {
          // ignore non-json messages like pong
        }
      };

      ws.onclose = () => {
        retryCountRef.current += 1;
        if (retryCountRef.current >= 2) {
          // Gracefully fallback to HTTP polling (serverless environment like Vercel)
          startHttpPolling();
        } else {
          setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      retryCountRef.current += 1;
      startHttpPolling();
    }
  }, [onEvent, startHttpPolling]);

  useEffect(() => {
    connect();
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { isConnected, isOffline, lastUpdate };
}
