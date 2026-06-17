import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '@/lib/queryClient';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: persister as any,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        buster: '3',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
