import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export type ModoAlimentar = 'normal' | 'fitness' | 'vegetariano' | 'vegano';

export const MODO_CORES: Record<ModoAlimentar, string> = {
  normal:      '#F5A623', // amber
  fitness:     '#6366f1', // roxo
  vegetariano: '#16a34a', // verde
  vegano:      '#4ade80', // verde claro
};

interface ModoAlimentarContextType {
  modoAlimentar: ModoAlimentar;
  setModoAlimentar: (modo: ModoAlimentar) => void;
  corModo: string;
  carregarPreferencias: () => Promise<void>;
}

const ModoAlimentarContext = createContext<ModoAlimentarContextType>({
  modoAlimentar: 'normal',
  setModoAlimentar: () => {},
  corModo: MODO_CORES.normal,
  carregarPreferencias: async () => {},
});

export function ModoAlimentarProvider({ children }: { children: React.ReactNode }) {
  const [modoAlimentar, setModoInterno] = useState<ModoAlimentar>('normal');

  const carregarPreferencias = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;
      const res = await api.get('/usuarios/preferencias');
      const modo = res.data?.modo_alimentar as ModoAlimentar;
      if (modo) setModoInterno(modo);
    } catch {}
  }, []);

  useEffect(() => { carregarPreferencias(); }, [carregarPreferencias]);

  const setModoAlimentar = useCallback((modo: ModoAlimentar) => {
    setModoInterno(modo);
  }, []);

  return (
    <ModoAlimentarContext.Provider value={{
      modoAlimentar,
      setModoAlimentar,
      corModo: MODO_CORES[modoAlimentar],
      carregarPreferencias,
    }}>
      {children}
    </ModoAlimentarContext.Provider>
  );
}

export function useModoAlimentar() {
  return useContext(ModoAlimentarContext);
}
