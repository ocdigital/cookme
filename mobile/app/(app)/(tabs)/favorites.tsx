import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { Receita } from '@/types';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setError(null);
      const response = await api.get('/receitas/favoritas');
      setFavorites(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
      setError('Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return '#4CAF50';
      case 'media':
        return '#FFA500';
      case 'dificil':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'Fácil';
      case 'media':
        return 'Média';
      case 'dificil':
        return 'Difícil';
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={48}
          color="#FF6B6B"
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFavorites}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.recipeCard}>
            {item.imagem_url && (
              <Image
                source={{ uri: item.imagem_url }}
                style={styles.recipeImage}
              />
            )}
            <View style={styles.favoriteHeart}>
              <MaterialCommunityIcons
                name="heart"
                size={24}
                color="#FF6B6B"
              />
            </View>
            <View style={styles.recipeContent}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeName} numberOfLines={2}>
                  {item.nome}
                </Text>
                <View style={styles.difficultyBadge}>
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(item.dificuldade) },
                    ]}
                  >
                    {getDifficultyLabel(item.dificuldade)}
                  </Text>
                </View>
              </View>

              {item.descricao && (
                <Text
                  style={styles.recipeDescription}
                  numberOfLines={1}
                >
                  {item.descricao}
                </Text>
              )}

              <View style={styles.recipeStats}>
                {item.tempo_preparo && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={14}
                      color="#999"
                    />
                    <Text style={styles.statText}>
                      {item.tempo_preparo}min
                    </Text>
                  </View>
                )}

                {item.avaliacao_media && item.avaliacao_media > 0 && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color="#FFA500"
                    />
                    <Text style={styles.statText}>
                      {item.avaliacao_media.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={64}
              color="#ddd"
            />
            <Text style={styles.emptyText}>Nenhuma receita favorita</Text>
            <Text style={styles.emptySubtext}>
              Adicione receitas aos favoritos
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    backgroundColor: '#fff',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recipeImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  favoriteHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 6,
  },
  recipeContent: {
    padding: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recipeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
