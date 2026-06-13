import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

export interface TutorialStep {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
}

interface Props {
  visible: boolean;
  steps: TutorialStep[];
  onDismiss: () => void;
}

export default function ScreenTutorial({ visible, steps, onDismiss }: Props) {
  const [current, setCurrent] = useState(0);
  const insets = useSafeAreaInsets();
  const isLast = current === steps.length - 1;
  const step = steps[current];

  const handleNext = () => {
    if (isLast) {
      setCurrent(0);
      onDismiss();
    } else {
      setCurrent(c => c + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onDismiss} />
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 24) }]}>

          <View style={[styles.iconWrap, { backgroundColor: step.iconBg ?? C.green[50] }]}>
            <MaterialCommunityIcons
              name={step.icon as any}
              size={32}
              color={step.iconColor ?? C.green[600]}
            />
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {steps.length > 1 && (
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === current && styles.dotActive]}
                />
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
              <Text style={styles.skipTxt}>Pular</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextTxt}>{isLast ? 'Entendi!' : 'Próximo'}</Text>
              {!isLast && <MaterialCommunityIcons name="arrow-right" size={16} color={C.ink[0]} />}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: C.ink[0],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
    ...shadows.modal,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    ...T.h2,
    color: C.ink[900],
    textAlign: 'center',
  },
  description: {
    ...T.body,
    color: C.ink[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.ink[200],
  },
  dotActive: {
    backgroundColor: C.green[500],
    width: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipTxt: {
    ...T.body,
    color: C.ink[500],
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: C.green[500],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadows.sm,
  },
  nextTxt: {
    ...T.body,
    color: C.ink[0],
    fontWeight: '700',
  },
});
