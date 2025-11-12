import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { mockRecipesCarousel, mockRecipeDetails } from '../services/mockRecipesData';
import { receitasService } from '../services/api';

export default function RecipeDetailsScreen({ navigation, route }) {
  const { recipeId } = route?.params || {};
  const [isFavorite, setIsFavorite] = useState(false);
  const [portions, setPortions] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [recipeDetail, setRecipeDetail] = useState(null);

  useEffect(() => {
    loadRecipeDetails();
  }, [recipeId]);

  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      // Tenta buscar da API
      const data = await receitasService.getReceitas({ id: recipeId });
      if (data && data.length > 0) {
        setRecipe(data[0]);
        setRecipeDetail(data[0]); // API retorna objeto completo
      } else {
        // Fallback para mock data
        const mockRecipe = mockRecipeDetails[recipeId] ||
          mockRecipesCarousel.find(r => r.id === recipeId) ||
          mockRecipesCarousel[0];
        setRecipe(mockRecipe);
        setRecipeDetail(mockRecipeDetails[recipeId] || {
          ingredientes: [],
          modo: [],
          dicas: [],
          rendimento: '4 porções',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da receita:', error);
      // Fallback para mock data em caso de erro
      const mockRecipe = mockRecipeDetails[recipeId] ||
        mockRecipesCarousel.find(r => r.id === recipeId) ||
        mockRecipesCarousel[0];
      setRecipe(mockRecipe);
      setRecipeDetail(mockRecipeDetails[recipeId] || {
        ingredientes: [],
        modo: [],
        dicas: [],
        rendimento: '4 porções',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderIngredient = ({ item }) => (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientCheckbox}>
        <Text style={styles.checkboxEmpty}>☐</Text>
      </View>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{item.nome}</Text>
        <Text style={styles.ingredientQuantity}>
          {item.quantidade} {item.unidade}
        </Text>
      </View>
      <TouchableOpacity style={styles.addToCart}>
        <Text style={styles.addToCartIcon}>🛒</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInstruction = ({ item, index }) => (
    <View style={styles.instructionItem}>
      <View style={styles.instructionNumber}>
        <Text style={styles.instructionNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.instructionText}>{item}</Text>
    </View>
  );

  const renderTip = ({ item }) => (
    <View style={styles.tipItem}>
      <Text style={styles.tipIcon}>💡</Text>
      <Text style={styles.tipText}>{item}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando receita...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Receita não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Imagem Principal */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.imagem }} style={styles.mainImage} />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Header da Receita */}
      <View style={styles.headerSection}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{recipe.nome}</Text>
          <Text style={styles.description}>{recipe.descricao}</Text>
        </View>

        {/* Rating */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.ratingValue}>{recipe.avaliacoes}</Text>
            <Text style={styles.ratingCount}>({recipe.numeroAvaliacoes || 0})</Text>
          </View>
        </View>
      </View>

      {/* Informações Rápidas */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>⏱️</Text>
          <Text style={styles.infoLabel}>Preparo</Text>
          <Text style={styles.infoValue}>{recipe.tempoPreparo}min</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔥</Text>
          <Text style={styles.infoLabel}>Cozimento</Text>
          <Text style={styles.infoValue}>{recipe.tempoCozimento}min</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔥</Text>
          <Text style={styles.infoLabel}>Calorias</Text>
          <Text style={styles.infoValue}>{recipe.calorias}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📊</Text>
          <Text style={styles.infoLabel}>Dificuldade</Text>
          <Text style={styles.infoValue}>{recipe.dificuldade}</Text>
        </View>
      </View>

      {/* Controle de Porções */}
      <View style={styles.portionsSection}>
        <Text style={styles.sectionTitle}>Porções</Text>
        <View style={styles.portionsControl}>
          <TouchableOpacity
            style={styles.portionButton}
            onPress={() => portions > 1 && setPortions(portions - 1)}
          >
            <Text style={styles.portionButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.portionValue}>{portions} pessoa{portions > 1 ? 's' : ''}</Text>
          <TouchableOpacity
            style={styles.portionButton}
            onPress={() => setPortions(portions + 1)}
          >
            <Text style={styles.portionButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ingredientes */}
      {recipeDetail.ingredientes && recipeDetail.ingredientes.length > 0 && (
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>📝 Ingredientes</Text>
          <Text style={styles.ingredientsHint}>Toque para marcar como comprado</Text>
          <FlatList
            data={recipeDetail.ingredientes}
            renderItem={renderIngredient}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            gap={8}
          />
        </View>
      )}

      {/* Modo de Preparo */}
      {recipeDetail.modo && recipeDetail.modo.length > 0 && (
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>👨‍🍳 Modo de Preparo</Text>
          <FlatList
            data={recipeDetail.modo}
            renderItem={renderInstruction}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            gap={12}
          />
        </View>
      )}

      {/* Dicas */}
      {recipeDetail.dicas && recipeDetail.dicas.length > 0 && (
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Dicas Importantes</Text>
          <FlatList
            data={recipeDetail.dicas}
            renderItem={renderTip}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            gap={8}
          />
        </View>
      )}

      {/* Botões de Ação */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonIcon}>📤</Text>
          <Text style={styles.secondaryButtonText}>Compartilhar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonIcon}>🛒</Text>
          <Text style={styles.primaryButtonText}>Comprar Ingredientes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  favoriteIcon: {
    fontSize: 28,
  },
  headerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleSection: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ratingSection: {
    alignItems: 'flex-start',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  ratingIcon: {
    fontSize: 16,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFA500',
  },
  ratingCount: {
    fontSize: 12,
    color: '#999',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  infoCard: {
    width: '23%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  portionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  portionsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  portionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  portionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ingredientsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientsHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  ingredientCheckbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxEmpty: {
    fontSize: 18,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  ingredientQuantity: {
    fontSize: 11,
    color: '#999',
  },
  addToCart: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartIcon: {
    fontSize: 16,
  },
  instructionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tipIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  secondaryButtonIcon: {
    fontSize: 18,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 13,
  },
  spacer: {
    height: 50,
  },
});
