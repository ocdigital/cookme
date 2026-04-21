import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, SafeAreaView, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useListas } from '@/hooks/useListas';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

const PRIORIDADE_COLORS: Record<string, string> = {
  alta: C.red[500], media: C.amber[500], baixa: C.green[500],
};

export default function ListDetailScreen() {
  const router = useRouter();
  const { id, titulo } = useLocalSearchParams<{ id: string; titulo: string }>();
  const { listaAtual, loading, carregarLista, adicionarItem, atualizarItem, deletarItem, marcarComprado, limparComprados } = useListas();

  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [nome, setNome] = useState('');
  const [qtd, setQtd] = useState('1');
  const [unidade, setUnidade] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loja, setLoja] = useState('');
  const [prioridade, setPrioridade] = useState<'alta' | 'media' | 'baixa'>('media');

  useFocusEffect(useCallback(() => { if (id) carregarLista(id); }, [id, carregarLista]));

  const resetForm = () => {
    setNome(''); setQtd('1'); setUnidade(''); setPreco('');
    setCategoria(''); setLoja(''); setPrioridade('media');
    setSelectedItem(null); setEditMode(false); setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) { Alert.alert('Erro', 'Nome é obrigatório'); return; }
    try {
      if (editMode && selectedItem) {
        await atualizarItem(selectedItem.id, {
          nome, quantidade: parseInt(qtd) || 1, unidade: unidade || undefined,
          preco_unitario: preco ? parseFloat(preco) : undefined,
          categoria: categoria || undefined, loja: loja || undefined, prioridade,
        });
      } else {
        await adicionarItem(nome, parseInt(qtd) || 1, unidade || undefined,
          preco ? parseFloat(preco) : undefined, categoria || undefined, loja || undefined, prioridade);
      }
      resetForm();
    } catch { Alert.alert('Erro', 'Falha ao salvar item'); }
  };

  const handleEditar = (item: any) => {
    setSelectedItem(item); setNome(item.nome); setQtd(item.quantidade?.toString() || '1');
    setUnidade(item.unidade || ''); setPreco(item.preco_unitario?.toString() || '');
    setCategoria(item.categoria || ''); setLoja(item.loja || '');
    setPrioridade(item.prioridade || 'media'); setEditMode(true); setModalVisible(true);
  };

  const handleDeletar = (itemId: string, itemNome: string) => {
    Alert.alert('Deletar', `Deletar "${itemNome}"?`, [
      { text: 'Cancelar' },
      { text: 'Deletar', style: 'destructive', onPress: () => deletarItem(itemId) },
    ]);
  };

  const handleLimparComprados = () => {
    const n = listaAtual?.itens?.filter((i: any) => i.comprado).length || 0;
    if (!n) { Alert.alert('Info', 'Nenhum item comprado'); return; }
    Alert.alert('Limpar', `Remover ${n} item(ns) comprado(s)?`, [
      { text: 'Cancelar' },
      { text: 'Remover', style: 'destructive', onPress: () => limparComprados() },
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[800]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{titulo}</Text>
          <Text style={styles.headerSub}>{itens.length} itens</Text>
        </View>
        <TouchableOpacity onPress={handleLimparComprados} style={styles.backBtn}>
          <MaterialCommunityIcons name="broom" size={20} color={C.ink[500]} />
        </TouchableOpacity>
      </View>

      {/* Stats + progress */}
      {itens.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{pendentes.length}</Text>
              <Text style={styles.statLabel}>Faltam</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{pct}%</Text>
              <Text style={styles.statLabel}>Completo</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>R$ {(listaAtual?.total_gasto || 0).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
        </View>
      )}

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
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, item.comprado && styles.itemCardComprado]}>
              <TouchableOpacity onPress={() => marcarComprado(item.id, !item.comprado)} style={styles.checkbox}>
                <View style={[styles.checkboxInner, item.comprado && styles.checkboxChecked]}>
                  {item.comprado && <MaterialCommunityIcons name="check" size={14} color={C.ink[0]} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.itemBody} onPress={() => handleEditar(item)}>
                <View style={styles.itemTop}>
                  <Text style={[styles.itemNome, item.comprado && styles.itemNomeComprado]} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  {item.prioridade && (
                    <View style={[styles.prioBadge, { backgroundColor: PRIORIDADE_COLORS[item.prioridade] + '20' }]}>
                      <View style={[styles.prioDot, { backgroundColor: PRIORIDADE_COLORS[item.prioridade] }]} />
                      <Text style={[styles.prioText, { color: PRIORIDADE_COLORS[item.prioridade] }]}>
                        {item.prioridade}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.itemMeta}>
                  {item.quantidade && <Text style={styles.metaText}>{item.quantidade}{item.unidade ? ` ${item.unidade}` : ''}</Text>}
                  {item.preco_unitario && <Text style={styles.metaText}>· R$ {item.preco_unitario.toFixed(2)}</Text>}
                  {item.categoria && <Text style={styles.metaText}>· {item.categoria}</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDeletar(item.id, item.nome)} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={C.red[500]} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <MaterialCommunityIcons name="plus" size={26} color={C.ink[0]} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={resetForm}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Editar Item' : 'Novo Item'}</Text>
              <TouchableOpacity onPress={resetForm} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={18} color={C.ink[700]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Nome *', value: nome, set: setNome, placeholder: 'Ex: Arroz 5kg', keyboardType: 'default' as const },
                { label: 'Preço Unitário', value: preco, set: setPreco, placeholder: 'R$ 0,00', keyboardType: 'decimal-pad' as const },
                { label: 'Categoria', value: categoria, set: setCategoria, placeholder: 'Ex: Alimentos', keyboardType: 'default' as const },
                { label: 'Loja', value: loja, set: setLoja, placeholder: 'Ex: Carrefour', keyboardType: 'default' as const },
              ].map(f => (
                <View key={f.label} style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={C.ink[400]}
                    value={f.value} onChangeText={f.set} keyboardType={f.keyboardType} />
                </View>
              ))}

              <Text style={styles.label}>Quantidade</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="1" placeholderTextColor={C.ink[400]}
                  value={qtd} onChangeText={setQtd} keyboardType="numeric" />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="kg, un, L..." placeholderTextColor={C.ink[400]}
                  value={unidade} onChangeText={setUnidade} />
              </View>

              <Text style={styles.label}>Prioridade</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {(['baixa', 'media', 'alta'] as const).map(p => (
                  <TouchableOpacity
                    key={p} onPress={() => setPrioridade(p)}
                    style={[styles.prioBtn, { borderColor: PRIORIDADE_COLORS[p] },
                      prioridade === p && { backgroundColor: PRIORIDADE_COLORS[p] }]}
                  >
                    <Text style={[styles.prioBtnText, { color: prioridade === p ? C.ink[0] : PRIORIDADE_COLORS[p] }]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={resetForm}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color={C.ink[0]} />
                  : <Text style={styles.btnSaveText}>{editMode ? 'Atualizar' : 'Adicionar'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
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
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 90 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.ink[0], borderRadius: radius.md,
    padding: 12, borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
  },
  itemCardComprado: { opacity: 0.55 },
  checkbox: { padding: 2 },
  checkboxInner: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: C.ink[200],
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: C.green[500], borderColor: C.green[500] },
  itemBody: { flex: 1, minWidth: 0 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  itemNome: { ...T.body, color: C.ink[800], fontWeight: '600', flex: 1 },
  itemNomeComprado: { textDecorationLine: 'line-through', color: C.ink[400] },
  prioBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  prioDot: { width: 5, height: 5, borderRadius: 3 },
  prioText: { fontSize: 10, fontWeight: '700' },
  itemMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaText: { ...T.small, color: C.ink[500] },
  deleteBtn: { padding: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h3, color: C.ink[700] },
  emptySub: { ...T.body, color: C.ink[400] },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
    ...shadows.lg,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...T.h2, color: C.ink[900] },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  label: { ...T.small, color: C.ink[700], fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: C.ink[50], borderWidth: 1, borderColor: C.ink[200],
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.ink[900],
  },
  prioBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.sm,
    borderWidth: 1.5, alignItems: 'center',
  },
  prioBtnText: { fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: C.ink[0], borderWidth: 1, borderColor: C.ink[200], alignItems: 'center',
  },
  btnCancelText: { ...T.body, color: C.ink[700], fontWeight: '600' },
  btnSave: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: C.green[500], alignItems: 'center', ...shadows.sm },
  btnSaveText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
