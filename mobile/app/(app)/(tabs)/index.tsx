import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, ImageBackground, AppState,
  FlatList, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useModoAlimentar, MODO_CORES } from '@/contexts/ModoAlimentarContext';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenTutorial from '@/components/ScreenTutorial';
import { useScreenTutorial } from '@/hooks/useScreenTutorial';
import { OnboardingAprendizadoModal } from '@/components/OnboardingAprendizadoModal';
import { DesafioCard, ReceitaDesafio } from '@/components/DesafioCard';
import * as SecureStore from 'expo-secure-store';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES, GC_TIMES } from '@/lib/queryClient';

// ─── tipos ────────────────────────────────────────────────────────────────────

interface Stats { alimentos: number; listas: number; }

interface ReceitaSimples {
  id: string;
  nome?: string;
  titulo?: string;
  imagem_url?: string;
  tempo_preparo?: string | number;
  dificuldade?: string;
  cobertura?: number;
  disponivel?: boolean;
  usa_vencendo?: string[];
}


function ehSexta() {
  return new Date().getDay() === 5;
}

// ─── constantes ───────────────────────────────────────────────────────────────

const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WARM_BG = '#FDFAF5';
const HERO_WIDTH = Dimensions.get('window').width - 40;

function nomeDaReceita(r: ReceitaSimples | null | undefined) {
  if (!r) return '';
  return r.titulo || r.nome || '';
}

// ─── tipos do carrossel ────────────────────────────────────────────────────────

interface HeroSlide {
  tipo: 'planejamento' | 'faz_agora' | 'urgente' | 'popular';
  receita: ReceitaSimples;
  pill: string;
  pillIcon: string;
  pillColor: string;
  cta: string;
  onPress: () => void;
}

// ─── Hero Carrossel ────────────────────────────────────────────────────────────

function HeroCarrossel({ slides, loading }: { slides: HeroSlide[]; loading: boolean }) {
  const [atual, setAtual] = useState(0);
  const flatListRef = useRef<FlatList<HeroSlide>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAtual(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: false });
  }, [slides.length]);

  const ir = useCallback((proximo: number) => {
    if (slides.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const idx = ((proximo % slides.length) + slides.length) % slides.length;
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    setAtual(idx);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setTimeout(() => {
      ir((atual + 1) % slides.length);
    }, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [atual, slides.length, ir]);

  if (loading) {
    return (
      <View style={styles.heroSkeleton}>
        <ActivityIndicator color={C.green[500]} />
      </View>
    );
  }

  if (slides.length === 0) {
    return (
      <TouchableOpacity style={styles.heroVazio} activeOpacity={0.85}>
        <View style={styles.heroVazioIcone}>
          <MaterialCommunityIcons name="fridge-outline" size={32} color={C.ink[400]} />
        </View>
        <Text style={styles.heroVazioTitulo}>Adicione ingredientes à despensa</Text>
        <Text style={styles.heroVazioSub}>A IA vai sugerir receitas com o que você tem em casa</Text>
      </TouchableOpacity>
    );
  }

  const n = slides.length;

  return (
    <View style={{ height: 340 }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        style={{ width: HERO_WIDTH, height: 340 }}
        getItemLayout={(_, index) => ({ length: HERO_WIDTH, offset: HERO_WIDTH * index, index })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_WIDTH);
          setAtual(idx);
        }}
        renderItem={({ item: slide }) => {
          const tempo = slide.receita.tempo_preparo
            ? `${slide.receita.tempo_preparo}${typeof slide.receita.tempo_preparo === 'number' ? ' min' : ''}`
            : null;
          return (
            <TouchableOpacity
              style={[styles.hero, { width: HERO_WIDTH }]}
              onPress={slide.onPress}
              activeOpacity={0.95}
            >
              {slide.receita.imagem_url ? (
                <ImageBackground
                  source={{ uri: slide.receita.imagem_url }}
                  style={styles.heroBg}
                  imageStyle={{ borderRadius: radius.xl }}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(10,7,3,0.55)', 'rgba(10,7,3,0.85)']}
                    locations={[0.38, 0.68, 1]}
                    style={styles.heroGradient}
                  />
                  <HeroConteudo slide={slide} tempo={tempo} />
                </ImageBackground>
              ) : (
                <View style={[styles.heroBg, styles.heroBgFallback]}>
                  <HeroConteudo slide={slide} tempo={tempo} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {n > 1 && (
        <>
          <TouchableOpacity
            style={[styles.heroArrow, styles.heroArrowLeft]}
            onPress={() => ir((atual - 1 + n) % n)}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color={C.ink[0]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroArrow, styles.heroArrowRight]}
            onPress={() => ir((atual + 1) % n)}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color={C.ink[0]} />
          </TouchableOpacity>
        </>
      )}

      {n > 1 && (
        <View style={styles.heroDotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.heroDot, i === atual && styles.heroDotAtivo]} />
          ))}
        </View>
      )}
    </View>
  );
}

function HeroConteudo({ slide, tempo }: { slide: HeroSlide; tempo: string | null }) {
  return (
    <>
      <View style={styles.heroPillRow}>
        <View style={[styles.heroPill, { backgroundColor: slide.pillColor }]}>
          <MaterialCommunityIcons name={slide.pillIcon as any} size={12} color={C.ink[900]} />
          <Text style={styles.heroPillTxt}>{slide.pill}</Text>
        </View>
      </View>

      <View style={styles.heroBase}>
        <Text style={styles.heroNome} numberOfLines={2}>{nomeDaReceita(slide.receita)}</Text>
        <View style={styles.heroMeta}>
          {tempo ? (
            <View style={styles.heroMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaTxt}>{tempo}</Text>
            </View>
          ) : null}
          {slide.receita.dificuldade ? (
            <View style={styles.heroMetaItem}>
              <MaterialCommunityIcons name="signal-cellular-2" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaTxt}>{slide.receita.dificuldade}</Text>
            </View>
          ) : null}
          {slide.tipo === 'popular' && (slide.receita as any).vezes_executada > 0 && (
            <View style={styles.heroMetaItem}>
              <MaterialCommunityIcons name="fire" size={13} color={C.amber[200]} />
              <Text style={[styles.heroMetaTxt, { color: C.amber[200] }]}>
                {(slide.receita as any).vezes_executada}x feita
              </Text>
            </View>
          )}
          {slide.receita.disponivel && (
            <View style={styles.heroMetaItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={13} color={C.green[200]} />
              <Text style={[styles.heroMetaTxt, { color: C.green[200] }]}>Tem tudo</Text>
            </View>
          )}
        </View>
        <View style={styles.heroCta}>
          <MaterialCommunityIcons name="chef-hat" size={18} color={C.ink[900]} />
          <Text style={styles.heroCtaTxt}>{slide.cta}</Text>
        </View>
      </View>
    </>
  );
}

// ─── Chip de ação rápida ──────────────────────────────────────────────────────


// ─── Card de sugestão ─────────────────────────────────────────────────────────

function SugestaoCard({ receita, onPress, favoritado, onToggleFavorito }: {
  receita: ReceitaSimples;
  onPress: () => void;
  favoritado?: boolean;
  onToggleFavorito?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const cobertura = receita.cobertura ?? 0;
  const coberturaColor = cobertura >= 80 ? C.green[600] : C.amber[600];
  const barraColor = cobertura >= 80 ? C.green[500] : C.amber[500];
  const temImagem = !!receita.imagem_url && !imageError;

  return (
    <TouchableOpacity style={styles.sugestaoCard} onPress={onPress} activeOpacity={0.8}>
      <View style={{ position: 'relative' }}>
        {temImagem ? (
          <Image source={{ uri: receita.imagem_url }} style={styles.sugestaoImg} onError={() => setImageError(true)} />
        ) : (
          <View style={[styles.sugestaoImg, styles.sugestaoImgFallback]}>
            <MaterialCommunityIcons name="chef-hat" size={22} color={C.ink[300]} />
          </View>
        )}
        {onToggleFavorito && (
          <TouchableOpacity
            style={[styles.cardHeartBtn, !temImagem && { backgroundColor: 'transparent' }]}
            onPress={onToggleFavorito}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={16}
              color={favoritado ? C.red[500] : (temImagem ? C.ink[0] : C.ink[400])}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sugestaoBody}>
        <Text style={styles.sugestaoNome} numberOfLines={2}>{nomeDaReceita(receita)}</Text>
        <View style={styles.sugestaoMeta}>
          {receita.tempo_preparo ? (
            <View style={styles.sugestaoMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={11} color={C.ink[400]} />
              <Text style={styles.sugestaoMetaTxt}>
                {receita.tempo_preparo}{typeof receita.tempo_preparo === 'number' ? 'min' : ''}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.sugestaoCobertura, { color: coberturaColor }]}>
            {cobertura >= 100 ? '✓ tudo' : `${cobertura}%`}
          </Text>
        </View>
        {/* barra de cobertura */}
        <View style={styles.sugesataoBarra}>
          <View style={[styles.sugestaoBarraFill, { width: `${Math.min(cobertura, 100)}%` as any, backgroundColor: barraColor }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Card "Faça antes que estrague" ──────────────────────────────────────────

function UrgentCard({ receita, onPress, favoritado, onToggleFavorito }: {
  receita: ReceitaSimples & { usa_vencendo?: string[] };
  onPress: () => void;
  favoritado?: boolean;
  onToggleFavorito?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const ingrediente = (receita as any).usa_vencendo?.[0] || '';
  const temImagem = !!receita.imagem_url && !imageError;

  return (
    <TouchableOpacity style={styles.urgentCard} onPress={onPress} activeOpacity={0.8}>
      <View style={{ position: 'relative' }}>
        {/* Badge de alerta no canto */}
        <View style={styles.urgentBadge}>
          <MaterialCommunityIcons name="clock-alert-outline" size={11} color={C.ink[0]} />
          <Text style={styles.urgentBadgeTxt}>Usa {ingrediente}</Text>
        </View>

        {temImagem ? (
          <Image source={{ uri: receita.imagem_url }} style={styles.urgentImg} onError={() => setImageError(true)} />
        ) : (
          <View style={[styles.urgentImg, styles.urgentImgFallback]}>
            <MaterialCommunityIcons name="chef-hat" size={22} color={C.amber[400]} />
          </View>
        )}

        {onToggleFavorito && (
          <TouchableOpacity
            style={[styles.cardHeartBtn, !temImagem && { backgroundColor: 'transparent' }]}
            onPress={onToggleFavorito}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={16}
              color={favoritado ? C.red[500] : (temImagem ? C.ink[0] : C.ink[400])}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.urgentBody}>
        <Text style={styles.urgentNome} numberOfLines={2}>{nomeDaReceita(receita)}</Text>
        <View style={styles.urgentMeta}>
          {receita.tempo_preparo ? (
            <View style={styles.sugestaoMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={11} color={C.amber[600]} />
              <Text style={[styles.sugestaoMetaTxt, { color: C.amber[700] }]}>
                {receita.tempo_preparo}{typeof receita.tempo_preparo === 'number' ? 'min' : ''}
              </Text>
            </View>
          ) : null}
          <Text style={styles.urgentCobertura}>
            {(receita.cobertura ?? 0) >= 100 ? '✓ tudo' : `${receita.cobertura ?? 0}%`}
          </Text>
        </View>
        {/* barra âmbar */}
        <View style={styles.sugesataoBarra}>
          <View style={[styles.sugestaoBarraFill, {
            width: `${Math.min(receita.cobertura ?? 0, 100)}%` as any,
            backgroundColor: C.amber[500],
          }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { modoAlimentar, setModoAlimentar: setModoCtx } = useModoAlimentar();
  const { showTutorial, dismissTutorial } = useScreenTutorial('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tipoRefeicao, setTipoRefeicao] = useState<string>('almoco');
  const [planoFree, setPlanoFree] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_aprendizado_seen').then(val => {
      if (!val) setShowOnboarding(true);
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    api.get('/stripe/status').then(r => {
      setPlanoFree((r.data?.plano ?? 'free').toLowerCase() === 'free');
    }).catch(() => {});
  }, []));

  const dismissOnboarding = async () => {
    setShowOnboarding(false);
    await SecureStore.setItemAsync('onboarding_aprendizado_seen', '1').catch(() => {});
  };

  // ─── Queries ──────────────────────────────────────────────────────────────────

  const { data: inventarioData, isFetching: loadingInv } = useQuery({
    queryKey: queryKeys.inventario(),
    queryFn: () => api.get('/inventario').then(r => r.data?.produtos || r.data?.data || []),
    staleTime: STALE_TIMES.inventario,
    gcTime: GC_TIMES.inventario,
  });

  const { data: listasData } = useQuery({
    queryKey: queryKeys.listas(),
    queryFn: () => api.get('/listas').then(r => r.data?.listas || r.data || []),
    staleTime: STALE_TIMES.listas,
    gcTime: GC_TIMES.listas,
  });

  const { data: planejamentoHoje } = useQuery({
    queryKey: queryKeys.planejamentoHoje(),
    queryFn: () => api.get('/planejamento/hoje').then(r => r.data?.item ?? null),
    staleTime: STALE_TIMES.planejamento,
    gcTime: GC_TIMES.planejamento,
  });

  const { data: receitasData, isFetching: loadingReceitas } = useQuery({
    queryKey: queryKeys.receitasDisponiveis(modoAlimentar),
    queryFn: async () => {
      const r = await api.get('/receitas/disponiveis');
      const modoApi = r.data?.modo_alimentar;
      if (modoApi) setModoCtx(modoApi);
      return r.data;
    },
    staleTime: STALE_TIMES.receitas_lista,
    gcTime: GC_TIMES.receitas_lista,
  });

  const { data: maisfeitaData } = useQuery({
    queryKey: queryKeys.receitaMaisFeita(),
    queryFn: () => api.get('/receitas/mais-feita-hoje').then(r => r.data?.receita || r.data || null),
    staleTime: STALE_TIMES.receitas_lista,
    gcTime: GC_TIMES.receitas_lista,
  });

  const { data: favoritasData } = useQuery({
    queryKey: queryKeys.receitasFavoritas(),
    // Array.isArray: resposta de erro (401/403 etc) vira objeto e .map explode
    queryFn: () => api.get('/receitas/favoritas').then(r => (Array.isArray(r.data) ? r.data : []) as { id: string }[]),
    staleTime: STALE_TIMES.favoritas,
    gcTime: GC_TIMES.favoritas,
  });

  const { data: paraMimData } = useQuery({
    queryKey: queryKeys.receitasSugestoesParaMim(),
    queryFn: () => api.get('/receitas/sugestoes/para-mim', {
      params: { modo_alimentar: modoAlimentar !== 'normal' ? modoAlimentar : undefined },
    }).then(r => (Array.isArray(r.data) ? r.data : [])),
    staleTime: STALE_TIMES.receitas_lista,
    gcTime: GC_TIMES.receitas_lista,
  });

  const { data: desafiosData } = useQuery({
    queryKey: queryKeys.receitasDesafios(),
    queryFn: () => api.get('/receitas/sugestoes/desafios').then(r => (Array.isArray(r.data) ? r.data : [])),
    staleTime: STALE_TIMES.receitas_lista,
    gcTime: GC_TIMES.receitas_lista,
  });

  const { data: notifData } = useQuery({
    queryKey: queryKeys.notificacoesContagem(),
    queryFn: () => api.get('/notificacoes-usuario/nao-lidas/contagem').then(r => r.data?.total ?? 0),
    staleTime: STALE_TIMES.notificacoes,
    gcTime: GC_TIMES.notificacoes,
  });

  // Recentes: endpoint pode não existir (404 ignorado)
  const { data: recentesData } = useQuery({
    queryKey: queryKeys.receitasExecutadasRecentes(),
    queryFn: () => api.get('/receitas/executadas').then(r => {
      const lista: any[] = r.data?.receitas || r.data || [];
      // /executadas retorna 1 linha por execução — a mesma receita feita N vezes
      // aparece N vezes. Deduplica por id (mantém a 1ª/mais recente) para não
      // gerar keys repetidas no render.
      const vistos = new Set<string>();
      const unicas: ReceitaSimples[] = [];
      for (const e of lista) {
        const receita = e.receita || e;
        if (!receita?.id || vistos.has(receita.id)) continue;
        vistos.add(receita.id);
        unicas.push(receita);
        if (unicas.length >= 6) break;
      }
      return unicas;
    }),
    staleTime: STALE_TIMES.historico,
    gcTime: GC_TIMES.historico,
    retry: false,
  });

  // Sextou — só carrega na sexta
  const { data: sextouData } = useQuery({
    queryKey: ['receitas', 'sextou'],
    queryFn: () => api.get('/receitas/disponiveis', {
      params: { tags: 'petisco,pizza,boteco,churrasco', limit: 6 },
    }).then(r => (r.data?.receitas || r.data || []).slice(0, 6) as ReceitaSimples[]),
    enabled: ehSexta(),
    staleTime: STALE_TIMES.receitas_lista,
    gcTime: GC_TIMES.receitas_lista,
  });

  // Derivações a partir dos dados
  const loading = loadingInv || loadingReceitas;
  const naoLidas: number = notifData ?? 0;
  const maisFeita: ReceitaSimples | null = maisfeitaData?.id ? maisfeitaData : null;
  const escolhidos: ReceitaSimples[] = paraMimData ?? [];
  const desafios: ReceitaDesafio[] = desafiosData ?? [];
  // Dedup também aqui (não só no queryFn) — cache persistido pode conter a lista
  // antiga com ids repetidos; garante keys únicas no render independente da fonte.
  const recentes: ReceitaSimples[] = (() => {
    const vistos = new Set<string>();
    return (recentesData ?? []).filter((r) => {
      if (!r?.id || vistos.has(r.id)) return false;
      vistos.add(r.id);
      return true;
    });
  })();
  const sextou: ReceitaSimples[] = sextouData ?? [];

  const receitaDoDia = useMemo(() => planejamentoHoje?.receita ?? null, [planejamentoHoje]);

  useEffect(() => {
    if (planejamentoHoje?.tipo_refeicao) setTipoRefeicao(planejamentoHoje.tipo_refeicao);
  }, [planejamentoHoje]);

  const todasReceitas: any[] = receitasData?.receitas || [];
  const urgentes: ReceitaSimples[] = useMemo(() =>
    todasReceitas
      .filter((r: any) => r.usa_vencendo && r.usa_vencendo.length > 0)
      .sort((a: any, b: any) => (b.cobertura || 0) - (a.cobertura || 0))
      .slice(0, 6),
  [todasReceitas]);

  const sugestoes: ReceitaSimples[] = useMemo(() =>
    [...todasReceitas]
      .filter((r: any) => r.disponivel)
      .sort((a: any, b: any) => (b.cobertura || 0) - (a.cobertura || 0))
      .slice(0, 5),
  [todasReceitas]);

  const stats: Stats = useMemo(() => ({
    alimentos: (Array.isArray(inventarioData) ? inventarioData : []).filter((p: any) => p.ingrediente_receita !== false).length,
    listas: (Array.isArray(listasData) ? listasData : []).filter((l: any) => l.status === 'ativa').length,
  }), [inventarioData, listasData]);

  const favoritosIds = useMemo(
    () => new Set((Array.isArray(favoritasData) ? favoritasData : []).map((r: { id: string }) => r.id)),
    [favoritasData],
  );

  // Invalida queries ao focar
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
    queryClient.invalidateQueries({ queryKey: queryKeys.planejamentoHoje() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notificacoesContagem() });
  }, [modoAlimentar]));

  // Invalida quando app volta do background
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
        queryClient.invalidateQueries({ queryKey: queryKeys.planejamentoHoje() });
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [modoAlimentar]);

  const toggleFavorito = async (receitaId: string) => {
    const prev = queryClient.getQueryData<{ id: string }[]>(queryKeys.receitasFavoritas()) ?? [];
    const isFav = prev.some(r => r.id === receitaId);
    queryClient.setQueryData<{ id: string }[]>(
      queryKeys.receitasFavoritas(),
      isFav ? prev.filter(r => r.id !== receitaId) : [...prev, { id: receitaId }],
    );
    try {
      await api.post(`/receitas/${receitaId}/favoritar`);
    } catch {
      queryClient.setQueryData(queryKeys.receitasFavoritas(), prev);
    }
  };

  const primeiroNome = (user?.nome || user?.email || '?').split(' ')[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const TIPO_REFEICAO_LABEL: Record<string, string> = {
    cafe: 'Café da manhã', almoco: 'Almoço', lanche: 'Lanche', jantar: 'Jantar',
  };
  const diaAbrev = DIAS_ABREV[new Date().getDay()];

  const slides: HeroSlide[] = [];

  if (receitaDoDia) {
    slides.push({
      tipo: 'planejamento',
      receita: receitaDoDia,
      pill: `${TIPO_REFEICAO_LABEL[tipoRefeicao] || 'Hoje'} · ${diaAbrev}`,
      pillIcon: 'calendar-check',
      pillColor: C.amber[400],
      cta: 'Começar a cozinhar',
      onPress: () => router.push('/(app)/(tabs)/semana' as any),
    });
  }

  if (urgentes[0]) {
    const ingrediente = urgentes[0].usa_vencendo?.[0] || '';
    slides.push({
      tipo: 'urgente',
      receita: urgentes[0],
      pill: `Usa ${ingrediente} · vencendo`,
      pillIcon: 'clock-alert-outline',
      pillColor: C.red[500],
      cta: 'Fazer agora',
      onPress: () => router.push({ pathname: '/(app)/receita/[id]', params: { id: urgentes[0].id, dados: JSON.stringify(urgentes[0]) } } as any),
    });
  }

  if (sugestoes[0] && sugestoes[0].id !== receitaDoDia?.id) {
    slides.push({
      tipo: 'faz_agora',
      receita: sugestoes[0],
      pill: sugestoes[0].disponivel ? '✓ Tem tudo' : `${sugestoes[0].cobertura ?? 0}% dos ingredientes`,
      pillIcon: sugestoes[0].disponivel ? 'check-circle-outline' : 'fridge-outline',
      pillColor: sugestoes[0].disponivel ? C.green[500] : C.ink[300],
      cta: sugestoes[0].disponivel ? 'Cozinhar agora' : 'Ver receita',
      onPress: () => router.push({ pathname: '/(app)/receita/[id]', params: { id: sugestoes[0].id, dados: JSON.stringify(sugestoes[0]) } } as any),
    });
  }

  if (maisFeita && sugestoes.length > 0) {
    slides.push({
      tipo: 'popular',
      receita: maisFeita,
      pill: 'Mais feita pela comunidade',
      pillIcon: 'fire',
      pillColor: C.amber[500],
      cta: 'Fazer também',
      onPress: () => router.push({ pathname: '/(app)/receita/[id]', params: { id: maisFeita.id, dados: JSON.stringify(maisFeita) } } as any),
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saudacaoTxt}>{saudacao},</Text>
            <Text style={styles.nomeTxt}>{primeiroNome} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            {urgentes.length > 0 && (
              <TouchableOpacity
                style={[styles.bellBtn, styles.alertBtn]}
                onPress={() => router.push('/(app)/vencendo' as any)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="clock-alert-outline" size={20} color={C.amber[700]} />
                <View style={[styles.bellBadge, { backgroundColor: C.amber[500] }]}>
                  <Text style={styles.bellBadgeTxt}>{urgentes.length > 9 ? '9+' : urgentes.length}</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => router.push('/(app)/notificacoes' as any)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={C.ink[700]} />
              {naoLidas > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeTxt}>{naoLidas > 9 ? '9+' : naoLidas}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Badge modo alimentar ativo */}
        {(() => {
          const MODO_LABEL: Record<string, string> = { normal: 'Modo Padrão', fitness: 'Modo Fitness', vegetariano: 'Modo Vegetariano', vegano: 'Modo Vegano' };
          const MODO_ICON: Record<string, string> = { normal: 'food-variant', fitness: 'dumbbell', vegetariano: 'leaf', vegano: 'sprout' };
          const cor = MODO_CORES[modoAlimentar as keyof typeof MODO_CORES];
          return (
            <TouchableOpacity
              style={[styles.modoBadge, { borderColor: cor + '50', backgroundColor: cor + '12' }]}
              onPress={() => router.push('/(app)/settings' as any)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={MODO_ICON[modoAlimentar] as any} size={13} color={cor} />
              <Text style={[styles.modoBadgeTxt, { color: cor }]}>{MODO_LABEL[modoAlimentar]}</Text>
              <MaterialCommunityIcons name="pencil-outline" size={12} color={cor + '99'} />
            </TouchableOpacity>
          );
        })()}

        {/* Banner upgrade — só free */}
        {planoFree && (
          <TouchableOpacity
            style={styles.bannerUpgrade}
            onPress={() => router.push('/(app)/planos' as any)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="star-circle" size={18} color="#7C3AED" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerUpgradeTitulo}>Desbloqueie o CookMe completo</Text>
              <Text style={styles.bannerUpgradeSub}>Scans ilimitados · IA · Importar receitas</Text>
            </View>
            <View style={styles.bannerUpgradeBtn}>
              <Text style={styles.bannerUpgradeBtnTxt}>Ver planos</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* contexto discreto */}
        {!loading && (
          <Text style={styles.contextoTxt}>
            {stats.alimentos} ingredientes na despensa
            {stats.listas > 0 ? ` · ${stats.listas} lista${stats.listas > 1 ? 's' : ''} ativa${stats.listas > 1 ? 's' : ''}` : ''}
          </Text>
        )}

        {/* ── Hero Carrossel ──────────────────────────────────────────────── */}
        <View style={styles.secao}>
          <HeroCarrossel slides={slides} loading={loading} />
        </View>

        {/* ── Próximos da validade ─────────────────────────────────────────── */}
        {urgentes.length > 0 && (
          <>
            <View style={styles.separador} />
            <View style={styles.secaoTitulo}>
              <View>
                <Text style={[styles.secaoTituloTxt, { color: C.amber[800] }]}>Faça antes que estrague</Text>
                <Text style={styles.secaoSubTxt}>Ingredientes perto da validade</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/receitas')} activeOpacity={0.7}>
                <Text style={[styles.verTodas, { color: C.amber[700] }]}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sugestoesScroll}
            >
              {urgentes.map(r => (
                <UrgentCard
                  key={`urg-${r.id}`}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Sugestões para hoje ──────────────────────────────────────────── */}
        {sugestoes.length > 0 && (
          <>
            <View style={styles.separador} />
            <View style={styles.secaoTitulo}>
              <View>
                <Text style={styles.secaoTituloTxt}>Dá pra fazer agora</Text>
                <Text style={styles.secaoSubTxt}>Com o que você já tem em casa</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/receitas')} activeOpacity={0.7}>
                <Text style={styles.verTodas}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sugestoesScroll}
            >
              {sugestoes.map(r => (
                <SugestaoCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Escolhido para você ──────────────────────────────────────────── */}
        {escolhidos.length > 0 && (
          <>
            <View style={styles.separador} />
            <View style={styles.secaoTitulo}>
              <View>
                <Text style={styles.secaoTituloTxt}>Escolhido para você</Text>
                <Text style={styles.secaoSubTxt}>Com base nos seus gostos</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/receitas')} activeOpacity={0.7}>
                <Text style={styles.verTodas}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sugestoesScroll}>
              {escolhidos.map(r => (
                <SugestaoCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Sextou! (só aparece na sexta-feira) ─────────────────────────── */}
        {ehSexta() && sextou.length > 0 && (
          <>
            <View style={styles.separador} />
            <View style={styles.secaoTitulo}>
              <View>
                <Text style={[styles.secaoTituloTxt, { color: C.amber[800] }]}>Sextou! 🍺</Text>
                <Text style={styles.secaoSubTxt}>Petiscos, pizzas e comida de buteco</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sugestoesScroll}>
              {sextou.map(r => (
                <SugestaoCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Recentes ────────────────────────────────────────────────────── */}
        {recentes.length > 0 && (
          <>
            <View style={styles.separador} />
            <View style={styles.secaoTitulo}>
              <View>
                <Text style={styles.secaoTituloTxt}>Recentes</Text>
                <Text style={styles.secaoSubTxt}>O que você fez por último</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/receitas-feitas' as any)} activeOpacity={0.7}>
                <Text style={styles.verTodas}>Ver histórico</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sugestoesScroll}>
              {recentes.map(r => (
                <SugestaoCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Desafios ─────────────────────────────────────────────────────── */}
        {desafios.length > 0 && (
          <>
            <View style={styles.separador} />
            <View style={styles.secaoTitulo}>
              <View>
                <Text style={[styles.secaoTituloTxt, { color: C.amber[800] }]}>Desafios 🏆</Text>
                <Text style={styles.secaoSubTxt}>Receitas novas que você pode tentar</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sugestoesScroll}>
              {desafios.map(r => (
                <DesafioCard
                  key={r.id}
                  receita={r}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                  onComprar={() => router.push('/(app)/compras' as any)}
                />
              ))}
            </ScrollView>
          </>
        )}

      </ScrollView>

      <OnboardingAprendizadoModal
        visible={showOnboarding}
        onDismiss={dismissOnboarding}
      />

      <ScreenTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        steps={[
          { icon: 'home-heart', title: 'Bem-vindo ao CookMe!', description: 'Aqui você vê um resumo do seu inventário, receitas em destaque e alertas de ingredientes vencendo.' },
          { icon: 'food-apple', title: 'Receitas sugeridas', description: 'Receitas baseadas no que você tem em casa aparecem aqui. Toque para ver detalhes e cozinhar.' },
          { icon: 'qrcode-scan', title: 'Ações rápidas', description: 'Use a barra inferior para escanear cupom fiscal ou acessar suas compras rapidamente.' },
        ]}
      />
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WARM_BG },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 2,
  },
  saudacaoTxt: { ...T.small, color: C.ink[500] },
  nomeTxt: { fontSize: 24, fontWeight: '800', color: C.ink[900], letterSpacing: -0.4, marginTop: -1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.ink[0], alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  alertBtn: { backgroundColor: C.amber[50], borderWidth: 1, borderColor: C.amber[200] },
  bellBadge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: C.red[500], alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.ink[0],
  },
  bellBadgeTxt: { fontSize: 9, fontWeight: '800', color: C.ink[0] },
  modoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginHorizontal: 20, marginBottom: 10,
    borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  modoBadgeTxt: { ...T.small, fontWeight: '700' },
  contextoTxt: { ...T.small, color: C.ink[500], paddingHorizontal: 20, paddingBottom: 16 },

  // Banner upgrade
  bannerUpgrade: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#F5F3FF', borderRadius: radius.lg,
    borderWidth: 1, borderColor: '#C4B5FD', padding: 12,
  },
  bannerUpgradeTitulo: { ...T.small, fontWeight: '700', color: '#5B21B6' },
  bannerUpgradeSub: { ...T.micro, color: '#7C3AED', marginTop: 1 },
  bannerUpgradeBtn: {
    backgroundColor: '#7C3AED', borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  bannerUpgradeBtnTxt: { ...T.micro, color: '#fff', fontWeight: '700' },

  // Separador entre seções
  separador: {
    height: 1, backgroundColor: C.ink[150],
    marginHorizontal: 20, marginBottom: 24,
  },

  // Seções
  secao: { paddingHorizontal: 20, marginBottom: 24 },
  secaoInner: { paddingHorizontal: 20, marginBottom: 8 },
  secaoTitulo: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  secaoTituloTxt: { ...T.h3, color: C.ink[900] },
  secaoSubTxt: { ...T.small, color: C.ink[500], marginTop: 2 },
  verTodas: { ...T.small, color: C.green[600], fontWeight: '700' },

  // Hero dots (dentro do card)
  heroDotsRow: {
    position: 'absolute', bottom: 16, right: 18,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  heroDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  heroDotAtivo: {
    width: 18, backgroundColor: C.ink[0],
  },

  // Hero setas
  heroArrow: {
    position: 'absolute', top: 0, bottom: 0,
    width: 48, justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  heroArrowLeft: { left: 0 },
  heroArrowRight: { right: 0 },

  // Skeleton
  heroSkeleton: {
    height: 340, borderRadius: radius.xl,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },

  // Hero com receita
  hero: {
    height: 340, borderRadius: radius.xl, overflow: 'hidden',
    shadowColor: '#3A2A14',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  heroBg: { flex: 1 },
  heroBgFallback: {
    backgroundColor: C.ink[200],
    alignItems: 'center', justifyContent: 'center',
  },
  heroGradient: { ...StyleSheet.absoluteFillObject },

  heroPillRow: { position: 'absolute', top: 16, left: 16, right: 16 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    height: 30, paddingHorizontal: 12, borderRadius: radius.pill,
    backgroundColor: C.amber[500],
  },
  heroPillTxt: { fontSize: 12, fontWeight: '700', color: C.ink[900], letterSpacing: -0.1 },

  heroBase: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 },
  heroNome: {
    fontSize: 28, fontWeight: '800', color: C.ink[0],
    letterSpacing: -0.5, lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  heroMeta: { flexDirection: 'row', gap: 14, marginTop: 10, marginBottom: 14, flexWrap: 'wrap' },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaTxt: {
    fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.92)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroCta: {
    height: 50, paddingHorizontal: 20, borderRadius: radius.md,
    backgroundColor: C.ink[0], alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 6,
  },
  heroCtaTxt: { fontSize: 15, fontWeight: '700', color: C.ink[900] },

  // Hero vazio
  heroVazio: {
    height: 200, borderRadius: radius.xl,
    backgroundColor: C.ink[0],
    borderWidth: 1, borderColor: C.ink[150],
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 8,
    ...shadows.sm,
  },
  heroVazioIcone: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroVazioTitulo: { ...T.h3, color: C.ink[700], textAlign: 'center' },
  heroVazioSub: { ...T.small, color: C.ink[400], textAlign: 'center', lineHeight: 18 },
  heroVazioCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroVazioCtaTxt: { ...T.small, color: C.green[600], fontWeight: '700' },


  // Sugestões carrossel
  sugestoesScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  sugestaoCard: {
    width: 164, backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150],
    overflow: 'hidden', ...shadows.sm,
  },
  sugestaoImg: { width: '100%', height: 116 },
  sugestaoImgFallback: {
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  sugestaoBody: { padding: 10 },
  sugestaoNome: { fontSize: 13, fontWeight: '600', color: C.ink[900], lineHeight: 17, marginBottom: 6 },
  sugestaoMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sugestaoMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sugestaoMetaTxt: { fontSize: 11, color: C.ink[400] },
  sugestaoCobertura: { fontSize: 11, fontWeight: '700' },
  sugesataoBarra: {
    height: 4, backgroundColor: C.ink[150], borderRadius: 2, overflow: 'hidden',
  },
  sugestaoBarraFill: { height: '100%', borderRadius: 2 },

  // Urgent card
  urgentCard: {
    width: 164, backgroundColor: C.amber[50], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.amber[200],
    overflow: 'hidden', ...shadows.sm,
  },
  cardHeartBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  urgentBadge: {
    position: 'absolute', top: 8, left: 8, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.amber[500], borderRadius: radius.pill,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  urgentBadgeTxt: { fontSize: 10, fontWeight: '700', color: C.ink[0] },
  urgentImg: { width: '100%', height: 116 },
  urgentImgFallback: {
    backgroundColor: C.amber[100], alignItems: 'center', justifyContent: 'center',
  },
  urgentBody: { padding: 10 },
  urgentNome: { fontSize: 13, fontWeight: '600', color: C.amber[900], lineHeight: 17, marginBottom: 6 },
  urgentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  urgentCobertura: { fontSize: 11, fontWeight: '700', color: C.amber[700] },

  // Despensa
  despensaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: radius.lg,
    backgroundColor: C.ink[0], borderWidth: 1, borderColor: C.ink[150],
    ...shadows.sm,
  },
  despensaIcone: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center',
  },
  despensaTitulo: { ...T.h3, fontSize: 14, color: C.ink[900] },
  despensaSub: { ...T.small, color: C.ink[500], marginTop: 1 },
});
