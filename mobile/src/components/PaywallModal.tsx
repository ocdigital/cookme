import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Pressable, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  feature?: string;        // ex: "Receitas IA ilimitadas"
  descricao?: string;      // explicação do bloqueio
}

const BENEFICIOS = [
  'Scans de nota fiscal ilimitados',
  'Receitas personalizadas por IA',
  'Importar receitas de qualquer site',
  'Planejamento semanal completo',
];

export default function PaywallModal({ visible, onClose, feature, descricao }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const irParaPlanos = () => {
    onClose();
    router.push('/(app)/planos' as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.handle} />

            {/* Ícone */}
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="star-circle" size={40} color="#7C3AED" />
            </View>

            <Text style={styles.titulo}>
              {feature ? `"${feature}" é Premium` : 'Recurso Premium'}
            </Text>
            <Text style={styles.sub}>
              {descricao || 'Faça upgrade para desbloquear este e muito mais recursos.'}
            </Text>

            {/* Benefícios */}
            <View style={styles.beneficiosBox}>
              {BENEFICIOS.map((b, i) => (
                <View key={i} style={styles.beneficioRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color="#7C3AED" />
                  <Text style={styles.beneficioTxt}>{b}</Text>
                </View>
              ))}
            </View>

            {/* Preço destaque */}
            <View style={styles.precoBox}>
              <Text style={styles.precoLabel}>A partir de</Text>
              <Text style={styles.preco}>R$14,90<Text style={styles.precoPeriodo}>/mês</Text></Text>
            </View>

            <TouchableOpacity style={styles.btnPrimario} onPress={irParaPlanos} activeOpacity={0.85}>
              <MaterialCommunityIcons name="star-circle" size={18} color="#fff" />
              <Text style={styles.btnPrimarioTxt}>Ver planos e assinar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecundario} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.btnSecundarioTxt}>Continuar com versão gratuita</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.ink[0],
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 16,
    alignItems: 'center',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink[200], marginBottom: 24,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  titulo: { ...T.h2, color: C.ink[900], textAlign: 'center', marginBottom: 8 },
  sub: { ...T.small, color: C.ink[500], textAlign: 'center', marginBottom: 20 },

  beneficiosBox: {
    width: '100%', backgroundColor: C.ink[50],
    borderRadius: radius.lg, padding: 16, gap: 10, marginBottom: 20,
    borderWidth: 1, borderColor: C.ink[150],
  },
  beneficioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  beneficioTxt: { ...T.small, color: C.ink[700], flex: 1 },

  precoBox: { alignItems: 'center', marginBottom: 20 },
  precoLabel: { ...T.micro, color: C.ink[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  preco: { ...T.h1, color: C.ink[900], fontWeight: '800' },
  precoPeriodo: { ...T.body, color: C.ink[500], fontWeight: '400' },

  btnPrimario: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#7C3AED', borderRadius: radius.lg,
    paddingVertical: 16, marginBottom: 12, ...shadows.sm,
  },
  btnPrimarioTxt: { ...T.body, color: '#fff', fontWeight: '700' },

  btnSecundario: {
    width: '100%', alignItems: 'center', paddingVertical: 12,
  },
  btnSecundarioTxt: { ...T.small, color: C.ink[500] },
});
