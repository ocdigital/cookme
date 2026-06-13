import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');

const PASSOS = [
  {
    icon: 'chef-hat',
    cor: C.green[500],
    titulo: 'Oi! Sou o CookMe',
    texto: 'Ainda não te conheço muito bem — mas vou aprender. Quanto mais você cozinha comigo, mais personalizado fico.',
  },
  {
    icon: 'star-outline',
    cor: C.amber[600],
    titulo: 'Avalie as receitas',
    texto: 'Gostou? Me diz com estrelas. Odiou? Me conta também. Cada nota me ensina algo sobre você.',
  },
  {
    icon: 'heart-outline',
    cor: '#e05c97',
    titulo: 'Eu me lembro de tudo',
    texto: 'Sem coentro? Anotei. Prefere receitas rápidas? Sei disso. Vou usar isso nas próximas sugestões.',
  },
  {
    icon: 'trending-up',
    cor: '#6366f1',
    titulo: 'Fico melhor com o tempo',
    texto: 'No começo sou genérico. Com algumas semanas de uso, viro seu sous-chef pessoal de verdade.',
  },
];

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function OnboardingAprendizadoModal({ visible, onDismiss }: Props) {
  const [passo, setPasso] = React.useState(0);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPasso(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  const avancar = () => {
    if (ultimo) { onDismiss(); return; }
    setPasso(p => p + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Ícone */}
          <View style={[styles.iconWrap, { backgroundColor: atual.cor + '18' }]}>
            <MaterialCommunityIcons name={atual.icon as any} size={40} color={atual.cor} />
          </View>

          <Text style={styles.titulo}>{atual.titulo}</Text>
          <Text style={styles.texto}>{atual.texto}</Text>

          {/* Dots */}
          <View style={styles.dots}>
            {PASSOS.map((_, i) => (
              <View key={i} style={[styles.dot, i === passo && styles.dotAtivo]} />
            ))}
          </View>

          {/* Botão */}
          <TouchableOpacity style={styles.btn} onPress={avancar} activeOpacity={0.85}>
            <Text style={styles.btnTxt}>{ultimo ? 'Vamos começar!' : 'Entendi'}</Text>
            <MaterialCommunityIcons
              name={ultimo ? 'chef-hat' : 'arrow-right'}
              size={18}
              color={C.ink[900]}
            />
          </TouchableOpacity>

          {/* Pular */}
          {!ultimo && (
            <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} style={styles.pular}>
              <Text style={styles.pularTxt}>Pular</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.ink[0],
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
    ...shadows.modal,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink[200], marginBottom: 24,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 22, fontWeight: '800', color: C.ink[900],
    letterSpacing: -0.4, textAlign: 'center', marginBottom: 10,
  },
  texto: {
    ...T.body,
    color: C.ink[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  } as any,
  dots: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.ink[200],
  },
  dotAtivo: { width: 18, backgroundColor: C.green[500] },
  btn: {
    height: 52, paddingHorizontal: 28,
    backgroundColor: C.green[500],
    borderRadius: radius.pill,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    width: '100%', justifyContent: 'center',
    ...shadows.sm,
  },
  btnTxt: { fontSize: 16, fontWeight: '700', color: C.ink[0] },
  pular: { marginTop: 14 },
  pularTxt: { ...T.small, color: C.ink[400] } as any,
});
