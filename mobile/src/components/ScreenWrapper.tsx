import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as C } from '@/constants/theme';
import { useModoAlimentar } from '@/contexts/ModoAlimentarContext';

interface Props {
  children: React.ReactNode;
}

export default function ScreenWrapper({ children }: Props) {
  const insets = useSafeAreaInsets();
  const { corModo } = useModoAlimentar();
  return (
    <View style={[styles.outer, { backgroundColor: corModo }]}>
      <View style={[styles.inner, { paddingBottom: insets.bottom }]}>
        {children}
      </View>
      <View style={{ height: insets.bottom, backgroundColor: corModo }} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  inner: { flex: 1, backgroundColor: C.ink[50] },
});
