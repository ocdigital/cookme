import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES, GC_TIMES } from '@/lib/queryClient';

interface Receita {
  id: string;
  titulo: string;
  descricao?: string;
  tempo_preparo?: string;
  dificuldade?: string;
  rendimento?: string;
  imagem_url?: string;
  ingredientes?: string[];
  modo_preparo?: string;
  cobertura?: number;
  disponivel?: boolean;
  faltando?: string[];
  vezes_executada?: number;
  avaliacao_media?: number;
}

interface Comentario {
  id: string;
  nota: number;
  comentario: string | null;
  autor_nome: string;
  autor_avatar: string | null;
  criado_em: string;
}

function parsearPassos(modoPreparo?: string): string[] {
  if (!modoPreparo) return [];
  try {
    const parsed = JSON.parse(modoPreparo);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return modoPreparo.split('\n').filter(Boolean);
}

function Estrelas({ nota, tamanho = 18, onPress }: { nota: number; tamanho?: number; onPress?: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onPress?.(n)} disabled={!onPress} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={n <= nota ? 'star' : 'star-outline'}
            size={tamanho}
            color={n <= nota ? C.amber[400] : C.ink[300]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return min <= 1 ? 'agora' : `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function ReceitaDetalheScreen() {
  const { id, dados } = useLocalSearchParams<{ id: string; dados?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();
  const [executando, setExecutando] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  // Foto
  const [modalFoto, setModalFoto] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // Avaliação
  const [modalAvaliacao, setModalAvaliacao] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(0);
  const [textoComentario, setTextoComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [modalFiz, setModalFiz] = useState(false);
  const [invItens, setInvItens] = useState<any[]>([]);
  const [invExtras, setInvExtras] = useState<any[]>([]); // demais itens do inventário
  const [selecionadosFiz, setSelecionadosFiz] = useState<Set<string>>(new Set());
  const [confirmandoFiz, setConfirmandoFiz] = useState(false);
  const [mostrarExtras, setMostrarExtras] = useState(false);

  // Dados de navegação (passados via params) como placeholder inicial
  const dadosNavegacao: Receita | null = dados ? (() => { try { const p = JSON.parse(dados as string); return p?.id === id ? p : null; } catch { return null; } })() : null;

  const { data: receita, isLoading: loading } = useQuery({
    queryKey: queryKeys.receitaDetalhe(id ?? ''),
    queryFn: async () => {
      const res = await api.get(`/receitas/${id}`);
      return (res.data?.receita || res.data) as Receita;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.receita_individual,
    gcTime: GC_TIMES.receita_individual,
    // Usa dados de navegação como placeholder enquanto busca
    placeholderData: dadosNavegacao ?? undefined,
  });

  // Avaliação + comentários + favorito
  const { data: extrasData, isLoading: loadingComentarios, refetch: refetchExtras } = useQuery({
    queryKey: queryKeys.receitaAvaliacao(id ?? ''),
    queryFn: async () => {
      const [avalRes, comRes, favRes] = await Promise.all([
        api.get(`/receitas/${id}/minha-avaliacao`),
        api.get(`/receitas/${id}/comentarios`),
        api.get(`/receitas/${id}/favoritado`),
      ]);
      return {
        minhaNotaAtual: avalRes.data?.nota ?? 0,
        meuComentarioAtual: avalRes.data?.comentario ?? '',
        comentarios: (comRes.data || []) as Comentario[],
        favoritado: favRes.data?.favoritado ?? false,
      };
    },
    enabled: !!id,
    staleTime: STALE_TIMES.receita_individual,
    gcTime: GC_TIMES.receita_individual,
  });

  const minhaNotaAtual = extrasData?.minhaNotaAtual ?? 0;
  const meuComentarioAtual = extrasData?.meuComentarioAtual ?? '';
  const comentarios: Comentario[] = extrasData?.comentarios ?? [];
  const favoritado = extrasData?.favoritado ?? false;

  const toggleFavorito = async () => {
    if (!receita || togglingFav) return;
    try {
      setTogglingFav(true);
      await api.post(`/receitas/${receita.id}/favoritar`);
      refetchExtras();
      // Invalida também a lista de favoritas global
      queryClient.invalidateQueries({ queryKey: queryKeys.receitasFavoritas() });
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar favoritos');
    } finally {
      setTogglingFav(false);
    }
  };

  const abrirModalAvaliacao = () => {
    setNotaSelecionada(minhaNotaAtual || 0);
    setTextoComentario(meuComentarioAtual || '');
    setModalAvaliacao(true);
  };

  const enviarAvaliacao = async () => {
    if (notaSelecionada === 0) {
      Alert.alert('Selecione uma nota', 'Toque nas estrelas para avaliar.');
      return;
    }
    try {
      setEnviandoAvaliacao(true);
      await api.post(`/receitas/${receita!.id}/avaliar`, {
        nota: notaSelecionada,
        comentario: textoComentario.trim() || undefined,
      });
      setModalAvaliacao(false);
      refetchExtras();
      queryClient.invalidateQueries({ queryKey: queryKeys.receitaDetalhe(id ?? '') });
      Alert.alert('Obrigado! ⭐', 'Sua avaliação foi registrada.');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a avaliação');
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const handleFiz = async () => {
    if (!receita) return;
    try {
      const invRes = await api.get('/inventario');
      const todos: any[] = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.produtos || []);

      // Texto completo dos ingredientes da receita para matching
      const ingTexto = norm((receita.ingredientes || []).join(' '));

      const relevantes = todos.filter((item: any) => {
        const nome = norm(item.nome_display || item.nome || '');
        if (!nome || nome.length < 3) return false;
        // Word-boundary match — "maca" não pode casar com "macarrao"
        const palavras = nome.split(/\s+/).filter((p: string) => p.length > 3);
        if (palavras.length === 0) return false;
        return palavras.some((p: string) =>
          new RegExp(`(?:^|\\s)${p}(?:$|\\s)`).test(ingTexto)
        );
      });

      const semDup = relevantes.filter((item: any, idx: number, arr: any[]) =>
        arr.findIndex((x: any) => x.id === item.id) === idx
      );
      setInvItens(semDup);
      const idsMatchados = new Set(semDup.map((x: any) => x.id));
      setInvExtras(todos.filter((x: any) => !idsMatchados.has(x.id)));
      setSelecionadosFiz(new Set());
      setMostrarExtras(false);
      setModalFiz(true);
    } catch {
      setInvItens([]);
      setModalFiz(true);
    }
  };

  const confirmarFiz = async () => {
    if (!receita) return;
    setConfirmandoFiz(true);
    try {
      await api.post(`/receitas/${receita.id}/executar`);
      if (selecionadosFiz.size > 0) {
        await Promise.all(
          Array.from(selecionadosFiz).map(id =>
            api.patch(`/inventario/${id}/esgotado`, { esgotado: true }).catch(() => {})
          )
        );
      }
      setModalFiz(false);
      Alert.alert('Boa! 🎉', 'Receita registrada! Que tal avaliar?', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Avaliar', onPress: abrirModalAvaliacao },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar a receita');
    } finally {
      setConfirmandoFiz(false);
    }
  };

  const abrirCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acesso à câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setFotoUri(result.assets[0].uri);
      setFotoMime(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const abrirGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acesso à galeria para escolher a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setFotoUri(result.assets[0].uri);
      setFotoMime(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const handleSugerirFoto = async () => {
    if (!fotoUri || !receita) return;
    try {
      setEnviandoFoto(true);
      const formData = new FormData();
      const ext = fotoUri.split('.').pop() || 'jpg';
      formData.append('file', { uri: fotoUri, name: `foto-${receita.id}.${ext}`, type: fotoMime } as any);
      await api.post(`/receitas/${receita.id}/sugerir-foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModalFoto(false);
      setFotoUri(null);
      Alert.alert('Enviado! 📸', 'Sua foto foi enviada para análise.');
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Não foi possível enviar a foto');
    } finally {
      setEnviandoFoto(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={C.green[500]} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!receita) return null;

  const passos = parsearPassos(receita.modo_preparo);
  const cobertura = receita.cobertura ?? 0;
  const coberturaColor = receita.disponivel ? C.green[600] : cobertura >= 60 ? C.amber[600] : C.red[600];
  const mediaExibida = parseFloat(String(receita.avaliacao_media ?? 0)) || 0;

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero imagem ────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {receita.imagem_url ? (
            <Image source={{ uri: receita.imagem_url }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.heroImgFallback]}>
              <MaterialCommunityIcons name="chef-hat" size={56} color={C.ink[300]} />
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']} style={styles.heroGradient} />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[900]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroBtn, { top: insets.top + 12, right: 64 }]}
            onPress={toggleFavorito}
            disabled={togglingFav}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={18}
              color={favoritado ? C.red[500] : C.ink[900]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroBtn, { top: insets.top + 12, right: 16 }]}
            onPress={() => setModalFoto(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={18} color={C.ink[900]} />
          </TouchableOpacity>
        </View>

        {/* ── Conteúdo ───────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Título + badge cobertura */}
          <View style={styles.tituloRow}>
            <Text style={styles.titulo}>{receita.titulo}</Text>
            <View style={[styles.coberturaTag, {
              backgroundColor: receita.disponivel ? C.green[50] : C.amber[50],
              borderColor: receita.disponivel ? C.green[200] : C.amber[200],
            }]}>
              <MaterialCommunityIcons
                name={receita.disponivel ? 'check-circle-outline' : 'alert-outline'}
                size={13} color={coberturaColor}
              />
              <Text style={[styles.coberturaTagText, { color: coberturaColor }]}>
                {receita.disponivel ? 'Tem tudo' : `${cobertura}%`}
              </Text>
            </View>
          </View>

          {/* Avaliação média + botão avaliar */}
          <View style={styles.avaliacaoRow}>
            <Estrelas nota={Math.round(mediaExibida)} tamanho={16} />
            {mediaExibida > 0 ? (
              <Text style={styles.avaliacaoMedia}>{mediaExibida.toFixed(1)}</Text>
            ) : (
              <Text style={styles.avaliacaoSemNota}>Sem avaliações</Text>
            )}
            {comentarios.length > 0 && (
              <Text style={styles.avaliacaoContagem}>({comentarios.length})</Text>
            )}
            <TouchableOpacity style={styles.btnAvaliar} onPress={abrirModalAvaliacao} activeOpacity={0.8}>
              <MaterialCommunityIcons
                name={minhaNotaAtual > 0 ? 'star-check' : 'star-plus-outline'}
                size={14} color={minhaNotaAtual > 0 ? C.amber[500] : C.green[600]}
              />
              <Text style={[styles.btnAvaliarTxt, { color: minhaNotaAtual > 0 ? C.amber[600] : C.green[600] }]}>
                {minhaNotaAtual > 0 ? 'Minha avaliação' : 'Avaliar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            {receita.tempo_preparo ? (
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="clock-outline" size={15} color={C.green[600]} />
                <Text style={styles.metaChipTxt}>{receita.tempo_preparo}</Text>
              </View>
            ) : null}
            {receita.dificuldade ? (
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="signal-cellular-2" size={15} color={C.green[600]} />
                <Text style={styles.metaChipTxt}>{receita.dificuldade}</Text>
              </View>
            ) : null}
            {receita.rendimento ? (
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="account-group-outline" size={15} color={C.green[600]} />
                <Text style={styles.metaChipTxt}>{receita.rendimento}</Text>
              </View>
            ) : null}
            {(receita.vezes_executada ?? 0) > 0 ? (
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="repeat" size={15} color={C.ink[400]} />
                <Text style={[styles.metaChipTxt, { color: C.ink[500] }]}>{receita.vezes_executada}x feita</Text>
              </View>
            ) : null}
          </View>

          {/* Faltando */}
          {!receita.disponivel && receita.faltando && receita.faltando.length > 0 && (
            <View style={styles.faltandoBox}>
              <MaterialCommunityIcons name="package-variant-remove" size={14} color={C.amber[700]} />
              <Text style={styles.faltandoLabel}>Faltam: </Text>
              <Text style={styles.faltandoItens}>{receita.faltando.join(', ')}</Text>
            </View>
          )}

          {/* ── Ingredientes ─────────────────────────────────────────── */}
          {receita.ingredientes && receita.ingredientes.length > 0 && (
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Ingredientes</Text>
              {receita.ingredientes.map((ing, i) => (
                <View key={i} style={styles.ingredienteItem}>
                  <View style={styles.ingredienteBullet} />
                  <Text style={styles.ingredienteText}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Modo de preparo ──────────────────────────────────────── */}
          {passos.length > 0 && (
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Modo de preparo</Text>
              {passos.map((passo, i) => (
                <View key={i} style={styles.passoItem}>
                  <View style={styles.passoNum}>
                    <Text style={styles.passoNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.passoText}>{passo.replace(/^\d+\.\s*/, '')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Comentários da comunidade ─────────────────────────── */}
          <View style={styles.secao}>
            <View style={styles.comentariosHeader}>
              <Text style={styles.secaoTitulo}>Avaliações da comunidade</Text>
              {loadingComentarios && <ActivityIndicator size="small" color={C.green[500]} />}
            </View>

            {comentarios.length === 0 && !loadingComentarios ? (
              <View style={styles.comentariosVazio}>
                <MaterialCommunityIcons name="comment-outline" size={28} color={C.ink[300]} />
                <Text style={styles.comentariosVazioTxt}>Seja o primeiro a avaliar!</Text>
              </View>
            ) : (
              comentarios.map(c => (
                <View key={c.id} style={styles.comentarioCard}>
                  <View style={styles.comentarioHeader}>
                    {c.autor_avatar ? (
                      <Image source={{ uri: c.autor_avatar }} style={styles.comentarioAvatar} />
                    ) : (
                      <View style={[styles.comentarioAvatar, styles.comentarioAvatarFallback]}>
                        <Text style={styles.comentarioAvatarLetra}>
                          {c.autor_nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.comentarioNomeRow}>
                        <Text style={styles.comentarioNome}>{c.autor_nome}</Text>
                        <Text style={styles.comentarioTempo}>{tempoRelativo(c.criado_em)}</Text>
                      </View>
                      <Estrelas nota={c.nota} tamanho={13} />
                    </View>
                  </View>
                  {c.comentario ? (
                    <Text style={styles.comentarioTexto}>{c.comentario}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

        </View>
      </ScrollView>

      {/* ── Modal de avaliação ──────────────────────────────────────── */}
      <Modal visible={modalAvaliacao} transparent animationType="slide" onRequestClose={() => setModalAvaliacao(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalAvaliacao(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="star-outline" size={22} color={C.amber[500]} />
                <Text style={styles.modalTitulo}>Avaliar receita</Text>
              </View>

              {/* Nome da receita */}
              <Text style={styles.modalReceitaNome} numberOfLines={1}>{receita?.titulo}</Text>

              {/* Estrelas grandes */}
              <View style={styles.estrelasGrandes}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setNotaSelecionada(n)} activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name={n <= notaSelecionada ? 'star' : 'star-outline'}
                      size={44}
                      color={n <= notaSelecionada ? C.amber[400] : C.ink[300]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {notaSelecionada > 0 && (
                <Text style={styles.notaLabel}>
                  {['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente!'][notaSelecionada]}
                </Text>
              )}

              {/* Campo de comentário */}
              <TextInput
                style={styles.comentarioInput}
                placeholder="Deixe um comentário (opcional)..."
                placeholderTextColor={C.ink[400]}
                value={textoComentario}
                onChangeText={setTextoComentario}
                multiline
                numberOfLines={3}
                maxLength={500}
              />

              <TouchableOpacity
                style={[styles.modalBtn, (notaSelecionada === 0 || enviandoAvaliacao) && styles.modalBtnDisabled]}
                onPress={enviarAvaliacao}
                disabled={notaSelecionada === 0 || enviandoAvaliacao}
                activeOpacity={0.85}
              >
                {enviandoAvaliacao ? (
                  <ActivityIndicator size="small" color={C.ink[0]} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send-outline" size={18} color={C.ink[0]} />
                    <Text style={styles.modalBtnTxt}>Enviar avaliação</Text>
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal sugerir foto ──────────────────────────────────────── */}
      <Modal visible={modalFoto} transparent animationType="slide" onRequestClose={() => { setModalFoto(false); setFotoUri(null); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setModalFoto(false); setFotoUri(null); }}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="camera-plus-outline" size={22} color={C.green[600]} />
              <Text style={styles.modalTitulo}>Sugerir nova foto</Text>
            </View>
            <Text style={styles.modalSub}>
              Tire uma foto do prato ou escolha da galeria. Nossa equipe revisa antes de publicar.
            </Text>
            {fotoUri ? (
              <View>
                <Image source={{ uri: fotoUri }} style={styles.modalPreview} resizeMode="cover" />
                <TouchableOpacity style={styles.modalTrocar} onPress={() => setFotoUri(null)}>
                  <MaterialCommunityIcons name="refresh" size={14} color={C.ink[500]} />
                  <Text style={styles.modalTrocarTxt}>Trocar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalOpcoes}>
                <TouchableOpacity style={styles.modalOpcaoBtn} onPress={abrirCamera} activeOpacity={0.8}>
                  <View style={styles.modalOpcaoIcone}>
                    <MaterialCommunityIcons name="camera-outline" size={28} color={C.green[600]} />
                  </View>
                  <Text style={styles.modalOpcaoTxt}>Tirar foto</Text>
                </TouchableOpacity>
                <View style={styles.modalDivisor} />
                <TouchableOpacity style={styles.modalOpcaoBtn} onPress={abrirGaleria} activeOpacity={0.8}>
                  <View style={styles.modalOpcaoIcone}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={28} color={C.ink[600]} />
                  </View>
                  <Text style={styles.modalOpcaoTxt}>Galeria</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.modalBtn, (!fotoUri || enviandoFoto) && styles.modalBtnDisabled]}
              onPress={handleSugerirFoto}
              disabled={!fotoUri || enviandoFoto}
              activeOpacity={0.85}
            >
              {enviandoFoto ? (
                <ActivityIndicator size="small" color={C.ink[0]} />
              ) : (
                <>
                  <MaterialCommunityIcons name="send-outline" size={18} color={C.ink[0]} />
                  <Text style={styles.modalBtnTxt}>Enviar para análise</Text>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Barra de ações fixas ────────────────────────────────────── */}
      <View style={styles.actionsBarWrap}>
        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.btnSecundario} onPress={abrirModalAvaliacao} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name={minhaNotaAtual > 0 ? 'star' : 'star-outline'}
              size={18}
              color={minhaNotaAtual > 0 ? C.amber[500] : C.ink[500]}
            />
            <Text style={[styles.btnSecundarioTxt, { color: minhaNotaAtual > 0 ? C.amber[600] : C.ink[600] }]}>
              Avaliar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimario, !receita.disponivel && styles.btnPrimarioDesabilitado]}
            onPress={handleFiz}
            disabled={executando || !receita.disponivel}
            activeOpacity={0.85}
          >
            {executando ? (
              <ActivityIndicator size="small" color={C.ink[0]} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={18} color={C.ink[0]} />
                <Text style={styles.btnPrimarioTxt}>Fiz essa!</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Modal Fiz essa! ─────────────────────────────────────────── */}
      <Modal visible={modalFiz} transparent animationType="slide" onRequestClose={() => setModalFiz(false)}>
        <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setModalFiz(false)} activeOpacity={1} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="check-circle" size={22} color={C.green[600]} />
              <Text style={styles.modalTitulo}>O que acabou?</Text>
            </View>
            <Text style={styles.modalSub}>Marque os ingredientes que você usou e acabaram</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {invItens.length === 0 && (
                <Text style={[styles.modalSub, { textAlign: 'center', paddingVertical: 12 }]}>
                  Nenhum ingrediente encontrado na receita
                </Text>
              )}
              {invItens.map((item: any) => {
                const nome = item.nome_display || item.nome || '';
                const marcado = selecionadosFiz.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelecionadosFiz(prev => {
                      const next = new Set(prev);
                      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                      return next;
                    })}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingVertical: 10, paddingHorizontal: 8,
                      borderBottomWidth: 1, borderBottomColor: C.ink[100],
                      backgroundColor: marcado ? C.green[50] : 'transparent',
                      borderRadius: 6, marginVertical: 1,
                    }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      borderWidth: 2, borderColor: marcado ? C.green[500] : C.ink[300],
                      backgroundColor: marcado ? C.green[500] : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {marcado && <MaterialCommunityIcons name="check" size={13} color={C.ink[0]} />}
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, color: C.ink[800] }}>{nome}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Outro — restante do inventário */}
              {invExtras.length > 0 && (
                <>
                  <TouchableOpacity
                    onPress={() => setMostrarExtras(p => !p)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      paddingVertical: 10, paddingHorizontal: 8, marginTop: 6,
                      borderWidth: 1, borderColor: C.ink[200], borderRadius: 6,
                      borderStyle: 'dashed',
                    }}
                  >
                    <MaterialCommunityIcons
                      name={mostrarExtras ? 'chevron-up' : 'chevron-down'}
                      size={18} color={C.ink[400]}
                    />
                    <Text style={{ fontSize: 14, color: C.ink[500] }}>
                      Outro ({invExtras.length} itens da despensa)
                    </Text>
                  </TouchableOpacity>
                  {mostrarExtras && invExtras.map((item: any) => {
                    const nome = item.nome_display || item.nome || '';
                    const marcado = selecionadosFiz.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelecionadosFiz(prev => {
                          const next = new Set(prev);
                          next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                          return next;
                        })}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 12,
                          paddingVertical: 10, paddingHorizontal: 8,
                          borderBottomWidth: 1, borderBottomColor: C.ink[100],
                          backgroundColor: marcado ? C.green[50] : 'transparent',
                          borderRadius: 6, marginVertical: 1,
                        }}
                      >
                        <View style={{
                          width: 22, height: 22, borderRadius: 11,
                          borderWidth: 2, borderColor: marcado ? C.green[500] : C.ink[300],
                          backgroundColor: marcado ? C.green[500] : 'transparent',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          {marcado && <MaterialCommunityIcons name="check" size={13} color={C.ink[0]} />}
                        </View>
                        <Text style={{ flex: 1, fontSize: 15, color: C.ink[700] }}>{nome}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalBtn, confirmandoFiz && { opacity: 0.6 }]}
              onPress={confirmarFiz}
              disabled={confirmandoFiz}
              activeOpacity={0.85}
            >
              {confirmandoFiz ? (
                <ActivityIndicator size="small" color={C.ink[0]} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color={C.ink[0]} />
                  <Text style={styles.modalBtnTxt}>
                    {selecionadosFiz.size > 0
                      ? `Confirmar (${selecionadosFiz.size} acabou)`
                      : 'Confirmar receita feita'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { height: 280, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroImgFallback: { backgroundColor: C.ink[150], alignItems: 'center', justifyContent: 'center' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.ink[0], alignItems: 'center', justifyContent: 'center', ...shadows.md,
  },
  heroBtn: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.ink[0], alignItems: 'center', justifyContent: 'center', ...shadows.md,
  },

  content: { padding: 20, gap: 16 },

  tituloRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titulo: { flex: 1, fontSize: 26, fontWeight: '800', color: C.ink[900], letterSpacing: -0.4, lineHeight: 32 },
  coberturaTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, marginTop: 4,
  },
  coberturaTagText: { fontSize: 12, fontWeight: '700' },

  // Avaliação
  avaliacaoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  avaliacaoMedia: { ...T.small, fontWeight: '700', color: C.amber[700] },
  avaliacaoSemNota: { ...T.small, color: C.ink[400] },
  avaliacaoContagem: { ...T.small, color: C.ink[400] },
  btnAvaliar: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    backgroundColor: C.green[50], paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.green[200],
  },
  btnAvaliarTxt: { fontSize: 12, fontWeight: '700' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.green[50], paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.green[100],
  },
  metaChipTxt: { ...T.small, color: C.green[700], fontWeight: '600' },

  faltandoBox: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4,
    backgroundColor: C.amber[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.amber[100], padding: 12,
  },
  faltandoLabel: { ...T.small, color: C.amber[700], fontWeight: '700' },
  faltandoItens: { ...T.small, color: C.amber[700] },

  secao: { gap: 10 },
  secaoTitulo: { fontSize: 17, fontWeight: '700', color: C.ink[900], letterSpacing: -0.1, marginBottom: 2 },

  ingredienteItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  ingredienteBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green[500], flexShrink: 0 },
  ingredienteText: { ...T.body, color: C.ink[700], flex: 1 },

  passoItem: { flexDirection: 'row', gap: 12, paddingVertical: 6 },
  passoNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  passoNumText: { fontSize: 12, fontWeight: '800', color: C.ink[0] },
  passoText: { ...T.body, color: C.ink[700], flex: 1, lineHeight: 22 },

  // Comentários
  comentariosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comentariosVazio: {
    alignItems: 'center', paddingVertical: 24, gap: 8,
    backgroundColor: C.ink[50], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], borderStyle: 'dashed',
  },
  comentariosVazioTxt: { ...T.small, color: C.ink[400] },
  comentarioCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], padding: 14, gap: 8,
  },
  comentarioHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  comentarioAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.green[100] },
  comentarioAvatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.green[500] },
  comentarioAvatarLetra: { fontSize: 15, fontWeight: '700', color: C.ink[0] },
  comentarioNomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  comentarioNome: { ...T.small, fontWeight: '700', color: C.ink[900] },
  comentarioTempo: { ...T.micro, color: C.ink[400] },
  comentarioTexto: { ...T.small, color: C.ink[600], lineHeight: 19 },

  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 24, paddingBottom: 36, gap: 14,
    ...shadows.modal,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.ink[200], alignSelf: 'center', marginBottom: 4,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitulo: { ...T.h3, color: C.ink[900] },
  modalSub: { ...T.small, color: C.ink[500], lineHeight: 19 },
  modalReceitaNome: { ...T.small, color: C.ink[500], fontStyle: 'italic' },
  estrelasGrandes: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  notaLabel: { ...T.body, color: C.amber[700], fontWeight: '700', textAlign: 'center', marginTop: -6 },
  comentarioInput: {
    borderWidth: 1, borderColor: C.ink[200], borderRadius: radius.md,
    padding: 12, minHeight: 80, textAlignVertical: 'top',
    ...T.body, color: C.ink[900], backgroundColor: C.ink[50],
  },
  modalOpcoes: {
    flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, borderColor: C.ink[150], overflow: 'hidden',
  },
  modalOpcaoBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 },
  modalOpcaoIcone: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.ink[50], alignItems: 'center', justifyContent: 'center',
  },
  modalOpcaoTxt: { ...T.small, color: C.ink[700], fontWeight: '600' },
  modalDivisor: { width: 1, backgroundColor: C.ink[150] },
  modalPreview: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: C.ink[100] },
  modalTrocar: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingTop: 8 },
  modalTrocarTxt: { ...T.small, color: C.ink[500] },
  modalBtn: {
    height: 52, borderRadius: radius.md, backgroundColor: C.green[500],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modalBtnDisabled: { opacity: 0.4 },
  modalBtnTxt: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // Barra de ações
  actionsBarWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopColor: C.ink[150], ...shadows.md,
  },
  actionsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10,
    backgroundColor: C.ink[0],
  },
  btnSecundario: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    height: 44, borderRadius: radius.md, backgroundColor: C.ink[50], borderWidth: 1, borderColor: C.ink[200],
  },
  btnSecundarioTxt: { fontSize: 12, fontWeight: '700', color: C.green[600] },
  btnPrimario: {
    flex: 1.3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: radius.md, backgroundColor: C.green[500], ...shadows.sm,
  },
  btnPrimarioDesabilitado: { backgroundColor: C.ink[200] },
  btnPrimarioTxt: { fontSize: 14, fontWeight: '700', color: C.ink[0] },
});
