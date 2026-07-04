import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Image, Alert, Modal, FlatList, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Animated, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useModoAlimentar } from '@/contexts/ModoAlimentarContext';
import { useRecipeGenerator } from '@/hooks/useRecipeGenerator';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenTutorial from '@/components/ScreenTutorial';
import { useScreenTutorial } from '@/hooks/useScreenTutorial';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES, GC_TIMES } from '@/lib/queryClient';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import { useMutationQueueStore } from '@/stores/mutationQueue.store';
import { OfflineIndicator } from '@/components/OfflineIndicator';

// ─── tipos ───────────────────────────────────────────────────────────────────

interface IngredienteProduto {
  nome: string;        // nome_display limpo: "Sal", "Ovo", "Manteiga"
  produto_id: string | null;
}

type ModoAlimentar = 'normal' | 'fitness' | 'vegetariano' | 'vegano';

const MODO_INFO: Record<ModoAlimentar, { icon: string; label: string; cor: string }> = {
  normal:      { icon: 'food-variant',   label: 'Todas as receitas',        cor: '' },
  fitness:     { icon: 'dumbbell',       label: 'Modo Fitness',             cor: '#6366f1' },
  vegetariano: { icon: 'leaf',           label: 'Modo Vegetariano',         cor: '#16a34a' },
  vegano:      { icon: 'sprout',         label: 'Modo Vegano',              cor: '#16a34a' },
};

interface QuaseReceita {
  id: string;
  nome: string;
  cobertura_pct: number;
  faltando: string[];
  n_faltando: number;
  mensagem: string;
  imagem_url?: string;
  tem_protagonista: boolean;
}

interface ReceitaDisponivel {
  id: string;
  titulo: string;
  descricao: string;
  tempo_preparo: string;
  dificuldade: string;
  ingredientes: string[];
  ingredientes_produtos: IngredienteProduto[];
  modo_preparo: string;
  rendimento: string;
  imagem_url?: string;
  is_nova?: boolean;
  cobertura: number;
  disponivel: boolean;
  tem_protagonista: boolean;
  faltando: string[];
  vezes_executada: number;
  usa_vencendo?: string[];
  tags_dieta?: string[];
  url_fonte?: string | null;
  autor_id?: string | null;
  fonte_tipo?: 'cookme' | 'web' | 'usuario';
  fonte_site?: string | null;
}

// ─── extração de ingrediente (igual despensa) ─────────────────────────────────

const INGREDIENTES_COMPOSTOS = new Set([
  'farinha trigo','farinha mandioca','farinha milho','farinha aveia',
  'óleo soja','oleo soja','leite coco','leite condensado','creme leite',
  'molho tomate','extrato tomate','feijão preto','feijão carioca',
  'arroz integral','batata doce','batata palha','carne moída','carne bovina',
  'peito frango','coxa frango','queijo mussarela','queijo parmesão','queijo meia',
]);

function extrairIngrediente(nomeProduto: string): string {
  let nome = nomeProduto
    .replace(/^\d+\s+/g, '')
    .replace(/\b\d+\s*(kg|g|ml|l|un|gr)\b/gi, '')
    .replace(/\bde\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim().toLowerCase();
  const palavras = nome.split(/\s+/).filter(p => p.length > 1);
  if (!palavras.length) return '';
  const duas = palavras.slice(0, 2).join(' ');
  return INGREDIENTES_COMPOSTOS.has(duas) ? duas : palavras[0];
}

// Limpa strings de ingrediente de receita para exibição humana
// "1/2 xicara de leite de coco" → "leite de coco"
// "3 dentes de alho inteiros (com casca)" → "alho"
// "2 batatas doces medias" → "batata doce"
function limparIngrediente(texto: string): string {
  let s = texto
    .toLowerCase()
    .replace(/\(.*?\)/g, '')                                   // remove parênteses e conteúdo
    .replace(/^\d[\d\/\s]*/g, '')                              // remove número/fração no início: "1/2 ", "2 "
    .replace(/\b\d+\s*(kg|g|ml|l|xicara[s]?|colher[es]*\s*(de\s*(sopa|cha))?|dente[s]?|unidade[s]?|pitada[s]?|folha[s]?|fio[s]?|ramo[s]?)\b/gi, '') // medidas
    .replace(/\b(pequen[oa]s?|medi[oa]s?|grande[s]?|frescas?|cozid[oa]s?|picad[oa]s?|amassad[oa]s?|inteiros?|fatiado[s]?|ralad[oa]s?|em\s+\w+)\b/gi, '') // adjetivos/prep
    .replace(/\ba\s+gosto\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Extrai o núcleo do ingrediente: remove preposições iniciais
  s = s.replace(/^(de|da|do|com|e)\s+/i, '').trim();

  // Capitaliza primeira letra
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── tela principal ──────────────────────────────────────────────────────────

export default function ReceitasScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const insets = useSafeAreaInsets();

  const { modoAlimentar, setModoAlimentar: setModoCtx } = useModoAlimentar();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [comprando, setComprando] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
    await queryClient.invalidateQueries({ queryKey: ['receitas', 'quase-possiveis'] });
    setRefreshing(false);
  }, [queryClient, modoAlimentar]);

  const { gerarReceitas } = useRecipeGenerator();
  const { showTutorial, dismissTutorial } = useScreenTutorial('receitas');
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable;
  const { enqueue } = useMutationQueueStore();

  // Sheet de ingredientes (compartilhado entre "Fiz essa!" e "Faltando")
  const [sheet, setSheet] = useState<{ receita: ReceitaDisponivel; modo: 'fiz' | 'faltando' } | null>(null);

  // Modal "Adicionar receita"
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [urlImportar, setUrlImportar] = useState('');
  const [importando, setImportando] = useState(false);
  const [mostrarUrlInput, setMostrarUrlInput] = useState(false);
  // Tela de previews dentro do modal
  type Preview = { titulo: string; url: string; site: string };
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [buscandoPreviews, setBuscandoPreviews] = useState(false);
  const [telaModal, setTelaModal] = useState<'menu' | 'previews'>('menu');

  // ─── Share Intent / Deep Link ─────────────────────────────────────────────────

  const params = useLocalSearchParams<{ url?: string }>();

  useEffect(() => {
    // Receber URL via deep link cookme://receitas?url=<url> ou share intent
    const sharedUrl = params.url;
    if (sharedUrl) {
      setUrlImportar(sharedUrl);
      setMostrarUrlInput(true);
      setModalAdicionar(true);
    }
  }, [params.url]);

  useEffect(() => {
    // Android share intent: app.json intentFilters ACTION_SEND entrega via initial URL
    const handleUrl = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      // Se vier como texto compartilhado, pode chegar no query param "text"
      const text = (parsed.queryParams?.text as string) || (parsed.queryParams?.url as string) || '';
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setUrlImportar(text);
        setMostrarUrlInput(true);
        setModalAdicionar(true);
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    // Checar URL inicial (app aberto via share)
    Linking.getInitialURL().then(url => { if (url) handleUrl({ url }); });
    return () => sub.remove();
  }, []);

  // ─── Plano ────────────────────────────────────────────────────────────────────

  const { data: planoData } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: async () => { const r = await api.get('/stripe/status'); return r.data; },
    staleTime: 5 * 60 * 1000,
  });
  const isPremium = planoData?.plano && planoData.plano !== 'free';

  // ─── Queries ──────────────────────────────────────────────────────────────────

  const { data: receitasData, isFetching: loading } = useQuery({
    queryKey: queryKeys.receitasDisponiveis(modoAlimentar),
    queryFn: async () => {
      const res = await api.get('/receitas/disponiveis');
      const modoApi = res.data.modo_alimentar as ModoAlimentar;
      if (modoApi) setModoCtx(modoApi);
      return res.data;
    },
    staleTime: STALE_TIMES.receitas_lista,
    gcTime: GC_TIMES.receitas_lista,
  });

  const { data: quaseData } = useQuery({
    queryKey: ['receitas', 'quase-possiveis'],
    queryFn: () => api.get('/receitas/quase-possiveis').then(r => r.data?.receitas ?? []),
    staleTime: STALE_TIMES.receitas_lista,
    gcTime: GC_TIMES.receitas_lista,
  });

  const { data: favoritasData } = useQuery({
    queryKey: queryKeys.receitasFavoritas(),
    queryFn: () => api.get('/receitas/favoritas').then(r => r.data as { id: string }[]),
    staleTime: STALE_TIMES.favoritas,
    gcTime: GC_TIMES.favoritas,
  });

  const receitas: ReceitaDisponivel[] = receitasData?.receitas ?? [];
  const totalIngredientes: number = receitasData?.ingredientes_ativos ?? 0;
  const ingredientesVencendo: string[] = receitasData?.ingredientes_vencendo ?? [];
  const previewsWeb: Preview[] = receitasData?.previews_web ?? [];
  const quaseReceitas: QuaseReceita[] = quaseData ?? [];
  const favoritosIds = useMemo(
    () => new Set((favoritasData ?? []).map(r => r.id)),
    [favoritasData],
  );

  // Recarrega ao focar na tela (invalida cache, não reseta state)
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
    queryClient.invalidateQueries({ queryKey: queryKeys.receitasFavoritas() });
    queryClient.invalidateQueries({ queryKey: ['receitas', 'quase-possiveis'] });
  }, [modoAlimentar]));

  const toggleFavorito = async (receitaId: string) => {
    // Optimistic update na cache
    const prevFav = queryClient.getQueryData<{ id: string }[]>(queryKeys.receitasFavoritas()) ?? [];
    const isFav = prevFav.some(r => r.id === receitaId);
    queryClient.setQueryData<{ id: string }[]>(
      queryKeys.receitasFavoritas(),
      isFav ? prevFav.filter(r => r.id !== receitaId) : [...prevFav, { id: receitaId }],
    );
    if (!isOnline) {
      // Offline: enfileirar para sync quando reconectar
      enqueue({
        method: 'post',
        url: `/receitas/${receitaId}/favoritar`,
        invalidateKeys: [Array.from(queryKeys.receitasFavoritas())],
      });
      return;
    }
    try {
      await api.post(`/receitas/${receitaId}/favoritar`);
    } catch {
      queryClient.setQueryData(queryKeys.receitasFavoritas(), prevFav);
    }
  };

  const trocarModo = async (novoModo: ModoAlimentar) => {
    if (novoModo === modoAlimentar) return;
    setModoCtx(novoModo);
    try {
      await api.patch('/usuarios/preferencias', { modo_alimentar: novoModo });
      queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(novoModo) });
    } catch {
      setModoCtx(modoAlimentar);
    }
  };

  const handleGerar = () => {
    if (!isOnline) {
      Alert.alert('Sem conexão', 'Esta ação requer conexão com a internet.');
      return;
    }
    setMostrarUrlInput(false);
    setUrlImportar('');
    setTelaModal('menu');
    setPreviews([]);
    setModalAdicionar(true);
  };

  const handleBaixarNovas = async () => {
    setTelaModal('previews');
    setBuscandoPreviews(true);
    setPreviews([]);
    try {
      const invRes = await api.get('/inventario');
      const invItems: any[] = Array.isArray(invRes.data)
        ? invRes.data
        : (invRes.data?.produtos ?? []);
      const ingredientes: string[] = invItems.map((i: any) =>
        i.nome_display || i.nome || i.produto?.nome_display || i.produto?.nome || ''
      ).filter(Boolean);
      const res = await api.post('/receitas/web/buscar', { ingredientes });
      setPreviews(res.data?.previews ?? []);
    } catch {
      Alert.alert('Erro', 'Falha ao buscar receitas na web');
      setTelaModal('menu');
    } finally {
      setBuscandoPreviews(false);
    }
  };

  const handleImportarPreview = async (preview: Preview) => {
    try {
      await api.post('/receitas/importar-url', { url: preview.url });
      queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
      setPreviews(prev => prev.filter(p => p.url !== preview.url));
      Alert.alert('Importada!', `"${preview.titulo}" salva na sua biblioteca.`);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Não foi possível importar esta receita.');
    }
  };

  const handleIgnorarPreview = async (preview: Preview) => {
    setPreviews(prev => prev.filter(p => p.url !== preview.url));
    try {
      await api.post('/receitas/web/ignorar', { url: preview.url });
    } catch {
      // falha silenciosa — já removeu da lista localmente
    }
  };

  const handleGerarIA = async () => {
    setModalAdicionar(false);
    try {
      setGerando(true);
      await gerarReceitas([], true);
      queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
    } catch {
      Alert.alert('Erro', 'Falha ao gerar receitas');
    } finally {
      setGerando(false);
    }
  };

  const handleImportarUrl = async () => {
    if (!urlImportar.trim()) return;
    setImportando(true);
    try {
      await api.post('/receitas/importar-url', { url: urlImportar.trim() });
      setModalAdicionar(false);
      setUrlImportar('');
      setMostrarUrlInput(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
      Alert.alert('Importada!', 'Receita salva na sua biblioteca pessoal.');
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Não foi possível importar esta receita.');
    } finally {
      setImportando(false);
    }
  };

  const comprarFaltando = async (receita: QuaseReceita) => {
    setComprando(receita.id);
    try {
      const res = await api.post(`/receitas/${receita.id}/comprar-faltando`);
      const data = res.data;
      Alert.alert(
        'Adicionado à lista!',
        `${data.ingredientes_adicionados} ingrediente(s) adicionado(s) à lista "${data.lista_titulo}"`,
        [{ text: 'Ótimo!' }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar à lista de compras');
    } finally {
      setComprando(null);
    }
  };

  // Adiciona ingrediente individual à lista de compras
  const comprarIngrediente = async (receita: ReceitaDisponivel, ingrediente: string) => {
    try {
      const tituloLista = `Ingredientes para ${receita.titulo}`;
      await api.post('/listas/adicionar-item-rapido', { titulo_lista: tituloLista, ingrediente });
      Alert.alert('Adicionado!', `"${ingrediente}" foi para a lista "${tituloLista}"`, [{ text: 'Ok' }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar à lista');
    }
  };

  // "Já tenho" — adiciona ingrediente ao inventário sem passar pelo OCR
  const adicionarIngredienteInventario = async (receitaId: string, ingrediente: string) => {
    try {
      await api.post('/inventario/adicionar-manual', { nome: ingrediente, quantidade: 1, unidade: 'un' });
      // Invalida receitas para recalcular matching
      queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
      Alert.alert('Adicionado à despensa!', `"${ingrediente}" foi adicionado ao seu inventário.`, [{ text: 'Ok' }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar ao inventário');
    }
  };

  const abrirFiz = async (receita: ReceitaDisponivel) => {
    if (!isOnline) {
      // Offline: enfileirar o registro de execução para sync quando reconectar
      enqueue({
        method: 'post',
        url: `/receitas/${receita.id}/executar`,
        invalidateKeys: [Array.from(queryKeys.receitasDisponiveis(modoAlimentar))],
      });
    } else {
      try {
        await api.post(`/receitas/${receita.id}/executar`);
      } catch { /* silencioso — registra em background */ }
    }
    setSheet({ receita, modo: 'fiz' });
  };

  const abrirFaltando = (receita: ReceitaDisponivel) => {
    setSheet({ receita, modo: 'faltando' });
  };

  const fecharSheet = async () => {
    setSheet(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) });
  };

  const urgentes = receitas.filter(r => r.usa_vencendo && r.usa_vencendo.length > 0);
  const urgentesIds = new Set(urgentes.map(r => r.id));
  const disponiveis = receitas.filter(r => r.disponivel && !urgentesIds.has(r.id));
  // Todas com ingrediente faltando (antes: quase + sugestão + comProtagonista + parciais) — ordenadas por menos faltando
  const faltandoIngredientes = receitas
    .filter(r => !r.disponivel && !urgentesIds.has(r.id))
    .sort((a, b) => (a.faltando?.length ?? 0) - (b.faltando?.length ?? 0));
  const modoInfo = MODO_INFO[modoAlimentar];

  // Timestamp da última atualização dos dados de receitas
  const queryState = queryClient.getQueryState(queryKeys.receitasDisponiveis(modoAlimentar));
  const dataAtualizada = queryState?.dataUpdatedAt
    ? (() => {
        const diff = Date.now() - queryState.dataUpdatedAt;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'agora';
        if (mins < 60) return `${mins}min atrás`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h atrás`;
      })()
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={22} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>IA Culinária</Text>
          <Text style={styles.headerTitle}>Receitas</Text>
        </View>
        <TouchableOpacity
          style={[styles.btnAdicionar, (!isOnline || gerando) && { opacity: 0.5 }]}
          onPress={handleGerar}
          disabled={!isOnline || gerando}
          activeOpacity={0.8}
        >
          {gerando
            ? <ActivityIndicator size="small" color={C.ink[0]} />
            : <MaterialCommunityIcons name="plus" size={22} color={C.ink[0]} />
          }
        </TouchableOpacity>
      </View>

      {/* Chips de modo alimentar */}
      <View style={styles.modoChipsRow}>
        {(Object.entries(MODO_INFO) as [ModoAlimentar, typeof MODO_INFO[ModoAlimentar]][]).map(([modo, info]) => {
          const ativo = modoAlimentar === modo;
          const cor = info.cor || C.green[600];
          return (
            <TouchableOpacity
              key={modo}
              style={[styles.modoChip, ativo && { backgroundColor: cor + '18', borderColor: cor }]}
              onPress={() => trocarModo(modo)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={info.icon as any} size={13} color={ativo ? cor : C.ink[400]} />
              <Text style={[styles.modoChipTxt, ativo && { color: cor, fontWeight: '700' }]}>
                {info.label.replace('Modo ', '').replace('Todas as receitas', 'Normal')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Atalhos de navegação */}
      <View style={styles.navChipsRow}>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/favoritas')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="heart-outline" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Favoritas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/receitas-feitas')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="check-circle-outline" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Feitas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/minhas-receitas')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="book-outline" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Minhas Receitas</Text>
        </TouchableOpacity>
      </View>

      <OfflineIndicator queryKey={Array.from(queryKeys.receitasDisponiveis(modoAlimentar))} />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={C.green[500]} /></View>
      ) : receitas.length === 0 ? (
        <EmptyState onGerar={handleGerar} gerando={gerando} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.green[600]]} tintColor={C.green[600]} />}
        >
          {/* Resumo */}
          <View style={styles.resumo}>
            <MaterialCommunityIcons name="fridge-outline" size={16} color={C.green[600]} />
            <Text style={styles.resumoText}>
              {totalIngredientes} ingredientes · {disponiveis.length + faltandoIngredientes.length} receitas sugeridas
              {dataAtualizada ? ` · ${dataAtualizada}` : ''}
            </Text>
            <TouchableOpacity onPress={() => queryClient.invalidateQueries({ queryKey: queryKeys.receitasDisponiveis(modoAlimentar) })}>
              <MaterialCommunityIcons name="refresh" size={16} color={C.ink[400]} />
            </TouchableOpacity>
          </View>

          {/* Use antes que estrague */}
          {urgentes.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={15} color={C.amber[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitleUrgente}>Use antes que estrague</Text>
                  <Text style={styles.sectionSubUrgente}>
                    Receitas com {ingredientesVencendo.slice(0, 2).join(', ')}{ingredientesVencendo.length > 2 ? ` e mais ${ingredientesVencendo.length - 2}` : ''}
                  </Text>
                </View>
              </View>
              {urgentes.map(r => (
                <ReceitaCard
                  key={`urgente-${r.id}`}
                  receita={r}
                  urgente
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onFiz={() => abrirFiz(r)}
                  onFaltando={() => abrirFaltando(r)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
              <View style={styles.separador} />
            </>
          )}

          {/* Disponíveis */}
          {disponiveis.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Prontas para fazer</Text>
              {disponiveis.map(r => (
                <ReceitaCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onFiz={() => abrirFiz(r)}
                  onFaltando={() => abrirFaltando(r)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </>
          )}

          {/* Falta alguns ingredientes — todas com < 100%, ordenadas por menos faltando */}
          {faltandoIngredientes.length > 0 && (
            <>
              {disponiveis.length > 0 && <View style={styles.separador} />}
              <Text style={styles.sectionTitle}>Falta alguns ingredientes</Text>
              {faltandoIngredientes.map(r => (
                <ReceitaCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onFiz={() => abrirFiz(r)}
                  onFaltando={() => abrirFaltando(r)}
                  onAdicionarIngrediente={(ingrediente) => adicionarIngredienteInventario(r.id, ingrediente)}
                  onComprarIngrediente={(ingrediente) => comprarIngrediente(r, ingrediente)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </>
          )}

          {/* Receitas encontradas na web — aparece quando banco tem poucas receitas */}
          {previewsWeb.length > 0 && (
            <>
              <View style={[styles.sugestaoHeader, { backgroundColor: '#FEF3C7' }]}>
                <View style={[styles.sugestaoHeaderIcon, { backgroundColor: '#D97706' }]}>
                  <MaterialCommunityIcons name="web" size={15} color={C.ink[0]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sugestaoHeaderTitle}>Encontramos na web 🌐</Text>
                  <Text style={styles.sugestaoHeaderSub}>Receitas com seus ingredientes — importe as que quiser</Text>
                </View>
              </View>
              {previewsWeb.map((p, i) => (
                <View key={`web-${i}`} style={styles.previewItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTitulo} numberOfLines={2}>{p.titulo}</Text>
                    <View style={styles.badgeFonte}>
                      <MaterialCommunityIcons name="download-outline" size={11} color="#D97706" />
                      <Text style={styles.badgeFonteTxt}>{p.site}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.previewImportarBtn, !isPremium && styles.previewImportarBtnLocked]}
                    onPress={() => handleImportarPreview(p)}
                    activeOpacity={0.8}
                  >
                    {!isPremium
                      ? <MaterialCommunityIcons name="lock-outline" size={16} color="#7C3AED" />
                      : <Text style={styles.previewImportarBtnTxt}>Importar</Text>
                    }
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

        </ScrollView>
      )}

      {/* Sheet de ingredientes */}
      {sheet && (
        <IngredientesSheet
          receita={sheet.receita}
          modo={sheet.modo}
          onFechar={fecharSheet}
        />
      )}

      <ScreenTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        steps={[
          { icon: 'robot-happy', title: 'Receitas com IA', description: 'A inteligência artificial analisa o que você tem na despensa e sugere receitas personalizadas para você.' },
          { icon: 'plus-circle', title: 'Adicionar receitas', description: "Toque em '+' para criar sua própria receita, gerar com IA ou importar de um site." },
          { icon: 'check-circle-outline', title: 'Fiz essa receita!', description: "Ao cozinhar, toque em 'Fiz essa!' para registrar e descontar automaticamente os ingredientes usados." },
        ]}
      />

      {/* Modal Adicionar Receita */}
      <Modal
        visible={modalAdicionar}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAdicionar(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalAdicionar(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  {telaModal === 'previews' ? (
                    <TouchableOpacity onPress={() => setTelaModal('menu')} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="arrow-left" size={18} color={C.ink[600]} />
                      <Text style={[styles.modalTitulo, { fontSize: 16 }]}>Receitas encontradas</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.modalTitulo}>Adicionar receita</Text>
                  )}
                  <TouchableOpacity onPress={() => setModalAdicionar(false)} hitSlop={12}>
                    <MaterialCommunityIcons name="close" size={20} color={C.ink[500]} />
                  </TouchableOpacity>
                </View>

                {telaModal === 'previews' ? (
                  /* ── Tela de previews ── */
                  <View style={{ minHeight: 200 }}>
                    {buscandoPreviews ? (
                      <View style={styles.previewLoading}>
                        <ActivityIndicator size="large" color={C.green[600]} />
                        <Text style={styles.previewLoadingTxt}>Buscando receitas com seus ingredientes…</Text>
                      </View>
                    ) : previews.length === 0 ? (
                      <View style={styles.previewLoading}>
                        <MaterialCommunityIcons name="magnify-close" size={40} color={C.ink[300]} />
                        <Text style={styles.previewLoadingTxt}>Nenhuma receita encontrada. Tente mais tarde.</Text>
                      </View>
                    ) : (
                      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                        {previews.map((p, i) => (
                          <View key={p.url + i} style={styles.previewItem}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.previewTitulo} numberOfLines={2}>{p.titulo}</Text>
                              <View style={styles.badgeFonte}>
                                <MaterialCommunityIcons name="web" size={11} color="#D97706" />
                                <Text style={styles.badgeFonteTxt}>{p.site}</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                              <TouchableOpacity
                                style={styles.previewImportarBtn}
                                onPress={() => handleImportarPreview(p)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.previewImportarBtnTxt}>Importar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleIgnorarPreview(p)}
                                activeOpacity={0.7}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                              >
                                <MaterialCommunityIcons name="close" size={11} color={C.ink[400]} />
                                <Text style={{ fontSize: 11, color: C.ink[400] }}>Ignorar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ) : (
                  /* ── Tela menu principal ── */
                  <>
                    <Text style={styles.modalSecao}>Buscar receitas</Text>

                    <TouchableOpacity style={styles.modalOpcao} onPress={handleBaixarNovas} activeOpacity={0.8}>
                      <View style={[styles.modalOpcaoIcon, { backgroundColor: C.green[50] }]}>
                        <MaterialCommunityIcons name="web" size={20} color={C.green[600]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalOpcaoLabel}>Buscar na web</Text>
                        <Text style={styles.modalOpcaoDesc}>Encontra receitas com seus ingredientes — só você vê</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[400]} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalOpcao} onPress={handleGerarIA} activeOpacity={0.8}>
                      <View style={[styles.modalOpcaoIcon, { backgroundColor: '#EDE9FE' }]}>
                        <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#7C3AED" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalOpcaoLabel}>Gerar com IA</Text>
                        <Text style={styles.modalOpcaoDesc}>IA cria uma receita original para você</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[400]} />
                    </TouchableOpacity>

                    <Text style={[styles.modalSecao, { marginTop: 20 }]}>Importar de um site</Text>

                    {!mostrarUrlInput ? (
                      <TouchableOpacity style={styles.modalOpcao} onPress={() => setMostrarUrlInput(true)} activeOpacity={0.8}>
                        <View style={[styles.modalOpcaoIcon, { backgroundColor: '#FEF3C7' }]}>
                          <MaterialCommunityIcons name="link-variant" size={20} color="#D97706" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalOpcaoLabel}>Colar link de receita</Text>
                          <Text style={styles.modalOpcaoDesc}>TudoGostoso, Instagram, TikTok, YouTube, Pinterest, Reddit e mais</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[400]} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.urlInputWrap}>
                        <TextInput
                          style={styles.urlInput}
                          placeholder="Cole um link de TikTok, Instagram, YouTube, receita..."
                          placeholderTextColor={C.ink[400]}
                          value={urlImportar}
                          onChangeText={setUrlImportar}
                          autoFocus
                          autoCapitalize="none"
                          keyboardType="url"
                          returnKeyType="done"
                          onSubmitEditing={handleImportarUrl}
                        />
                        <TouchableOpacity
                          style={[styles.urlImportarBtn, (!urlImportar.trim() || importando) && { opacity: 0.5 }]}
                          onPress={handleImportarUrl}
                          disabled={!urlImportar.trim() || importando}
                        >
                          {importando
                            ? <ActivityIndicator size="small" color={C.ink[0]} />
                            : <Text style={styles.urlImportarBtnTxt}>Importar</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    )}

                    <Text style={[styles.modalSecao, { marginTop: 20 }]}>Criar sua receita</Text>

                    <TouchableOpacity
                      style={styles.modalOpcao}
                      onPress={() => { setModalAdicionar(false); router.push('/(app)/nova-receita' as any); }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.modalOpcaoIcon, { backgroundColor: '#FEE2E2' }]}>
                        <MaterialCommunityIcons name="pencil-outline" size={20} color={C.red[500]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalOpcaoLabel}>Escrever receita</Text>
                        <Text style={styles.modalOpcaoDesc}>Crie e publique sua própria receita</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[400]} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── ReceitaCard ─────────────────────────────────────────────────────────────

function ReceitaCard({ receita, onFiz, onFaltando, onPress, urgente, favoritado, onToggleFavorito, onAdicionarIngrediente, onComprarIngrediente }: {
  receita: ReceitaDisponivel;
  onFiz: () => void;
  onFaltando: () => void;
  onPress: () => void;
  urgente?: boolean;
  favoritado?: boolean;
  onToggleFavorito?: () => void;
  onAdicionarIngrediente?: (ingrediente: string) => void;
  onComprarIngrediente?: (ingrediente: string) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const parcial = !receita.disponivel;
  const pct = Math.round(receita.cobertura ?? 0);

  // Layout compacto para receitas com ingredientes faltando (< 100%)
  if (parcial) {
    return (
      <TouchableOpacity style={styles.receitaCardCompact} onPress={onPress} activeOpacity={0.9}>
        {/* Foto pequena */}
        <View style={styles.receitaImgCompact}>
          {receita.imagem_url && !imageError ? (
            <Image source={{ uri: receita.imagem_url }} style={{ width: 64, height: 64, borderRadius: radius.md }} onError={() => setImageError(true)} />
          ) : (
            <View style={[{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="image-outline" size={22} color={C.ink[300]} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.receitaNomeCompact} numberOfLines={2}>{receita.titulo}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={C.ink[300]} />
          </View>
          {/* Barra de progresso */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          {/* Ingredientes faltando — apenas nomes, botões ficam no detalhe */}
          {receita.faltando && receita.faltando.length > 0 && (
            <View style={{ gap: 2 }}>
              {receita.faltando.slice(0, 3).map((ing, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="close-circle-outline" size={12} color={C.red[500]} />
                  <Text style={styles.faltandoIngNome} numberOfLines={1}>{ing}</Text>
                </View>
              ))}
              {receita.faltando.length > 3 && (
                <Text style={{ ...T.micro, color: C.ink[400] }}>+{receita.faltando.length - 3} mais...</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Layout completo com imagem grande — apenas receitas com 100% dos ingredientes
  return (
    <TouchableOpacity style={styles.receitaCard} onPress={onPress} activeOpacity={0.92}>
      <View style={{ position: 'relative' }}>
        {receita.imagem_url && !imageError ? (
          <Image source={{ uri: receita.imagem_url }} style={styles.receitaImg} onError={() => setImageError(true)} />
        ) : (
          <View style={styles.receitaImgPlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={32} color={C.ink[300]} />
          </View>
        )}
        {onToggleFavorito && (
          <TouchableOpacity
            style={[styles.heartBtn, !(receita.imagem_url && !imageError) && { backgroundColor: 'transparent' }]}
            onPress={onToggleFavorito}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={20}
              color={favoritado ? C.red[500] : (receita.imagem_url && !imageError ? C.ink[0] : C.ink[400])}
            />
          </TouchableOpacity>
        )}
        {/* Badge Tem tudo */}
        <View style={styles.badgeTemTudo}>
          <MaterialCommunityIcons name="check-circle" size={12} color={C.ink[0]} />
          <Text style={styles.badgeTemTudoText}>Tem tudo</Text>
        </View>
      </View>

      <View style={styles.receitaBody}>
        <View style={styles.tagRow}>
          {urgente && receita.usa_vencendo && receita.usa_vencendo.length > 0 && (
            <View style={styles.tagUrgente}>
              <MaterialCommunityIcons name="clock-alert-outline" size={11} color={C.ink[0]} />
              <Text style={styles.tagUrgenteText}>Usa {receita.usa_vencendo[0]}</Text>
            </View>
          )}
          {receita.is_nova && (
            <View style={styles.tagNova}>
              <MaterialCommunityIcons name="shimmer" size={11} color={C.ink[0]} />
              <Text style={styles.tagNovaText}>Nova</Text>
            </View>
          )}
        </View>

        <Text style={styles.receitaNome}>{receita.titulo}</Text>

        {receita.fonte_tipo === 'web' && (
          <View style={[styles.badgeFonte, { marginBottom: 4 }]}>
            <MaterialCommunityIcons name="web" size={11} color="#D97706" />
            <Text style={styles.badgeFonteTxt}>{receita.fonte_site ?? 'Web'}</Text>
          </View>
        )}
        {receita.fonte_tipo === 'usuario' && (
          <View style={[styles.badgeFonte, { marginBottom: 4, backgroundColor: '#ede9fe', borderColor: '#c4b5fd' }]}>
            <MaterialCommunityIcons name="account" size={11} color="#7c3aed" />
            <Text style={[styles.badgeFonteTxt, { color: '#7c3aed' }]}>Comunidade</Text>
          </View>
        )}
        {receita.fonte_tipo === 'cookme' && (
          <View style={[styles.badgeFonte, { marginBottom: 4, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <MaterialCommunityIcons name="chef-hat" size={11} color="#16a34a" />
            <Text style={[styles.badgeFonteTxt, { color: '#16a34a' }]}>CookMe</Text>
          </View>
        )}

        {receita.descricao ? (
          <Text style={styles.receitaDesc} numberOfLines={2}>{receita.descricao}</Text>
        ) : null}

        <View style={styles.acoes}>
          <View style={styles.receitaMeta}>
            {receita.tempo_preparo ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={C.ink[400]} />
                <Text style={styles.metaText}>{receita.tempo_preparo}</Text>
              </View>
            ) : null}
            {receita.vezes_executada > 0 && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="chef-hat" size={13} color={C.ink[400]} />
                <Text style={styles.metaText}>{receita.vezes_executada}x feita</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.btnFiz} onPress={onFiz}>
            <MaterialCommunityIcons name="check" size={14} color={C.ink[0]} />
            <Text style={styles.btnFizText}>Fiz essa!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}


// ─── QuaseCard ────────────────────────────────────────────────────────────────

function QuaseCard({ receita, comprando, onComprar, onPress }: {
  receita: QuaseReceita;
  comprando: boolean;
  onComprar: () => void;
  onPress: () => void;
}) {
  const pct = Math.min(100, Math.round(receita.cobertura_pct));
  return (
    <TouchableOpacity style={styles.quaseCard} onPress={onPress} activeOpacity={0.92}>
      {/* Barra de progresso */}
      <View style={styles.quaseProgressBg}>
        <View style={[styles.quaseProgressFill, { width: `${pct}%` as any }]} />
      </View>

      <View style={styles.quaseBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.quaseNome} numberOfLines={2}>{receita.nome}</Text>
          <Text style={styles.quaseMensagem}>{receita.mensagem}</Text>
          {receita.faltando.length > 0 && (
            <View style={styles.quaseFaltando}>
              <MaterialCommunityIcons name="plus-circle-outline" size={12} color={C.green[600]} />
              <Text style={styles.quaseFaltandoTxt} numberOfLines={1}>
                {receita.faltando.slice(0, 3).join(', ')}{receita.faltando.length > 3 ? '…' : ''}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.quaseBtnComprar, comprando && { opacity: 0.6 }]}
          onPress={onComprar}
          disabled={comprando}
          activeOpacity={0.8}
        >
          {comprando
            ? <ActivityIndicator size="small" color={C.ink[0]} />
            : <>
                <MaterialCommunityIcons name="cart-plus" size={14} color={C.ink[0]} />
                <Text style={styles.quaseBtnTxt}>
                  {receita.n_faltando === 1 ? 'Comprar 1 item' : `Comprar ${receita.n_faltando}`}
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── SugestaoCard ────────────────────────────────────────────────────────────

function SugestaoCard({ receita, onPress }: {
  receita: QuaseReceita;
  onPress: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const pct = Math.min(100, Math.round(receita.cobertura_pct));
  // Destaca o ingrediente principal faltante (geralmente o primeiro da lista)
  const protagonista = receita.faltando[0] ?? '';

  return (
    <TouchableOpacity style={styles.sugestaoCard} onPress={onPress} activeOpacity={0.92}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {/* Ícone / imagem pequena */}
        {receita.imagem_url && !imageError ? (
          <Image
            source={{ uri: receita.imagem_url }}
            style={styles.sugestaoImg}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.sugestaoImgPlaceholder}>
            <MaterialCommunityIcons name="food-variant" size={22} color={C.ink[400]} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.sugestaoNome} numberOfLines={1}>{receita.nome}</Text>

          {/* Progresso */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={styles.sugestaoProgressBg}>
              <View style={[styles.sugestaoProgressFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.sugestaoPct}>{pct}%</Text>
          </View>

          {/* Ingrediente principal faltante — faltando[0] é sempre o protagonista */}
          {protagonista ? (
            <View style={styles.sugestaoFaltando}>
              <MaterialCommunityIcons name="cart-outline" size={11} color="#7c3aed" />
              <Text style={styles.sugestaoFaltandoTxt} numberOfLines={1}>
                Ingrediente principal: <Text style={{ fontWeight: '700' }}>{protagonista}</Text>
                {receita.n_faltando > 1 ? ` + ${receita.n_faltando - 1} item(s)` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── IngredientesSheet ────────────────────────────────────────────────────────

function IngredientesSheet({
  receita,
  modo,
  onFechar,
}: {
  receita: ReceitaDisponivel;
  modo: 'fiz' | 'faltando';
  onFechar: () => void;
}) {
  // Usa ingredientes_produtos (nome_display limpo + produto_id) enviados pelo backend
  const itensRaw: IngredienteProduto[] = (receita.ingredientes_produtos?.length ?? 0) > 0
    ? receita.ingredientes_produtos
    : (receita.ingredientes || []).map(ing => ({ nome: ing, produto_id: null }));
  // Dedup por nome
  const itens = itensRaw.filter((item, idx, arr) =>
    arr.findIndex(x => x.nome.toLowerCase() === item.nome.toLowerCase()) === idx
  );

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  const toggle = (produto_id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      next.has(produto_id) ? next.delete(produto_id) : next.add(produto_id);
      return next;
    });
  };

  const confirmar = async () => {
    setSalvando(true);
    try {
      if (selecionados.size > 0) {
        const invRes = await api.get('/inventario');
        const invItens: any[] = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.produtos || []);

        await Promise.all(
          Array.from(selecionados).map(async (key) => {
            const ing = itens.find(i => (i.produto_id ?? i.nome) === key);
            if (!ing) return;
            const invItem = invItens.find((p: any) => {
              const nomeInv = (p.nome_display || p.nome || '').toLowerCase();
              const nomeIng = ing.nome.toLowerCase();
              return nomeInv === nomeIng || nomeInv.includes(nomeIng) || nomeIng.includes(nomeInv);
            });
            if (invItem) {
              await api.patch(`/inventario/${invItem.id}/esgotado`, { esgotado: true });
            }
          })
        );
      }
    } catch { /* silencioso */ }
    finally {
      setSalvando(false);
      onFechar();
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onFechar} activeOpacity={1} />
        <View style={styles.sheetBox}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Cabeçalho */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderIcon}>
              <MaterialCommunityIcons
                name={modo === 'fiz' ? 'check-circle' : 'package-variant-remove'}
                size={22}
                color={modo === 'fiz' ? C.green[600] : C.amber[700]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitulo}>
                {modo === 'fiz' ? 'Receita feita!' : 'O que acabou?'}
              </Text>
              <Text style={styles.sheetSub}>
                {modo === 'fiz'
                  ? 'Marque o que acabou na sua despensa'
                  : 'Marque os ingredientes que você não tem mais'}
              </Text>
            </View>
          </View>

          {/* Lista de ingredientes com checkbox */}
          <FlatList
            data={itens}
            keyExtractor={(item, i) => `${item.produto_id ?? item.nome}-${i}`}
            style={styles.sheetList}
            renderItem={({ item }) => {
              const key = item.produto_id ?? item.nome;
              const marcado = selecionados.has(key);
              return (
                <TouchableOpacity
                  style={[styles.sheetIngRow, marcado && styles.sheetIngRowMarcado]}
                  onPress={() => toggle(key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, marcado && styles.checkboxMarcado]}>
                    {marcado && <MaterialCommunityIcons name="check" size={13} color={C.ink[0]} />}
                  </View>
                  <Text style={[styles.sheetIngNome, marcado && styles.sheetIngNomeMarcado]}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Botões */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.sheetBtnCancelar} onPress={onFechar}>
              <Text style={styles.sheetBtnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetBtnConfirmar, salvando && { opacity: 0.6 }]}
              onPress={confirmar}
              disabled={salvando}
            >
              {salvando
                ? <ActivityIndicator size="small" color={C.ink[0]} />
                : <>
                    <MaterialCommunityIcons name="check" size={16} color={C.ink[0]} />
                    <Text style={styles.sheetBtnConfirmarText}>
                      {selecionados.size > 0 ? `Marcar ${selecionados.size} como acabou` : 'Confirmar'}
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmptyState({ onGerar, gerando }: { onGerar: () => void; gerando: boolean }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="chef-hat" size={48} color={C.green[500]} />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma receita ainda</Text>
      <Text style={styles.emptySub}>Gere receitas com os ingredientes da sua despensa</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onGerar} disabled={gerando}>
        {gerando
          ? <ActivityIndicator size="small" color={C.ink[0]} />
          : <>
              <MaterialCommunityIcons name="auto-fix" size={18} color={C.ink[0]} />
              <Text style={styles.emptyBtnText}>Gerar agora</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  menuBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },
  btnGerar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.green[500], paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: radius.md, ...shadows.sm, minWidth: 44, justifyContent: 'center',
  },
  btnGerarText: { ...T.small, color: C.ink[0], fontWeight: '700' },
  btnAdicionar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.green[600], alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },

  // Modal Adicionar Receita
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.ink[0], borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: C.ink[200],
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  modalTitulo: { ...T.h2, color: C.ink[900] },
  modalSecao: { ...T.micro, fontWeight: '700', color: C.ink[400], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  modalOpcao: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: C.ink[50], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], marginBottom: 8,
  },
  modalOpcaoIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  modalOpcaoLabel: { ...T.body, fontWeight: '700', color: C.ink[800] },
  modalOpcaoDesc: { ...T.micro, color: C.ink[500], marginTop: 2 },
  urlInputWrap: {
    flexDirection: 'row', gap: 8, marginBottom: 8,
  },
  urlInput: {
    flex: 1, borderWidth: 1, borderColor: C.green[400], borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10, ...T.small, color: C.ink[800],
    backgroundColor: C.ink[50],
  },
  urlImportarBtn: {
    backgroundColor: C.green[600], borderRadius: radius.md,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  urlImportarBtnTxt: { ...T.small, color: C.ink[0], fontWeight: '700' },

  // Tela de previews
  previewLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  previewLoadingTxt: { ...T.small, color: C.ink[500], textAlign: 'center' },
  previewItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.ink[100],
  },
  previewTitulo: { ...T.body, fontWeight: '600', color: C.ink[800], marginBottom: 4 },
  previewImportarBtn: {
    backgroundColor: C.green[600], borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  previewImportarBtnLocked: {
    backgroundColor: '#EDE9FE', paddingHorizontal: 12,
  },
  previewImportarBtnTxt: { ...T.micro, color: C.ink[0], fontWeight: '700' },

  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F3FF', borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  premiumBannerTxt: { ...T.small, color: '#7C3AED', flex: 1 },

  // Badge fonte (receita importada)
  badgeFonte: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, alignSelf: 'flex-start',
  },
  badgeFonteTxt: { ...T.micro, color: '#92400E', fontWeight: '700' },

  modoChipsRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  modoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.ink[200],
    backgroundColor: C.ink[50],
  },
  modoChipTxt: { ...T.micro, color: C.ink[500], fontWeight: '500' },

  navChipsRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.ink[50], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  navChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.ink[200],
    backgroundColor: C.ink[0],
  },
  navChipTxt: { ...T.micro, color: C.ink[600], fontWeight: '500' },

  content: { padding: 20, paddingBottom: 32, gap: 12 },

  resumo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.ink[0], borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: C.ink[150],
  },
  resumoText: { ...T.small, color: C.ink[600], flex: 1 },

  modoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: radius.pill,
    borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  modoBadgeTxt: { ...T.micro, fontWeight: '700', letterSpacing: 0.3 },

  sectionTitle: { ...T.h3, color: C.ink[700], marginTop: 4, marginBottom: 4 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.amber[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.amber[200], padding: 12, marginBottom: 10,
  },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.amber[500], alignItems: 'center', justifyContent: 'center',
  },
  sectionTitleUrgente: { ...T.h3, color: C.amber[800], fontSize: 14 },
  sectionSubUrgente: { ...T.micro, color: C.amber[700], marginTop: 1 },
  separador: { height: 1, backgroundColor: C.ink[150], marginVertical: 4 },
  tagUrgente: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: C.amber[500], borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagUrgenteText: { ...T.micro, color: C.ink[0], fontWeight: '700' },

  // Card receita — layout completo (100% ingredientes)
  receitaCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], overflow: 'hidden', ...shadows.sm,
  },
  receitaImg: { width: '100%', height: 160, resizeMode: 'cover' },
  receitaImgPlaceholder: {
    width: '100%', height: 100, backgroundColor: C.ink[100],
    alignItems: 'center', justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeTemTudo: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.green[600], borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeTemTudoText: { ...T.micro, color: C.ink[0], fontWeight: '700' },
  receitaBody: { padding: 14, gap: 6 },

  // Card compacto (< 100% ingredientes)
  receitaCardCompact: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
  },
  receitaImgCompact: { borderRadius: radius.md, overflow: 'hidden' },
  receitaNomeCompact: { ...T.body, fontWeight: '600', color: C.ink[700], lineHeight: 20 },
  faltandoItensCompact: { ...T.micro, color: C.amber[700], flex: 1 },
  progressBarBg: {
    flex: 1, height: 4, backgroundColor: C.ink[150], borderRadius: 2, overflow: 'hidden',
  },
  progressBarFill: { height: 4, backgroundColor: C.amber[400], borderRadius: 2 },
  progressPct: { ...T.micro, color: C.ink[400], fontWeight: '600', minWidth: 28 },

  // Ingredientes faltando com ações inline
  faltandoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  faltandoIngNome: { ...T.micro, color: C.ink[600], flex: 1 },
  btnComprarIng: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.green[50], borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.green[200],
  },
  btnComprarIngText: { ...T.micro, color: C.green[700], fontWeight: '600' },
  btnJaTenho: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.ink[50], borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.ink[200],
  },
  btnJaTenhoText: { ...T.micro, color: C.ink[600], fontWeight: '600' },

  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tagNova: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: C.green[600], borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagNovaText: { ...T.micro, color: C.ink[0], fontWeight: '700' },
  tagCobertura: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagCoberturaText: { ...T.micro, fontWeight: '600' },

  receitaNome: { ...T.h3, color: C.ink[900] },
  receitaDesc: { ...T.small, color: C.ink[500], lineHeight: 18 },

  faltandoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 4,
    backgroundColor: C.amber[50], borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: C.amber[200],
  },
  faltandoLabel: { ...T.micro, color: C.amber[700], fontWeight: '700' },
  faltandoItens: { ...T.micro, color: C.amber[700], flex: 1, lineHeight: 16 },

  receitaMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...T.micro, color: C.ink[400] },

  acoes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  btnFaltando: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.amber[200],
    backgroundColor: C.amber[50], paddingVertical: 7, paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  btnFaltandoText: { ...T.small, color: C.amber[700], fontWeight: '700' },
  btnFiz: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.green[500], paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: radius.md, ...shadows.sm,
  },
  btnFizText: { ...T.small, color: C.ink[0], fontWeight: '700' },

  preparo: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.ink[100], marginTop: 4 },
  ingredientesSection: { marginBottom: 8 },
  ingredientesSectionTitle: { ...T.small, color: C.ink[700], fontWeight: '700', marginBottom: 6 },
  ingredienteItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 2 },
  ingredienteBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green[500], marginTop: 6, flexShrink: 0 },
  ingredienteItemText: { ...T.small, color: C.ink[700], flex: 1, lineHeight: 18 },
  passo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  passoNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  passoNumText: { ...T.micro, color: C.ink[0], fontWeight: '700' },
  passoText: { ...T.small, color: C.ink[700], flex: 1, lineHeight: 18 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h2, color: C.ink[900] },
  emptySub: { ...T.body, color: C.ink[500], textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[500], paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: radius.md, marginTop: 8, ...shadows.md,
  },
  emptyBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // Quase Lá!
  quaseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.green[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.green[200], padding: 12, marginBottom: 4,
  },
  quaseHeaderIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.green[600], alignItems: 'center', justifyContent: 'center',
  },
  quaseHeaderTitle: { ...T.h3, color: C.green[900], fontSize: 14 },
  quaseHeaderSub: { ...T.micro, color: C.green[700], marginTop: 2 },
  quaseCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.green[200], overflow: 'hidden', ...shadows.sm,
  },
  quaseProgressBg: { height: 4, backgroundColor: C.ink[150] },
  quaseProgressFill: { height: 4, backgroundColor: C.green[500] },
  quaseBody: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  quaseNome: { ...T.h3, color: C.ink[900], fontSize: 14, lineHeight: 18 },
  quaseMensagem: { ...T.micro, color: C.green[700], fontWeight: '600', marginTop: 3 },
  quaseFaltando: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  quaseFaltandoTxt: { ...T.micro, color: C.ink[500], flex: 1 },
  quaseBtnComprar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.green[600], paddingVertical: 9, paddingHorizontal: 10,
    borderRadius: radius.md, ...shadows.sm, minWidth: 100, justifyContent: 'center',
  },
  quaseBtnTxt: { ...T.micro, color: C.ink[0], fontWeight: '700' },

  // Sugestão de prato (sem protagonista)
  sugestaoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f5f3ff', borderRadius: radius.md,
    borderWidth: 1, borderColor: '#ddd6fe', padding: 12, marginBottom: 4,
  },
  sugestaoHeaderIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },
  sugestaoHeaderTitle: { ...T.h3, color: '#4c1d95', fontSize: 14 },
  sugestaoHeaderSub: { ...T.micro, color: '#5b21b6', marginTop: 2 },
  sugestaoCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: '#ddd6fe', overflow: 'hidden',
    padding: 12, ...shadows.sm,
  },
  sugestaoImg: { width: 56, height: 56, borderRadius: radius.md, resizeMode: 'cover' },
  sugestaoImgPlaceholder: {
    width: 56, height: 56, borderRadius: radius.md,
    backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center',
  },
  sugestaoNome: { ...T.h3, color: C.ink[900], fontSize: 13, lineHeight: 17 },
  sugestaoProgressBg: { flex: 1, height: 4, backgroundColor: C.ink[150], borderRadius: 2 },
  sugestaoProgressFill: { height: 4, backgroundColor: '#7c3aed', borderRadius: 2 },
  sugestaoPct: { ...T.micro, color: '#7c3aed', fontWeight: '700', minWidth: 28, textAlign: 'right' },
  sugestaoFaltando: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sugestaoFaltandoTxt: { ...T.micro, color: '#5b21b6', flex: 1 },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheetBox: {
    backgroundColor: C.ink[0], borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, maxHeight: '85%',
    ...shadows.modal,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink[200], alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.ink[100],
  },
  sheetHeaderIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  sheetTitulo: { ...T.h3, color: C.ink[900], fontSize: 16 },
  sheetSub: { ...T.micro, color: C.ink[500], marginTop: 2 },
  sheetList: { maxHeight: 340, paddingHorizontal: 16, marginTop: 4 },
  sheetIngRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 8, borderRadius: radius.md, marginVertical: 1,
  },
  sheetIngRowMarcado: { backgroundColor: C.red[50] },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.ink[300],
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: C.red[500], borderColor: C.red[500] },
  sheetIngNome: { ...T.body, color: C.ink[800], flex: 1 },
  sheetIngNomeMarcado: { color: C.red[500], textDecorationLine: 'line-through' },
  sheetFooter: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.ink[100],
  },
  sheetBtnCancelar: {
    flex: 1, paddingVertical: 13, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.ink[200], alignItems: 'center',
  },
  sheetBtnCancelarText: { ...T.body, color: C.ink[600], fontWeight: '600' },
  sheetBtnConfirmar: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.green[500], paddingVertical: 13, borderRadius: radius.md, ...shadows.sm,
  },
  sheetBtnConfirmarText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
