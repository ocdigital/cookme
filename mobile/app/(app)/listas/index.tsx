import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useListas } from '@/hooks/useListas';

export default function ListasScreen() {
  const router = useRouter();
  const {
    listas,
    loading,
    erro,
    criarLista,
    carregarListas,
    carregarLista,
    deletarLista,
    duplicarLista,
  } = useListas();

  const [modalVisible, setModalVisible] = useState(false);
  const [novaListaTitulo, setNovaListaTitulo] = useState('');
  const [novaListaDescricao, setNovaListaDescricao] = useState('');

  useFocusEffect(
    useCallback(() => {
      carregarListas();
    }, [carregarListas]),
  );

  const handleCriarLista = async () => {
    if (!novaListaTitulo.trim()) {
      Alert.alert('Erro', 'Nome da lista é obrigatório');
      return;
    }

    try {
      await criarLista(novaListaTitulo, novaListaDescricao);
      setNovaListaTitulo('');
      setNovaListaDescricao('');
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Falha ao criar lista');
    }
  };

  const handleDeletarLista = (id: string, titulo: string) => {
    Alert.alert(
      'Deletar Lista',
      `Deseja deletar "${titulo}"?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Deletar',
          onPress: () => deletarLista(id),
          style: 'destructive',
        },
      ],
    );
  };

  const handleSelecionarLista = (lista: any) => {
    carregarLista(lista.id);
    router.push({
      pathname: '/(app)/listas/[id]',
      params: { id: lista.id, titulo: lista.titulo },
    });
  };

  const renderListaItem = ({ item }: any) => {
    const progresso = (item.itens?.filter((i: any) => i.comprado).length || 0) / (item.itens?.length || 1);
    const percentual = Math.round(progresso * 100);

    return (
      <TouchableOpacity
        style={styles.listaCard}
        onPress={() => handleSelecionarLista(item)}
      >
        <View style={styles.listaHeader}>
          <View style={styles.listaInfo}>
            <Text style={styles.listaTitulo}>{item.titulo}</Text>
            <Text style={styles.listaSubtitulo}>
              {item.itens?.length || 0} itens • {percentual}% completo
            </Text>
          </View>
          <View style={styles.listaMenu}>
            <TouchableOpacity
              style={styles.menuIcon}
              onPress={() => duplicarLista(item.id)}
            >
              <MaterialCommunityIcons name="content-copy" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuIcon}
              onPress={() => handleDeletarLista(item.id, item.titulo)}
            >
              <MaterialCommunityIcons name="trash-can" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentual}%`, backgroundColor: '#FF6B6B' },
            ]}
          />
        </View>

        {/* Stats */}
        <View style={styles.listaStats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="shopping-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {item.itens?.filter((i: any) => !i.comprado).length || 0} restando
            </Text>
          </View>

          {item.total_estimado > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="cash" size={16} color="#666" />
              <Text style={styles.statText}>
                R$ {item.total_estimado?.toFixed(2) || '0.00'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="clipboard-list" size={64} color="#ddd" />
      <Text style={styles.emptyTitle}>Nenhuma lista de compras</Text>
      <Text style={styles.emptyText}>Crie sua primeira lista para começar</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Criar Lista</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Minhas Listas</Text>
          <Text style={styles.headerSubtitle}>
            {listas.length} {listas.length === 1 ? 'lista' : 'listas'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.criarButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {erro && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#FF6B6B" />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      )}

      {/* List */}
      {loading && listas.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : (
        <FlatList
          data={listas.filter((l) => l.status === 'ativa')}
          renderItem={renderListaItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          onRefresh={carregarListas}
          refreshing={loading}
          scrollEnabled={true}
        />
      )}

      {/* Modal Criar Lista */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Lista de Compras</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nome da lista (obrigatório)"
              placeholderTextColor="#ccc"
              value={novaListaTitulo}
              onChangeText={setNovaListaTitulo}
            />

            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Descrição (opcional)"
              placeholderTextColor="#ccc"
              value={novaListaDescricao}
              onChangeText={setNovaListaDescricao}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCriarLista}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Criar Lista</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  criarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: '#FFE0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listaCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  listaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listaInfo: {
    flex: 1,
  },
  listaTitulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  listaSubtitulo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  listaMenu: {
    flexDirection: 'row',
    gap: 4,
  },
  menuIcon: {
    padding: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  listaStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
