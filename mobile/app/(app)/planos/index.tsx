import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import api from '@/services/api';

// ─── tipos ───────────────────────────────────────────────────────────────────

type PlanoId = 'premium_mensal' | 'premium_anual' | 'familia';

interface StatusAssinatura {
  plano: string;
  status: string;
  stripe_customer_id?: string;
  featuresDesbloqueadas: string[];
  uso?: { scans_mes: number; limite_scans: number };
}

// ─── features por plano ───────────────────────────────────────────────────────

const PLANOS = [
  {
    id: 'premium_mensal' as PlanoId,
    nome: 'Premium',
    preco: 'R$14,90',
    periodo: '/mês',
    destaque: false,
    cor: C.green[600],
    corBg: C.green[50],
    icone: 'star-outline' as const,
    features: [
      'Scans de nota fiscal ilimitados',
      'Receitas IA personalizadas',
      'Planejamento semanal completo',
      'Importar receitas de qualquer site',
      'Histórico de compras e análises',
      'Suporte prioritário',
    ],
  },
  {
    id: 'premium_anual' as PlanoId,
    nome: 'Premium Anual',
    preco: 'R$99',
    periodo: '/ano',
    destaque: true,
    economia: 'Economize R$80',
    cor: '#7C3AED',
    corBg: '#EDE9FE',
    icone: 'star-circle' as const,
    features: [
      'Tudo do Premium mensal',
      'Melhor custo-benefício',
      '2 meses grátis vs mensal',
      'Acesso a features beta',
    ],
  },
  {
    id: 'familia' as PlanoId,
    nome: 'Família',
    preco: 'R$19,90',
    periodo: '/mês',
    destaque: false,
    cor: '#D97706',
    corBg: '#FEF3C7',
    icone: 'account-group-outline' as const,
    features: [
      'Até 5 membros da família',
      'Despensas separadas por membro',
      'Lista de compras compartilhada',
      'Planejamento semanal por membro',
      'Tudo do Premium',
    ],
  },
];

const FEATURES_FREE = [
  '3 scans de nota fiscal por mês',
  'Receitas básicas do banco CookMe',
  'Despensa e inventário',
  'Planejamento básico (7 dias)',
];

// ─── screen ───────────────────────────────────────────────────────────────────

export default function PlanosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ origem?: string; feature?: string; checkout?: string }>();

  const [status, setStatus] = useState<StatusAssinatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [assinando, setAssinando] = useState<PlanoId | null>(null);
  const [abrindoPortal, setAbrindoPortal] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState<'success' | 'cancelled' | null>(null);

  const carregarStatus = useCallback(async () => {
    try {
      const res = await api.get('/stripe/status');
      setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Recarrega ao focar a tela (volta do checkout, do portal, etc.)
  useFocusEffect(useCallback(() => {
    carregarStatus();
    queryClient.invalidateQueries({ queryKey: ['stripe-status'] });
  }, [carregarStatus, queryClient]));

  // Retorno do Stripe Checkout via deep link cookme://planos?checkout=success
  useEffect(() => {
    if (params.checkout === 'success') {
      setCheckoutFeedback('success');
      carregarStatus();
      queryClient.invalidateQueries({ queryKey: ['stripe-status'] });
    } else if (params.checkout === 'cancelled') {
      setCheckoutFeedback('cancelled');
    }
  }, [params.checkout]);

  const handleAssinar = async (plano: PlanoId) => {
    setAssinando(plano);
    try {
      const successUrl = ExpoLinking.createURL('planos', { queryParams: { checkout: 'success' } });
      const cancelUrl  = ExpoLinking.createURL('planos', { queryParams: { checkout: 'cancelled' } });
      const res = await api.post('/stripe/checkout', { plano, successUrl, cancelUrl });
      const url: string = res.data?.url;
      if (!url) throw new Error('URL de checkout não retornada');
      await Linking.openURL(url);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao iniciar pagamento';
      Alert.alert('Erro', msg);
    } finally {
      setAssinando(null);
    }
  };

  const handlePortal = async () => {
    setAbrindoPortal(true);
    try {
      const res = await api.post('/stripe/portal');
      await Linking.openURL(res.data.url);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Portal indisponível. Contate o suporte.');
    } finally {
      setAbrindoPortal(false);
    }
  };

  const planoAtual = status?.plano?.toLowerCase() ?? 'free';
  const isPremium = planoAtual !== 'free';

  if (carregando) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.green[600]} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planos CookMe</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Feedback pós-checkout */}
        {checkoutFeedback === 'success' && (
          <View style={styles.feedbackSuccess}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#059669" />
            <Text style={styles.feedbackTxt}>Assinatura ativada com sucesso! Bem-vindo ao Premium 🎉</Text>
          </View>
        )}
        {checkoutFeedback === 'cancelled' && (
          <View style={styles.feedbackCancelled}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.feedbackTxt}>Pagamento cancelado. Você pode tentar novamente quando quiser.</Text>
          </View>
        )}

        {/* Hero */}
        <View style={styles.hero}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={40} color={C.green[600]} />
          <Text style={styles.heroTitulo}>Cozinhe mais inteligente</Text>
          <Text style={styles.heroSub}>
            Digitalize suas compras, gerencie sua despensa e receba receitas personalizadas por IA.
          </Text>
        </View>

        {/* Banner plano atual */}
        {isPremium && (
          <View style={styles.bannerAtual}>
            <MaterialCommunityIcons name="check-circle" size={18} color={C.green[600]} />
            <Text style={styles.bannerAtualTxt}>
              Plano atual: <Text style={{ fontWeight: '700' }}>{planoAtual.replace('_', ' ').toUpperCase()}</Text>
            </Text>
          </View>
        )}

        {/* Card FREE */}
        <View style={[styles.card, planoAtual === 'free' && styles.cardAtivo]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.ink[100] }]}>
              <MaterialCommunityIcons name="account-outline" size={20} color={C.ink[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardNome}>Gratuito</Text>
              <Text style={styles.cardPreco}>R$0 <Text style={styles.cardPeriodo}>para sempre</Text></Text>
            </View>
            {planoAtual === 'free' && (
              <View style={styles.badgeAtual}><Text style={styles.badgeAtualTxt}>Atual</Text></View>
            )}
          </View>
          {FEATURES_FREE.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <MaterialCommunityIcons name="check" size={14} color={C.ink[500]} />
              <Text style={[styles.featureTxt, { color: C.ink[500] }]}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Cards pagos */}
        {PLANOS.map((plano) => {
          const ativo = planoAtual === plano.id || planoAtual === plano.id.replace('_mensal', '').replace('_anual', '');
          return (
            <View key={plano.id} style={[styles.card, plano.destaque && styles.cardDestaque, ativo && styles.cardAtivo]}>
              {plano.destaque && (
                <View style={[styles.destaqueBadge, { backgroundColor: plano.cor }]}>
                  <Text style={styles.destaqueBadgeTxt}>MELHOR VALOR</Text>
                </View>
              )}
              {'economia' in plano && plano.economia && !plano.destaque && (
                <View style={[styles.destaqueBadge, { backgroundColor: plano.cor }]}>
                  <Text style={styles.destaqueBadgeTxt}>{plano.economia}</Text>
                </View>
              )}
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrap, { backgroundColor: plano.corBg }]}>
                  <MaterialCommunityIcons name={plano.icone} size={20} color={plano.cor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNome}>{plano.nome}</Text>
                  <Text style={styles.cardPreco}>
                    {plano.preco} <Text style={styles.cardPeriodo}>{plano.periodo}</Text>
                  </Text>
                </View>
                {ativo && (
                  <View style={styles.badgeAtual}><Text style={styles.badgeAtualTxt}>Atual</Text></View>
                )}
              </View>

              {plano.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={14} color={plano.cor} />
                  <Text style={styles.featureTxt}>{f}</Text>
                </View>
              ))}

              {!ativo && (
                <TouchableOpacity
                  style={[styles.btnAssinar, { backgroundColor: plano.cor }, assinando === plano.id && { opacity: 0.7 }]}
                  onPress={() => handleAssinar(plano.id)}
                  disabled={assinando !== null}
                  activeOpacity={0.85}
                >
                  {assinando === plano.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.btnAssinarTxt}>Assinar {plano.nome}</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Gerenciar assinatura (só para premium) */}
        {isPremium && status?.stripe_customer_id && (
          <TouchableOpacity
            style={[styles.btnPortal, abrindoPortal && { opacity: 0.6 }]}
            onPress={handlePortal}
            disabled={abrindoPortal}
            activeOpacity={0.8}
          >
            {abrindoPortal
              ? <ActivityIndicator size="small" color={C.green[600]} />
              : <>
                  <MaterialCommunityIcons name="credit-card-outline" size={16} color={C.green[600]} />
                  <Text style={styles.btnPortalTxt}>Gerenciar assinatura / cancelar</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* Uso mensal */}
        {status?.uso && (
          <View style={styles.usoBox}>
            <Text style={styles.usoTitulo}>Uso este mês</Text>
            <View style={styles.usoRow}>
              <MaterialCommunityIcons name="camera-outline" size={16} color={C.ink[500]} />
              <Text style={styles.usoTxt}>
                Scans: <Text style={{ fontWeight: '700', color: C.ink[800] }}>{status.uso.scans_mes}</Text>
                {status.uso.limite_scans > 0 && ` / ${status.uso.limite_scans}`}
              </Text>
            </View>
          </View>
        )}

        {/* Garantias */}
        <View style={styles.garantias}>
          {[
            { icone: 'shield-check-outline' as const, txt: 'Pagamento seguro via Stripe' },
            { icone: 'cancel' as const, txt: 'Cancele quando quiser, sem multa' },
            { icone: 'refresh' as const, txt: 'Renovação automática, aviso por e-mail' },
          ].map((g, i) => (
            <View key={i} style={styles.garantiaRow}>
              <MaterialCommunityIcons name={g.icone} size={16} color={C.green[600]} />
              <Text style={styles.garantiaTxt}>{g.txt}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink[50] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  headerTitle: { ...T.h2, color: C.ink[900] },
  scroll: { padding: 16, gap: 12 },

  hero: {
    alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16,
    backgroundColor: C.ink[0], borderRadius: radius.xl, ...shadows.sm,
    borderWidth: 1, borderColor: C.ink[150], marginBottom: 4,
  },
  heroTitulo: { ...T.h2, color: C.ink[900], marginTop: 12, textAlign: 'center' },
  heroSub: { ...T.small, color: C.ink[500], textAlign: 'center', marginTop: 6 },

  feedbackSuccess: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#D1FAE5', borderRadius: radius.md, padding: 14, marginBottom: 12,
  },
  feedbackCancelled: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: 14, marginBottom: 12,
  },
  feedbackTxt: { ...T.small, color: C.ink[800], flex: 1 },

  bannerAtual: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200],
    borderRadius: radius.md, padding: 12,
  },
  bannerAtualTxt: { ...T.small, color: C.green[700] },

  card: {
    backgroundColor: C.ink[0], borderRadius: radius.xl,
    borderWidth: 1, borderColor: C.ink[150], padding: 20,
    ...shadows.sm, gap: 8,
  },
  cardDestaque: { borderColor: '#7C3AED', borderWidth: 2 },
  cardAtivo: { borderColor: C.green[400], borderWidth: 2 },

  destaqueBadge: {
    alignSelf: 'flex-start', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4,
  },
  destaqueBadgeTxt: { ...T.micro, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardNome: { ...T.body, fontWeight: '700', color: C.ink[900] },
  cardPreco: { ...T.h2, color: C.ink[900] },
  cardPeriodo: { ...T.small, color: C.ink[500], fontWeight: '400' },
  badgeAtual: {
    backgroundColor: C.green[100], borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeAtualTxt: { ...T.micro, color: C.green[700], fontWeight: '700' },

  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureTxt: { ...T.small, color: C.ink[700], flex: 1 },

  btnAssinar: {
    marginTop: 8, borderRadius: radius.lg,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  btnAssinarTxt: { ...T.body, color: '#fff', fontWeight: '700' },

  btnPortal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.green[400], borderRadius: radius.lg,
    paddingVertical: 14, backgroundColor: C.ink[0],
  },
  btnPortalTxt: { ...T.small, color: C.green[700], fontWeight: '700' },

  usoBox: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], padding: 16, gap: 8,
  },
  usoTitulo: { ...T.small, fontWeight: '700', color: C.ink[600] },
  usoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usoTxt: { ...T.small, color: C.ink[600] },

  garantias: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], padding: 16, gap: 10,
  },
  garantiaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  garantiaTxt: { ...T.small, color: C.ink[600], flex: 1 },
});
