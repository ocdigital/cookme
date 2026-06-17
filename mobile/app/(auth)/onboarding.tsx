import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { colors as C, typography as T, radius, shadows } from '@/constants/theme';
import { ModoAlimentar, MODO_CORES } from '@/contexts/ModoAlimentarContext';

const MODOS: { value: ModoAlimentar; label: string; desc: string; icon: string }[] = [
  { value: 'normal',      label: 'Normal',      desc: 'Sem restrições',               icon: 'silverware-fork-knife' },
  { value: 'fitness',     label: 'Fitness',     desc: 'Foco em proteína e saúde',     icon: 'dumbbell' },
  { value: 'vegetariano', label: 'Vegetariano', desc: 'Sem carnes',                   icon: 'leaf' },
  { value: 'vegano',      label: 'Vegano',      desc: 'Sem produtos de origem animal',icon: 'sprout' },
];

const STEPS = ['modo', 'scan', 'pronto'] as const;
type Step = typeof STEPS[number];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('modo');
  const [modo, setModo] = useState<ModoAlimentar>('normal');
  const [saving, setSaving] = useState(false);

  const salvarModo = async () => {
    setSaving(true);
    try {
      await api.patch('/usuarios/preferencias', { modo_alimentar: modo });
      setStep('scan');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const concluir = async () => {
    await AsyncStorage.removeItem('isNewUser');
    router.replace('/(app)/(tabs)/' as any);
  };

  const pularParaApp = async () => {
    await AsyncStorage.removeItem('isNewUser');
    router.replace('/(app)/(tabs)/' as any);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              STEPS.indexOf(step) >= i && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Pular */}
      <TouchableOpacity style={styles.skipBtn} onPress={pularParaApp}>
        <Text style={styles.skipText}>Pular</Text>
      </TouchableOpacity>

      {/* ─── Step 1: Modo alimentar ─── */}
      {step === 'modo' && (
        <View style={styles.content}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={52} color={C.green[500]} style={styles.stepIcon} />
          <Text style={styles.stepTitle}>Como você prefere se alimentar?</Text>
          <Text style={styles.stepSubtitle}>Vamos filtrar receitas para o seu estilo de vida.</Text>

          <View style={styles.modoGrid}>
            {MODOS.map((m) => {
              const cor = MODO_CORES[m.value];
              const selected = modo === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.modoCard, selected && { borderColor: cor, borderWidth: 2 }]}
                  onPress={() => setModo(m.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.modoIconWrap, { backgroundColor: cor + '22' }]}>
                    <MaterialCommunityIcons name={m.icon as any} size={28} color={cor} />
                  </View>
                  <Text style={[styles.modoLabel, selected && { color: cor }]}>{m.label}</Text>
                  <Text style={styles.modoDesc}>{m.desc}</Text>
                  {selected && (
                    <View style={[styles.modoCheck, { backgroundColor: cor }]}>
                      <MaterialCommunityIcons name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
            onPress={salvarModo}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={C.ink[0]} />
              : <><Text style={styles.primaryBtnText}>Continuar</Text>
                 <MaterialCommunityIcons name="arrow-right" size={18} color={C.ink[0]} /></>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Step 2: Scan cupom ─── */}
      {step === 'scan' && (
        <View style={styles.content}>
          <View style={styles.scanIllustration}>
            <MaterialCommunityIcons name="barcode-scan" size={80} color={C.amber[500]} />
          </View>
          <Text style={styles.stepTitle}>Escaneie seu primeiro cupom fiscal</Text>
          <Text style={styles.stepSubtitle}>
            Fotografe a nota da sua última compra no supermercado. O CookMe reconhece os ingredientes e já organiza sua despensa.
          </Text>

          <View style={styles.benefitList}>
            {[
              { icon: 'lightning-bolt', text: 'Despensa preenchida em segundos' },
              { icon: 'chef-hat',       text: 'Receitas do que você já tem' },
              { icon: 'bell-outline',   text: 'Alerta antes de vencer' },
            ].map((b) => (
              <View key={b.text} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <MaterialCommunityIcons name={b.icon as any} size={16} color={C.green[600]} />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={async () => {
              await AsyncStorage.removeItem('isNewUser');
              router.replace('/(app)/receita-ocr' as any);
            }}
          >
            <MaterialCommunityIcons name="camera" size={18} color={C.ink[0]} />
            <Text style={styles.primaryBtnText}>Escanear cupom agora</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('pronto')}>
            <Text style={styles.secondaryBtnText}>Fazer depois</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Step 3: Pronto ─── */}
      {step === 'pronto' && (
        <View style={styles.content}>
          <View style={[styles.scanIllustration, { backgroundColor: C.green[50] }]}>
            <MaterialCommunityIcons name="check-circle" size={80} color={C.green[500]} />
          </View>
          <Text style={styles.stepTitle}>Tudo pronto!</Text>
          <Text style={styles.stepSubtitle}>
            Sua conta está configurada. Explore o app e escaneie seu primeiro cupom quando quiser.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={concluir}>
            <Text style={styles.primaryBtnText}>Explorar o CookMe</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={C.ink[0]} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink[0] },

  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: C.ink[150],
  },
  progressDotActive: {
    backgroundColor: C.green[500],
  },

  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { ...T.small, color: C.ink[400], fontWeight: '600' },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  stepIcon: { marginBottom: 4 },
  stepTitle: { ...T.h1, color: C.ink[900], textAlign: 'center' },
  stepSubtitle: { ...T.body, color: C.ink[500], textAlign: 'center', lineHeight: 24 },

  // Modo grid
  modoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  modoCard: {
    width: '47%',
    backgroundColor: C.ink[50],
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.ink[150],
    ...shadows.sm,
    position: 'relative',
  },
  modoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modoLabel: { ...T.h3, color: C.ink[800] },
  modoDesc: { ...T.small, color: C.ink[500], lineHeight: 16 },
  modoCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scan step
  scanIllustration: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: C.amber[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitList: { width: '100%', gap: 10, marginVertical: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: C.green[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { ...T.body, color: C.ink[700], flex: 1 },

  // Buttons
  primaryBtn: {
    backgroundColor: C.green[500],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    ...shadows.md,
  },
  primaryBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },
  secondaryBtn: { paddingVertical: 10 },
  secondaryBtnText: { ...T.body, color: C.ink[400], fontWeight: '600' },
});
