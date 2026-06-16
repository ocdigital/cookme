import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

interface NetworkContextValue {
  isConnected: boolean;
  isInternetReachable: boolean;
  // true quando acabou de reconectar (para mostrar banner "sincronizando")
  justReconnected: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  isInternetReachable: true,
  justReconnected: false,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOffline = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Integra NetInfo com TanStack Query — pausa/retoma queries automaticamente
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state: NetInfoState) => {
        const online = !!(state.isConnected && state.isInternetReachable !== false);
        setOnline(online);
      });
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = !!state.isConnected;
      const reachable = state.isInternetReachable !== false;

      setIsConnected(connected);
      setIsInternetReachable(reachable);

      if (wasOffline.current && connected && reachable) {
        // Acabou de reconectar
        setJustReconnected(true);
        wasOffline.current = false;
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => setJustReconnected(false), 3000);
      }

      if (!connected || !reachable) {
        wasOffline.current = true;
      }
    });

    return () => {
      unsubscribe();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable, justReconnected }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkStatus() {
  return useContext(NetworkContext);
}
