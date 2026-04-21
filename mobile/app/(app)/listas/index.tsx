import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useListas } from '@/hooks/useListas';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

export default function ListasScreen() {
  const router = useRouter();
  const { listas, loading, erro, criarLista, carregarListas, carregarLista, deletarLista, duplicarLista } = useListas();
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  useFocusEffect(useCallback(() => { carregarListas(); }, [carregarListas]));

  const handleCriar = async () => {
    if (!titulo.trim()) { Alert.alert('Erro', 'Nome da lista é obrigatório'); return; }
    try {
      await criarLista(titulo, descricao);
      setTitulo(''); setDescricao(''); setModalVisible(false);
    } catch { Alert.alert('Erro', 'Falha ao criar lista'); }
  };

  const handleDeletar = (id: string, nome: string) => {
    Alert.alert('Deletar Lista', `Deseja deletar "${nome}"?`, [
      { text: 'Cancelar' },
      { text: 'Deletar', style: 'destructive', onPress: () => deletarLista(id) },
    ]);
  };

  const renderItem = ({ item }: any) => {
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
          <TouchableOpacity onPress={() => handleDeletar(item.id, item.titulo)} style={styles.iconBtn}>
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
          {item.total_estimado > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="cash" size={14} color={C.ink[500]} />
              <Text style={styles.statText}>R$ {item.total_estimado?.toFixed(2)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Minhas listas</Text>
          <Text style={styles.headerTitle}>{listas.length} {listas.length === 1 ? 'lista' : 'listas'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="plus" size={22} color={C.ink[0]} />
        </TouchableOpacity>
      </View>

      {loading && listas.length === 0 ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={C.green[500]} /></View>
      ) : (
        <FlatList
          data={listas.filter(l => l.status === 'ativa')}
          renderItem={renderItem}
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
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
                <MaterialCommunityIcons name="plus" size={18} color={C.ink[0]} />
                <Text style={styles.emptyBtnText}>Criar Lista</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Lista</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color={C.ink[700]} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nome da lista"
              placeholderTextColor={C.ink[400]}
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={C.ink[400]}
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCreate} onPress={handleCriar} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color={C.ink[0]} /> : <Text style={styles.btnCreateText}>Criar</Text>}
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  card: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    padding: 14, borderWidth: 1, borderColor: C.ink[150],
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center',
  },
  cardTitulo: { ...T.h3, color: C.ink[900], marginBottom: 2 },
  cardSub: { ...T.small, color: C.ink[500] },
  iconBtn: { padding: 6 },
  progressBar: { height: 5, backgroundColor: C.ink[150], borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: C.green[500], borderRadius: 3 },
  cardBottom: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { ...T.small, color: C.ink[500] },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h3, color: C.ink[800] },
  emptySub: { ...T.body, color: C.ink[500] },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.green[500], borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 24, marginTop: 8,
    ...shadows.sm,
  },
  emptyBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...T.h2, color: C.ink[900] },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  input: {
    backgroundColor: C.ink[50], borderWidth: 1, borderColor: C.ink[200],
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.ink[900], marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: C.ink[0], borderWidth: 1, borderColor: C.ink[200], alignItems: 'center',
  },
  btnCancelText: { ...T.body, color: C.ink[700], fontWeight: '600' },
  btnCreate: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: C.green[500], alignItems: 'center',
    ...shadows.sm,
  },
  btnCreateText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
