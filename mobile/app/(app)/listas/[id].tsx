import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useListas } from '@/hooks/useListas';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

type ModalMode = 'form' | 'camera';

export default function ListDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, titulo } = useLocalSearchParams<{ id: string; titulo: string }>();
  const { listaAtual, loading, carregarLista, adicionarItem, atualizarItem, deletarItem, marcarComprado, limparComprados } = useListas();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('form');
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [nome, setNome] = useState('');
  const [qtd, setQtd] = useState('1');
  const [unidade, setUnidade] = useState('');
  const [codigoEscaneado, setCodigoEscaneado] = useState('');

  const UNIDADES = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct'];

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useFocusEffect(useCallback(() => { if (id) carregarLista(id); }, [id, carregarLista]));

  const resetForm = () => {
    setNome(''); setQtd('1'); setUnidade(''); setCodigoEscaneado('');
    setSelectedItem(null); setEditMode(false);
    setModalVisible(false); setScanned(false);
  };

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) { Alert.alert('Câmera', 'Permissão de câmera necessária'); return; }
    }
    setScanned(false);
    setModalMode('camera');
    setModalVisible(true);
  };

  const handleBarcodeScanned = ({ data: barcode }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(80);
    setCodigoEscaneado(barcode);
    setModalMode('form');
  };

  const handleSubmit = async () => {
    if (!nome.trim()) { Alert.alert('Erro', 'Nome é obrigatório'); return; }
    const quantidade = parseFloat(qtd.replace(',', '.')) || 1;
    try {
      if (editMode && selectedItem) {
        await atualizarItem(selectedItem.id, { nome, quantidade, unidade: unidade || undefined });
      } else {
        await adicionarItem(nome, quantidade, unidade || undefined);
      }
      resetForm();
    } catch { Alert.alert('Erro', 'Falha ao salvar item'); }
  };

  const handleEditar = (item: any) => {
    setSelectedItem(item); setNome(item.nome);
    setQtd(String(item.quantidade || 1));
    setUnidade(item.unidade || '');
    setCodigoEscaneado('');
    setEditMode(true); setModalMode('form'); setModalVisible(true);
  };

  const handleDeletar = (itemId: string, itemNome: string) => {
    Alert.alert('Deletar', `Deletar "${itemNome}"?`, [
      { text: 'Cancelar' },
      { text: 'Deletar', style: 'destructive', onPress: () => deletarItem(itemId) },
    ]);
  };

  const itens = listaAtual?.itens || [];
  const comprados = itens.filter((i: any) => i.comprado);
  const pendentes = itens.filter((i: any) => !i.comprado);
  const pct = itens.length > 0 ? Math.round((comprados.length / itens.length) * 100) : 0;

  if (loading && !listaAtual) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={C.green[500]} /></View>;
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[800]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{titulo}</Text>
          <Text style={styles.headerSub}>{itens.length} itens</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            const n = listaAtual?.itens?.filter((i: any) => i.comprado).length || 0;
            if (!n) { Alert.alert('Info', 'Nenhum item comprado'); return; }
            Alert.alert('Limpar', `Remover ${n} item(ns) comprado(s)?`, [
              { text: 'Cancelar' },
              { text: 'Remover', style: 'destructive', onPress: () => limparComprados() },
            ]);
          }}
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons name="broom" size={20} color={C.ink[500]} />
        </TouchableOpacity>
      </View>


      {/* List */}
      {itens.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="cart-outline" size={44} color={C.green[500]} />
          </View>
          <Text style={styles.emptyTitle}>Lista vazia</Text>
          <Text style={styles.emptySub}>Toque em + para adicionar itens</Text>
        </View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, item.comprado && styles.itemCardComprado]}>
              <TouchableOpacity onPress={() => marcarComprado(item.id, !item.comprado)} style={styles.checkboxWrap}>
                <View style={[styles.checkboxInner, item.comprado && styles.checkboxChecked]}>
                  {item.comprado && <MaterialCommunityIcons name="check" size={14} color={C.ink[0]} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.itemBody} onPress={() => handleEditar(item)}>
                <Text style={[styles.itemNome, item.comprado && styles.itemNomeComprado]} numberOfLines={1}>
                  {item.nome}
                </Text>
                <View style={styles.itemMeta}>
                  {item.quantidade && <Text style={styles.metaText}>{Number(item.quantidade).toLocaleString('pt-BR')}{item.unidade ? ` ${item.unidade}` : ''}</Text>}
                  {item.preco_unitario && <Text style={styles.metaText}>· R$ {Number(item.preco_unitario).toFixed(2)}</Text>}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeletar(item.id, item.nome)} style={{ padding: 6 }}>
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={C.red[500]} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FABs */}
      <View style={[styles.fabRow, { bottom: 28 + insets.bottom }]}>
        <TouchableOpacity style={styles.fabSecundario} onPress={openScanner}>
          <MaterialCommunityIcons name="barcode-scan" size={22} color={C.green[600]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { resetForm(); setModalMode('form'); setModalVisible(true); }}
        >
          <MaterialCommunityIcons name="plus" size={26} color={C.ink[0]} />
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={resetForm}>
        <View style={styles.overlay}>

          {/* ── Camera view ── */}
          {modalMode === 'camera' && (
            <View style={styles.cameraSheet}>
              <View style={styles.cameraHandle} />
              <View style={styles.cameraHeader}>
                <Text style={styles.cameraTitle}>Escanear código de barras</Text>
                <TouchableOpacity onPress={resetForm} style={styles.cameraCloseBtn}>
                  <MaterialCommunityIcons name="close" size={18} color={C.ink[700]} />
                </TouchableOpacity>
              </View>
              <View style={styles.cameraContainer}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'code128', 'upc_a', 'upc_e', 'code39'],
                  }}
                />
                <View style={styles.cameraOverlay}>
                  <View style={styles.cameraVisor}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                  <Text style={styles.cameraHint}>Aponte para o código de barras do produto</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Formulário ── */}
          {modalMode === 'form' && (
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editMode ? 'Editar Item' : 'Novo Item'}</Text>
                <TouchableOpacity onPress={resetForm} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={18} color={C.ink[700]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={[styles.input, { marginBottom: codigoEscaneado ? 6 : 14 }]}
                placeholder="Ex: Arroz"
                placeholderTextColor={C.ink[400]}
                value={nome}
                onChangeText={setNome}
              />
              {!!codigoEscaneado && (
                <View style={styles.codigoTag}>
                  <MaterialCommunityIcons name="barcode" size={13} color={C.ink[500]} />
                  <Text style={styles.codigoText}>{codigoEscaneado}</Text>
                </View>
              )}

              <Text style={[styles.label, { marginTop: 14 }]}>Quantidade</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="1"
                  placeholderTextColor={C.ink[400]}
                  value={qtd}
                  onChangeText={setQtd}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, { width: 72, textAlign: 'center' }]}
                  placeholder="un"
                  placeholderTextColor={C.ink[400]}
                  value={unidade}
                  onChangeText={setUnidade}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.unidadeChips}>
                {UNIDADES.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unidadeChip, unidade === u && styles.unidadeChipAtivo]}
                    onPress={() => setUnidade(unidade === u ? '' : u)}
                  >
                    <Text style={[styles.unidadeChipText, unidade === u && styles.unidadeChipTextAtivo]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.modalActions, { marginTop: 20 }]}>
                <TouchableOpacity style={styles.btnCancel} onPress={resetForm}>
                  <Text style={styles.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSubmit} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color={C.ink[0]} />
                    : <Text style={styles.btnSaveText}>{editMode ? 'Atualizar' : 'Adicionar'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...T.h2, color: C.ink[900] },
  headerSub: { ...T.small, color: C.ink[500], marginTop: 1 },

  statsCard: {
    marginHorizontal: 20, marginTop: 14,
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    padding: 16, borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...T.h2, color: C.green[600] },
  statLabel: { ...T.micro, color: C.ink[500], marginTop: 2 },
  statDiv: { width: 1, height: 28, backgroundColor: C.ink[200] },
  progressBar: { height: 6, backgroundColor: C.ink[150], borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.green[500], borderRadius: 3 },

  list: { paddingHorizontal: 20, paddingTop: 14 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.ink[0], borderRadius: radius.md,
    padding: 12, borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
  },
  itemCardComprado: { opacity: 0.55 },
  checkboxWrap: { padding: 2 },
  checkboxInner: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: C.ink[200],
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: C.green[500], borderColor: C.green[500] },
  itemBody: { flex: 1, minWidth: 0 },
  itemNome: { ...T.body, color: C.ink[800], fontWeight: '600', marginBottom: 2 },
  itemNomeComprado: { textDecorationLine: 'line-through', color: C.ink[400] },
  itemMeta: { flexDirection: 'row', gap: 6 },
  metaText: { ...T.small, color: C.ink[500] },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h3, color: C.ink[700] },
  emptySub: { ...T.body, color: C.ink[400] },

  fabRow: {
    position: 'absolute', right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
    ...shadows.lg,
  },
  fabSecundario: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.ink[0], alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.green[200], ...shadows.md,
  },

  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },

  // ── Camera ──
  cameraSheet: {
    height: '75%', backgroundColor: C.ink[0],
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    overflow: 'hidden', ...shadows.modal,
  },
  cameraHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.ink[200], alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  cameraHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  cameraTitle: { ...T.h3, color: C.ink[900] },
  cameraCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  cameraContainer: { flex: 1, position: 'relative' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cameraVisor: { width: 240, height: 140, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: C.green[400], borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  cameraHint: { ...T.small, color: C.ink[0], marginTop: 24, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },

  // ── Form ──
  modal: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36,
    ...shadows.modal,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...T.h2, color: C.ink[900] },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },

  codigoTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: 8, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: C.ink[100], borderRadius: radius.sm, alignSelf: 'flex-start',
  },
  codigoText: { ...T.micro, color: C.ink[600], fontFamily: 'monospace' },

  label: { ...T.small, color: C.ink[700], fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: C.ink[50], borderWidth: 1, borderColor: C.ink[200],
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.ink[900],
  },

  unidadeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unidadeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: C.ink[200], backgroundColor: C.ink[50],
  },
  unidadeChipAtivo: { borderColor: C.green[500], backgroundColor: C.green[50] },
  unidadeChipText: { fontSize: 13, fontWeight: '600', color: C.ink[500] },
  unidadeChipTextAtivo: { color: C.green[600] },
  modalActions: { flexDirection: 'row', gap: 10 },
  btnCancel: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: C.ink[0], borderWidth: 1, borderColor: C.ink[200], alignItems: 'center' },
  btnCancelText: { ...T.body, color: C.ink[700], fontWeight: '600' },
  btnSave: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: C.green[500], alignItems: 'center', ...shadows.sm },
  btnSaveText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
