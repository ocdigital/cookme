import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import { colors as C, typography as T } from '@/constants/theme';

interface OfflineIndicatorProps {
  /** QueryKey usada para calcular "atualizado há X" */
  queryKey: readonly unknown[];
}

/**
 * Exibe badge sutil quando o app está offline.
 * "Modo offline · dados de X min atrás"
 * Renderiza null quando online.
 */
export function OfflineIndicator({ queryKey }: OfflineIndicatorProps) {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || !isInternetReachable;
  const queryClient = useQueryClient();

  if (!isOffline) return null;

  const state = queryClient.getQueryState(queryKey);
  const dataUpdatedAt = state?.dataUpdatedAt;

  let tempoLabel = '';
  if (dataUpdatedAt) {
    const diff = Date.now() - dataUpdatedAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) tempoLabel = 'agora';
    else if (mins < 60) tempoLabel = `${mins}min atrás`;
    else {
      const hrs = Math.floor(mins / 60);
      tempoLabel = `${hrs}h atrás`;
    }
  }

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="wifi-off" size={11} color={C.amber[700]} />
      <Text style={styles.text}>
        Modo offline{tempoLabel ? ` · dados de ${tempoLabel}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: C.amber[50],
    borderBottomWidth: 1,
    borderBottomColor: C.amber[200],
  },
  text: {
    ...T.micro,
    color: C.amber[700],
    fontWeight: '600',
  },
});
