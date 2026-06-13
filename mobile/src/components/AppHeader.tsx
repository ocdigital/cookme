import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, typography as T, shadows } from '@/constants/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** 'menu' = hamburguer (tabs principais) | 'back' = seta voltar (telas internas) */
  leftAction?: 'menu' | 'back';
  onMenuPress?: () => void;
  right?: React.ReactNode;
}

export function AppHeader({ title, subtitle, leftAction = 'back', onMenuPress, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLeft = () => {
    if (leftAction === 'back') {
      router.back();
    } else {
      onMenuPress?.();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.leftBtn} onPress={handleLeft} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name={leftAction === 'back' ? 'arrow-left' : 'menu'}
          size={22}
          color={C.ink[700]}
        />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.right}>
        {right ?? <View style={{ width: 36 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.ink[0],
    borderBottomWidth: 1,
    borderBottomColor: C.ink[150],
    gap: 10,
    ...shadows.sm,
  },
  leftBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1 },
  subtitle: {
    ...T.micro,
    color: C.green[600],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  title: { ...T.h3, color: C.ink[900] },
  right: { minWidth: 36, alignItems: 'flex-end' },
});
