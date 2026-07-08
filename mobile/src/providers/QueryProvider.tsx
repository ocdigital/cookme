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
        // 4: invalida cache envenenada (favoritas persistida como objeto → .map crash)
        // 5: receitas cacheadas antes do backfill de ingredientes embutidos
        //    mostravam a lista duplicada (modo_preparo antigo ainda tinha o bloco)
        buster: '5',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
