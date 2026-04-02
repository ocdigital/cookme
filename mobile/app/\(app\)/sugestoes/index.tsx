import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRecipeSuggestions } from '@/hooks/useRecipeSuggestions';

export default function SuestoesScreen() {
  const router = useRouter();
  const {
    receitas_sugeridas,
    total_ingredientes_disponiveis,
    ingredientes_usados,
    query_utilizada,
    receitas_encontradas,
    loading,
    erro,
    obterSugestoes,
    ordenarPorMatch,
  } = useRecipeSuggestions();

  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'relevancia' | 'nome'>('relevancia');

  useFocusEffect(
    React.useCallback(() => {
      obterSugestoes();
    }, [obterSugestoes]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await obterSugestoes();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAbrirReceita = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o link');
    });
  };

  const handleSortChange = (tipo: 'relevancia' | 'nome') => {
    setSortBy(tipo);
    if (tipo === 'relevancia') {
      ordenarPorMatch();
    }
  };

  const receitasOrdenadas =
    sortBy === 'nome'
      ? [...receitas_sugeridas].sort((a, b) =>
          a.titulo.localeCompare(b.titulo),
        )
      : receitas_sugeridas;

  const renderReceitaItem = ({ item }: { item: any }) => (
    <View style={styles.receitaCard}>
      <View style={styles.receitaHeader}>
        <View style={styles.receitaInfo}>
          <Text style={styles.receitaTitulo} numberOfLines={2}>
            {item.titulo}
          </Text>
          <Text style={styles.receitaFonte}>
            {item.fonte === 'google_search' ? '🔍 Google' : 'API'}
          </Text>
        </View>
        <View style={styles.matchBadge}>
          <MaterialCommunityIcons
            name="leaf"
            size={16}
            color="#fff"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.matchCount}>
            {item.ingredientes_match.length}
          </Text>
        </View>
      </View>

      {item.ingredientes_match.length > 0 && (
        <View style={styles.ingredientesSection}>
          <Text style={styles.ingredientesLabel}>Ingredientes que você tem:</Text>
          <View style={styles.ingredientesTags}>
            {item.ingredientes_match.slice(0, 4).map((ing, idx) => (
              <View key={idx} style={styles.ingrediente}>
                <Text style={styles.ingredienteText}>{ing}</Text>
              </View>
            ))}
            {item.ingredientes_match.length > 4 && (
              <View style={styles.ingrediente}>
                <Text style={styles.ingredienteText}>
                  +{item.ingredientes_match.length - 4}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.botaoAbrir}
        onPress={() => handleAbrirReceita(item.url)}
      >
        <MaterialCommunityIcons name="open-in-new" size={18} color="#fff" />
        <Text style={styles.botaoAbrirText}>Ver Receita</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && receitas_sugeridas.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Buscando receitas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Receitas Sugeridas</Text>
          <Text style={styles.headerSubtitle}>
            {receitas_encontradas} receita{receitas_encontradas !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Ingredientes disponíveis */}
      {total_ingredientes_disponiveis > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.ingredientesDisponiveisScroll}
          contentContainerStyle={styles.ingredientesDisponiveisContainer}
        >
          <View style={styles.ingredienteDisponivel}>
            <MaterialCommunityIcons
              name="basket"
              size={16}
              color="#FF6B6B"
            />
            <Text style={styles.ingredienteDisponivelText}>
              {total_ingredientes_disponiveis} ingrediente
              {total_ingredientes_disponiveis !== 1 ? 's' : ''}
            </Text>
          </View>
          {ingredientes_usados.slice(0, 5).map((ing, idx) => (
            <View key={idx} style={styles.ingredienteDisponivel}>
              <Text style={styles.ingredienteDisponivelText}>{ing}</Text>
            </View>
          ))}
          {ingredientes_usados.length > 5 && (
            <View style={styles.ingredienteDisponivel}>
              <Text style={styles.ingredienteDisponivelText}>
                +{ingredientes_usados.length - 5}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Info */}
      {query_utilizada && (
        <View style={styles.queryInfo}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color="#666"
          />
          <Text style={styles.queryText}>
            Busca: Busca: "{query_utilizada}"quot;{query_utilizada}Busca: "{query_utilizada}"quot;
          </Text>
        </View>
      )}

      {/* Erro */}
      {erro && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={18}
            color="#FF6B6B"
          />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      )}

      {/* Sort buttons */}
      {receitas_sugeridas.length > 0 && (
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'relevancia' && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange('relevancia')}
          >
            <MaterialCommunityIcons
              name="sort"
              size={16}
              color={sortBy === 'relevancia' ? '#FF6B6B' : '#999'}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'relevancia' && styles.sortButtonTextActive,
              ]}
            >
              Mais Relevantes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'nome' && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange('nome')}
          >
            <MaterialCommunityIcons
              name="sort-alphabetical"
              size={16}
              color={sortBy === 'nome' ? '#FF6B6B' : '#999'}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'nome' && styles.sortButtonTextActive,
              ]}
            >
              Alfabética
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de receitas */}
      {receitas_sugeridas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="chef-hat"
            size={64}
            color="#ddd"
          />
          <Text style={styles.emptyText}>
            Nenhuma receita encontrada
          </Text>
          <Text style={styles.emptySubtext}>
            {total_ingredientes_disponiveis === 0
              ? 'Adicione ingredientes ao seu inventário'
              : 'Tente adicionar mais ingredientes'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={receitasOrdenadas}
          renderItem={renderReceitaItem}
          keyExtractor={(item, idx) => idx.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* FAB para voltar ao inventário */}
      <TouchableOpacity
        style={styles.fabInventario}
        onPress={() => router.push('/(app)/inventario')}
      >
        <MaterialCommunityIcons name="warehouse" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  ingredientesDisponiveisScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientesDisponiveisContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  ingredienteDisponivel: {
    backgroundColor: '#FFF3F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  ingredienteDisponivelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  queryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    gap: 8,
  },
  queryText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
    fontStyle: 'italic',
  },
  errorBanner: {
    backgroundColor: '#FFE0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    flex: 1,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: '#FFF3F3',
    borderColor: '#FF6B6B',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  sortButtonTextActive: {
    color: '#FF6B6B',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 120,
  },
  receitaCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  receitaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receitaInfo: {
    flex: 1,
    marginRight: 12,
  },
  receitaTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  receitaFonte: {
    fontSize: 11,
    color: '#999',
  },
  matchBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  ingredientesSection: {
    marginBottom: 12,
  },
  ingredientesLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  ingredientesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingrediente: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ingredienteText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  botaoAbrir: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  botaoAbrirText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  fabInventario: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
