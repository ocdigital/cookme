import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useListas } from '@/hooks/useListas';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenTutorial from '@/components/ScreenTutorial';
import { useScreenTutorial } from '@/hooks/useScreenTutorial';
import api from '@/services/api';
import listaService from '@/services/lista.service';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { queryKeys } from '@/lib/queryKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompraResumo {
  id: string;
  local_compra?: string;
  data_compra: string;
  valor_total: number;
  itens?: { id: string }[];
}

interface ItemRevisar {
  key: string;        // produto_id ou uuid local
  nome: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  incluido: boolean;
  manual?: boolean;   // item adicionado manualmente
}

type ModalStep = 'closed' | 'escolher' | 'form' | 'compras' | 'revisar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const valorCompra = (c: CompraResumo): number => {
  const vt = Number(c.valor_total);
  if (vt > 0) return vt;
  return (c.itens ?? []).reduce((s: number) => s, 0); // fallback: só mostra 0 aqui, itens não vêm nessa rota
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ListasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { listas, loading, criarLista, carregarListas, carregarLista, deletarLista, duplicarLista } = useListas();
  const { showTutorial, dismissTutorial } = useScreenTutorial('listas');
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable;

  // ── Modal flow ──
  const [step, setStep] = useState<ModalStep>('closed');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  // ── Compras ──
  const [compras, setCompras] = useState<CompraResumo[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);

  // ── Revisão de itens ──
  const [itens, setItens] = useState<ItemRevisar[]>([]);
  const [novoItem, setNovoItem] = useState('');
  const [criando, setCriando] = useState(false);

  useFocusEffect(useCallback(() => { carregarListas(); }, [carregarListas]));

  // ── Abrir modal ──────────────────────────────────────────────────────────────

  const abrirModal = () => {
    setTitulo(''); setDescricao(''); setItens([]); setNovoItem('');
    setStep('escolher');
  };

  const fecharModal = () => setStep('closed');

  // ── Fluxo "lista em branco" ──────────────────────────────────────────────────

  const irParaForm = () => setStep('form');

  const handleCriarEmBranco = async () => {
    if (!titulo.trim()) { Alert.alert('Erro', 'Nome da lista é obrigatório'); return; }
    if (!isOnline) {
      Alert.alert('Sem conexão', 'Esta ação requer conexão com a internet.');
      return;
    }
    try {
      setCriando(true);
      await criarLista(titulo.trim(), descricao.trim() || undefined);
      fecharModal();
    } catch { Alert.alert('Erro', 'Falha ao criar lista'); }
    finally { setCriando(false); }
  };

  // ── Fluxo "importar de cupom" ─────────────────────────────────────────────────

  const irParaCompras = async () => {
    setStep('compras');
    setLoadingCompras(true);
    try {
      const res = await api.get('/compras', { params: { limit: 30 } });
      setCompras(res.data || []);
    } catch { Alert.alert('Erro', 'Não foi possível carregar os cupons'); setStep('escolher'); }
    finally { setLoadingCompras(false); }
  };

  const selecionarCompra = async (compra: CompraResumo) => {
    try {
      setLoadingCompras(true);
      const res = await api.get(`/compras/${compra.id}`);
      const compraDetalhada = res.data;
      const itensOriginais: ItemRevisar[] = (compraDetalhada.itens ?? [])
        .filter((i: any) => i.produto?.nome)
        .map((i: any) => ({
          key: i.produto?.id ?? i.id ?? Math.random().toString(),
          nome: i.produto?.nome ?? 'Produto',
          quantidade: Number(i.quantidade) || 1,
          unidade: i.unidade || 'un',
          preco_unitario: Number(i.preco_unitario) || 0,
          incluido: true,
        }));

      // Deduplica por nome — soma qtd se mesmo produto aparecer mais de uma vez
      const dedup = new Map<string, ItemRevisar>();
      for (const it of itensOriginais) {
        const chave = it.nome.toLowerCase().trim();
        if (dedup.has(chave)) {
          dedup.get(chave)!.quantidade += it.quantidade;
        } else {
          dedup.set(chave, { ...it });
        }
      }

      setItens(Array.from(dedup.values()));
      setTitulo(`Lista de compras de ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`);
      setStep('revisar');
    } catch { Alert.alert('Erro', 'Não foi possível carregar os itens do cupom'); }
    finally { setLoadingCompras(false); }
  };

  // ── Revisar itens ─────────────────────────────────────────────────────────────

  const toggleItem = (key: string) =>
    setItens(prev => prev.map(i => i.key === key ? { ...i, incluido: !i.incluido } : i));

  const alterarQtd = (key: string, valor: string) => {
    const n = parseFloat(valor.replace(',', '.'));
    setItens(prev => prev.map(i => i.key === key ? { ...i, quantidade: isNaN(n) ? i.quantidade : n } : i));
  };

  const removerItem = (key: string) => setItens(prev => prev.filter(i => i.key !== key));

  const adicionarItemManual = () => {
    const nome = novoItem.trim();
    if (!nome) return;
    const key = `manual-${Date.now()}`;
    setItens(prev => [...prev, { key, nome, quantidade: 1, unidade: 'un', preco_unitario: 0, incluido: true, manual: true }]);
    setNovoItem('');
  };

  const handleCriarImportada = async () => {
    if (!isOnline) {
      Alert.alert('Sem conexão', 'Esta ação requer conexão com a internet.');
      return;
    }
    const tituloFinal = titulo.trim() || `Lista de compras de ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`;
    const incluidos = itens.filter(i => i.incluido);
    if (incluidos.length === 0) { Alert.alert('Aviso', 'Selecione pelo menos um item'); return; }
    try {
      setCriando(true);
      const lista = await listaService.criarLista(tituloFinal, descricao.trim() || undefined);

      let falhas = 0;
      for (const item of incluidos) {
        try {
          await listaService.adicionarItem(
            lista.id,
            item.nome,
            Math.round(Number(item.quantidade) * 1000) / 1000,
            item.unidade,
            item.preco_unitario > 0 ? Math.round(Number(item.preco_unitario) * 100) / 100 : undefined,
          );
        } catch {
          falhas++;
        }
      }

      fecharModal();
      await carregarListas();
      carregarLista(lista.id);
      router.push({ pathname: '/(app)/listas/[id]', params: { id: lista.id, titulo: lista.titulo } });

      if (falhas > 0) {
        Alert.alert('Aviso', `${falhas} item(ns) não puderam ser adicionados à lista.`);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao criar lista');
    } finally {
      setCriando(false);
    }
  };

  // ── Cards da lista ────────────────────────────────────────────────────────────

  const renderLista = ({ item }: any) => {
    const total = item.itens?.length || 0;
    const comprados = item.itens?.filter((i: any) => i.comprado).length || 0;
    const pct = total > 0 ? Math.round((comprados / total) * 100) : 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { carregarLista(item.id); router.push({ pathname: '/(app)/listas/[id]', params: { id: item.id, titulo: item.titulo } }); }}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardIconWrap}>
            <MaterialCommunityIcons name="cart-outline" size={20} color={C.green[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitulo}>{item.titulo}</Text>
            <Text style={styles.cardSub}>{total} itens · {pct}% completo</Text>
          </View>
          <TouchableOpacity onPress={() => duplicarLista(item.id)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="content-copy" size={17} color={C.ink[400]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('Deletar', `Deseja deletar "${item.titulo}"?`, [
              { text: 'Cancelar' },
              { text: 'Deletar', style: 'destructive', onPress: () => deletarLista(item.id) },
            ])}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={17} color={C.red[500]} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="shopping-outline" size={14} color={C.ink[500]} />
            <Text style={styles.statText}>{total - comprados} restando</Text>
          </View>
          {Number(item.total_estimado) > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="cash" size={14} color={C.ink[500]} />
              <Text style={styles.statText}>R$ {Number(item.total_estimado).toFixed(2)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Modal content por step ────────────────────────────────────────────────────

  const incluidos = itens.filter(i => i.incluido).length;

  const renderModalContent = () => {
    // ── Escolher tipo ──
    if (step === 'escolher') return (
      <View style={styles.modal}>
        <ModalHandle />
        <Text style={styles.modalTitle}>Nova Lista</Text>
        <Text style={styles.modalSub}>Como deseja criar?</Text>
        <View style={styles.escolherGrid}>
          <TouchableOpacity style={styles.escolherCard} onPress={irParaForm} activeOpacity={0.8}>
            <View style={[styles.escolherIcone, { backgroundColor: C.green[50] }]}>
              <MaterialCommunityIcons name="playlist-plus" size={28} color={C.green[600]} />
            </View>
            <Text style={styles.escolherLabel}>Lista em branco</Text>
            <Text style={styles.escolherSub}>Adicione itens manualmente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.escolherCard} onPress={irParaCompras} activeOpacity={0.8}>
            <View style={[styles.escolherIcone, { backgroundColor: C.amber[50] }]}>
              <MaterialCommunityIcons name="receipt" size={28} color={C.amber[600]} />
            </View>
            <Text style={styles.escolherLabel}>Importar cupom</Text>
            <Text style={styles.escolherSub}>Use uma compra feita como base</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnCancelar} onPress={fecharModal}>
          <Text style={styles.btnCancelarTxt}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );

    // ── Formulário lista em branco ──
    if (step === 'form') return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <ModalHandle />
          <View style={styles.modalHeaderRow}>
            <TouchableOpacity onPress={() => setStep('escolher')} style={styles.backBtnSmall}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={C.ink[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Lista em branco</Text>
          </View>
          <TextInput style={styles.input} placeholder="Nome da lista *" placeholderTextColor={C.ink[400]}
            value={titulo} onChangeText={setTitulo} />
          <TextInput style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
            placeholder="Descrição (opcional)" placeholderTextColor={C.ink[400]}
            value={descricao} onChangeText={setDescricao} multiline />
          <View style={styles.rowBtns}>
            <TouchableOpacity style={styles.btnCancelar} onPress={fecharModal}>
              <Text style={styles.btnCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimario} onPress={handleCriarEmBranco} disabled={criando}>
              {criando ? <ActivityIndicator color={C.ink[0]} size="small" />
                : <Text style={styles.btnPrimarioTxt}>Criar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );

    // ── Escolher compra ──
    if (step === 'compras') return (
      <View style={[styles.modal, { maxHeight: '85%' }]}>
        <ModalHandle />
        <View style={styles.modalHeaderRow}>
          <TouchableOpacity onPress={() => setStep('escolher')} style={styles.backBtnSmall}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={C.ink[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Escolher cupom</Text>
        </View>
        {loadingCompras ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={C.green[500]} size="large" />
          </View>
        ) : compras.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="receipt-outline" size={40} color={C.ink[300]} />
            <Text style={{ ...T.body, color: C.ink[500], textAlign: 'center' }}>
              Nenhum cupom cadastrado ainda
            </Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {compras.map(c => (
              <TouchableOpacity key={c.id} style={styles.compraRow} onPress={() => selecionarCompra(c)} activeOpacity={0.75}>
                <View style={styles.compraIcone}>
                  <MaterialCommunityIcons name="receipt" size={18} color={C.amber[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compraLocal} numberOfLines={1}>{c.local_compra || 'Local não informado'}</Text>
                  <Text style={styles.compraData}>{fmtDate(c.data_compra)} · {c.itens?.length ?? 0} itens</Text>
                </View>
                {valorCompra(c) > 0 && (
                  <Text style={styles.compraValor}>R$ {valorCompra(c).toFixed(2).replace('.', ',')}</Text>
                )}
                <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[400]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );

    // ── Revisar itens ──
    if (step === 'revisar') return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.modal, { maxHeight: '95%', paddingBottom: 8 }]}>
          <ModalHandle />
          <View style={styles.modalHeaderRow}>
            <TouchableOpacity onPress={() => setStep('compras')} style={styles.backBtnSmall}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={C.ink[600]} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Revisar itens</Text>
              <Text style={styles.modalSub}>{incluidos} de {itens.length} selecionados</Text>
            </View>
          </View>

          {/* Nome da lista */}
          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            placeholder="Nome da lista"
            placeholderTextColor={C.ink[400]}
            value={titulo}
            onChangeText={setTitulo}
          />

          {/* Itens */}
          <ScrollView style={{ flex: 1, maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {itens.map(item => (
              <View key={item.key} style={[styles.itemRow, !item.incluido && styles.itemRowOff]}>
                <TouchableOpacity onPress={() => toggleItem(item.key)} style={styles.checkbox}>
                  <MaterialCommunityIcons
                    name={item.incluido ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={item.incluido ? C.green[500] : C.ink[300]}
                  />
                </TouchableOpacity>
                <Text style={[styles.itemNome, !item.incluido && { color: C.ink[300] }]} numberOfLines={2}>
                  {item.nome}
                </Text>
                <TextInput
                  style={styles.itemQtdInput}
                  value={String(item.quantidade).replace('.', ',')}
                  onChangeText={v => alterarQtd(item.key, v)}
                  keyboardType="numeric"
                  editable={item.incluido}
                />
                <Text style={[styles.itemUn, !item.incluido && { color: C.ink[300] }]}>{item.unidade}</Text>
                <TouchableOpacity onPress={() => removerItem(item.key)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={16} color={C.ink[300]} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Adicionar item extra */}
            <View style={styles.addItemRow}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={C.green[500]} />
              <TextInput
                style={styles.addItemInput}
                placeholder="Adicionar item..."
                placeholderTextColor={C.ink[400]}
                value={novoItem}
                onChangeText={setNovoItem}
                onSubmitEditing={adicionarItemManual}
                returnKeyType="done"
              />
              {novoItem.trim().length > 0 && (
                <TouchableOpacity onPress={adicionarItemManual} style={styles.addItemBtn}>
                  <Text style={styles.addItemBtnTxt}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={[styles.rowBtns, { marginTop: 12 }]}>
            <TouchableOpacity style={styles.btnCancelar} onPress={fecharModal}>
              <Text style={styles.btnCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimario} onPress={handleCriarImportada} disabled={criando}>
              {criando
                ? <ActivityIndicator color={C.ink[0]} size="small" />
                : <Text style={styles.btnPrimarioTxt}>Criar lista ({incluidos})</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );

    return null;
  };

  // ── Render principal ──────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={22} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Minhas listas</Text>
          <Text style={styles.headerTitle}>{listas.length} {listas.length === 1 ? 'lista' : 'listas'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={abrirModal}>
          <MaterialCommunityIcons name="plus" size={22} color={C.ink[0]} />
        </TouchableOpacity>
      </View>

      <OfflineIndicator queryKey={Array.from(queryKeys.listas())} />

      {loading && listas.length === 0 ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={C.green[500]} /></View>
      ) : (
        <FlatList
          data={listas.filter(l => l.status === 'ativa')}
          renderItem={renderLista}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onRefresh={carregarListas}
          refreshing={loading}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={48} color={C.green[500]} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma lista de compras</Text>
              <Text style={styles.emptySub}>Crie sua primeira lista para começar</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={abrirModal}>
                <MaterialCommunityIcons name="plus" size={18} color={C.ink[0]} />
                <Text style={styles.emptyBtnText}>Criar Lista</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={step !== 'closed'} animationType="slide" transparent onRequestClose={fecharModal}>
        <View style={styles.overlay}>
          {renderModalContent()}
        </View>
      </Modal>

      <ScreenTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        steps={[
          { icon: 'cart-outline', title: 'Listas de compras', description: 'Crie e organize suas listas de compras. Marque os itens conforme vai comprando.' },
          { icon: 'plus-circle-outline', title: 'Nova lista', description: 'Toque no + para criar uma nova lista e adicionar itens com nome, quantidade e prioridade.' },
          { icon: 'barcode-scan', title: 'Pesquisar produto', description: 'Dentro de uma lista, escaneie o código de barras de um item para pesquisar preços e informações.' },
        ]}
      />
    </View>
  );
}

function ModalHandle() {
  return <View style={styles.handle} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  menuBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center', ...shadows.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  card: { backgroundColor: C.ink[0], borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: C.ink[150], ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconWrap: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center' },
  cardTitulo: { ...T.h3, color: C.ink[900], marginBottom: 2 },
  cardSub: { ...T.small, color: C.ink[500] },
  iconBtn: { padding: 6 },
  progressBar: { height: 5, backgroundColor: C.ink[150], borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: C.green[500], borderRadius: 3 },
  cardBottom: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { ...T.small, color: C.ink[500] },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { ...T.h3, color: C.ink[800] },
  emptySub: { ...T.body, color: C.ink[500] },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.green[500], borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8, ...shadows.sm },
  emptyBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // ── Modal ──
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
    ...shadows.modal,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.ink[200], alignSelf: 'center', marginBottom: 16 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  backBtnSmall: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  modalTitle: { ...T.h2, color: C.ink[900] },
  modalSub: { ...T.small, color: C.ink[400], marginTop: 4, marginBottom: 20 },

  input: {
    backgroundColor: C.ink[50], borderWidth: 1, borderColor: C.ink[200],
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.ink[900], marginBottom: 12,
  },

  rowBtns: { flexDirection: 'row', gap: 10 },
  btnCancelar: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: C.ink[0], borderWidth: 1, borderColor: C.ink[200], alignItems: 'center' },
  btnCancelarTxt: { ...T.body, color: C.ink[700], fontWeight: '600' },
  btnPrimario: { flex: 2, paddingVertical: 14, borderRadius: radius.md, backgroundColor: C.green[500], alignItems: 'center', ...shadows.sm },
  btnPrimarioTxt: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // ── Escolher ──
  escolherGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  escolherCard: {
    flex: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: C.ink[150],
    padding: 16, alignItems: 'center', gap: 8, backgroundColor: C.ink[0], ...shadows.sm,
  },
  escolherIcone: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  escolherLabel: { ...T.small, color: C.ink[800], fontWeight: '700', textAlign: 'center' },
  escolherSub: { ...T.micro, color: C.ink[400], textAlign: 'center', lineHeight: 15 },

  // ── Compras ──
  compraRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.ink[100],
  },
  compraIcone: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.amber[50], alignItems: 'center', justifyContent: 'center' },
  compraLocal: { ...T.body, color: C.ink[800], fontWeight: '600' },
  compraData: { ...T.micro, color: C.ink[400], marginTop: 2 },
  compraValor: { ...T.small, color: C.green[600], fontWeight: '700' },

  // ── Revisar ──
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.ink[100],
  },
  itemRowOff: { opacity: 0.45 },
  checkbox: { padding: 2 },
  itemNome: { flex: 1, ...T.small, color: C.ink[800], fontWeight: '600' },
  itemQtdInput: {
    width: 46, borderWidth: 1, borderColor: C.ink[200], borderRadius: radius.xs,
    paddingHorizontal: 6, paddingVertical: 4, textAlign: 'center',
    fontSize: 13, color: C.ink[800], backgroundColor: C.ink[50],
  },
  itemUn: { ...T.micro, color: C.ink[400], width: 24 },

  addItemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.green[100],
  },
  addItemInput: { flex: 1, fontSize: 14, color: C.ink[800] },
  addItemBtn: {
    backgroundColor: C.green[500], borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addItemBtnTxt: { ...T.micro, color: C.ink[0], fontWeight: '700' },
});
