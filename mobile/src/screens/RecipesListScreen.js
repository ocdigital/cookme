import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { mockAllRecipes } from '../services/mockRecipesData';
import { receitasService } from '../services/api';

const { width } = Dimensions.get('window');

export default function RecipesListScreen({ navigation, route }) {
  const [recipes, setRecipes] = useState(mockAllRecipes);
  const [filteredRecipes, setFilteredRecipes] = useState(mockAllRecipes);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('nome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterAndSortRecipes();
  }, [searchQuery, sortBy, recipes]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await receitasService.getReceitas();
      if (data && data.length > 0) {
        setRecipes(data);
      } else {
        // Fallback para mock data se API retornar vazio
        setRecipes(mockAllRecipes);
      }
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
      setError('Erro ao carregar receitas. Usando dados offline.');
      // Fallback para mock data em caso de erro
      setRecipes(mockAllRecipes);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRecipes = () => {
    let filtered = recipes;

    // Filtrar por busca
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (recipe) =>
          recipe?.nome?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          recipe?.descricao?.toLowerCase()?.includes(searchQuery.toLowerCase())
      );
    }

    // Ordenar
    if (sortBy === 'tempo') {
      filtered.sort((a, b) => (a.tempoPreparo || 0) + (a.tempoCozimento || 0) - ((b.tempoPreparo || 0) + (b.tempoCozimento || 0)));
    } else if (sortBy === 'avaliacao') {
      filtered.sort((a, b) => (b.avaliacoes || 0) - (a.avaliacoes || 0));
    } else if (sortBy === 'calorias') {
      filtered.sort((a, b) => (a.calorias || 0) - (b.calorias || 0));
    } else {
      filtered.sort((a, b) => (a?.nome || '').localeCompare(b?.nome || ''));
    }

    setFilteredRecipes(filtered);
  };

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetails', { recipeId: item.id })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.imagem }} style={styles.recipeImage} />

      <View style={styles.recipeContent}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.nome}
        </Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {item.descricao}
        </Text>

        <View style={styles.recipeStats}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statText}>
              {item.tempoPreparo + item.tempoCozimento}min
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statText}>{item.avaliacoes}</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statText}>{item.calorias}cal</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statText}>{item.dificuldade}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra de Busca */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar receita..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Botões de Ordenação */}
      <View style={styles.sortButtonsContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'nome' && styles.sortButtonActive]}
          onPress={() => setSortBy('nome')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'nome' && styles.sortButtonTextActive]}>
            Alfabética
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'tempo' && styles.sortButtonActive]}
          onPress={() => setSortBy('tempo')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'tempo' && styles.sortButtonTextActive]}>
            ⏱️ Tempo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'avaliacao' && styles.sortButtonActive]}
          onPress={() => setSortBy('avaliacao')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'avaliacao' && styles.sortButtonTextActive]}>
            ⭐ Rating
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'calorias' && styles.sortButtonActive]}
          onPress={() => setSortBy('calorias')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'calorias' && styles.sortButtonTextActive]}>
            🔥 Caloria
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
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando receitas...</Text>
        </View>
      ) : filteredRecipes.length > 0 ? (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Nenhuma receita encontrada</Text>
          <Text style={styles.emptySubtext}>Tente outra busca</Text>
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
  searchSection: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  searchIcon: {
    fontSize: 18,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  sortButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: 100,
    height: 120,
  },
  recipeContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  recipeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  statIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  statText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  chevron: {
    justifyContent: 'center',
    paddingRight: 12,
  },
  chevronText: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: '300',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
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
