import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import { colors as C, typography as T } from '@/constants/theme';

export function OfflineBanner() {
  const { isConnected, isInternetReachable, justReconnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const isOffline = !isConnected || !isInternetReachable;
  const visible = isOffline || justReconnected;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : -60,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  const bgColor = justReconnected && !isOffline ? C.green[600] : C.ink[800];
  const icon = justReconnected && !isOffline ? 'wifi-check' : 'wifi-off';
  const message = justReconnected && !isOffline
    ? 'Conexão restaurada · Sincronizando...'
    : 'Sem conexão · Mostrando dados salvos';

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 4, backgroundColor: bgColor },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <MaterialCommunityIcons name={icon as any} size={15} color={C.ink[0]} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  text: {
    ...T.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
