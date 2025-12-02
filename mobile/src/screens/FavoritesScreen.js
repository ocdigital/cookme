import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { mockAllRecipes } from '../services/mockRecipesData';
import { receitasService } from '../services/api';

const { width } = Dimensions.get('window');

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      // Tentando carregar receitas favoritas da API
      const data = await receitasService.getReceitas({ favoritas: true });
      if (data && Array.isArray(data) && data.length > 0) {
        setFavorites(data);
      } else {
        // Fallback para mock data se não tiver favoritas
        setFavorites(mockAllRecipes.slice(0, 4));
      }
    } catch (err) {
      console.error('Erro ao carregar favoritas:', err);
      setError('Erro ao carregar receitas favoritas');
      // Fallback para mock data em caso de erro
      setFavorites(mockAllRecipes.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites
    .filter((recipe) =>
      recipe?.nome?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? true
    )
    .sort((a, b) => {
      if (sortBy === 'tempo') {
        return (a.tempoPreparo || 0) + (a.tempoCozimento || 0) - ((b.tempoPreparo || 0) + (b.tempoCozimento || 0));
      } else if (sortBy === 'avaliacao') {
        return (b.avaliacoes || 0) - (a.avaliacoes || 0);
      }
      return 0;
    });

  const removeFavorite = (id) => {
    setFavorites(favorites.filter((f) => f.id !== id));
  };

  const renderRecipeCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RecipeDetails', { recipeId: item.id })}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.imagem }} style={styles.cardImage} />

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFavorite(item.id)}
        >
          <Text style={styles.removeIcon}>❤️</Text>
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nome}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={1}>
            {item.descricao}
          </Text>

          <View style={styles.cardStats}>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>
                {item.tempoPreparo + item.tempoCozimento}min
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{item.avaliacoes}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{item.calorias}cal</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Receitas Favoritas</Text>
        <Text style={styles.headerSubtitle}>{favorites.length} receitas</Text>
      </View>

      {/* Busca */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar receita favorita..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'recent' && styles.filterButtonActive]}
          onPress={() => setSortBy('recent')}
        >
          <Text
            style={[styles.filterButtonText, sortBy === 'recent' && styles.filterButtonTextActive]}
          >
            Recentes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'tempo' && styles.filterButtonActive]}
          onPress={() => setSortBy('tempo')}
        >
          <Text
            style={[styles.filterButtonText, sortBy === 'tempo' && styles.filterButtonTextActive]}
          >
            ⏱️ Tempo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'avaliacao' && styles.filterButtonActive]}
          onPress={() => setSortBy('avaliacao')}
        >
          <Text
            style={[styles.filterButtonText, sortBy === 'avaliacao' && styles.filterButtonTextActive]}
          >
            ⭐ Rating
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de Erro */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Estado de Carregamento */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text style={styles.loadingText}>Carregando favoritas...</Text>
        </View>
      ) : filteredFavorites.length > 0 ? (
        <FlatList
          data={filteredFavorites}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyText}>Nenhuma receita favorita</Text>
          <Text style={styles.emptySubtext}>
            Comece a adicionar suas receitas favoritas!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('RecipesList')}
          >
            <Text style={styles.exploreButtonText}>Explorar Receitas</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
  },
  searchIcon: {
    fontSize: 18,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#FF69B4',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 10,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 10,
  },
  cardContainer: {
    width: '48%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '60%',
    backgroundColor: '#F0F0F0',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  removeIcon: {
    fontSize: 18,
  },
  cardContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    lineHeight: 16,
  },
  cardDescription: {
    fontSize: 10,
    color: '#999',
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 2,
  },
  statIcon: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  exploreButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EF5350',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
  },
});
