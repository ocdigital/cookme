import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { receitasService, categoriasService } from '../services/api';
import { colors, spacing, shadows, borderRadius } from '../theme/colors';

const { width } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = width * 0.85;
const CAROUSEL_ITEM_HEIGHT = 250;

export default function RecipesScreen({ navigation }) {
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadSuggestedRecipes(),
      loadCategories(),
    ]);
  };

  const loadSuggestedRecipes = async () => {
    try {
      setLoadingSuggested(true);
      setError(null);
      const data = await receitasService.getSugestoes();
      if (data && Array.isArray(data)) {
        setSuggestedRecipes(data);
      } else {
        setSuggestedRecipes([]);
      }
    } catch (err) {
      console.error('Erro ao carregar receitas sugeridas:', err);
      setError('Erro ao carregar receitas');
      setSuggestedRecipes([]);
    } finally {
      setLoadingSuggested(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoriasService.getCategorias();
      if (data && Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCarouselScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CAROUSEL_ITEM_WIDTH + 10));
    setCurrentCarouselIndex(index);
  };

  const renderCarouselItem = ({ item }) => (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => navigation.navigate('RecipeDetails', { recipeId: item.id })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imagem }} style={styles.carouselImage} />
      <View style={styles.carouselOverlay}>
        <Text style={styles.carouselTitle} numberOfLines={2}>
          {item.nome}
        </Text>
        <View style={styles.carouselInfoRow}>
          {item.tempoPreparo && (
            <Text style={styles.carouselInfo}>⏱️ {(item.tempoPreparo || 0) + (item.tempoCozimento || 0)}min</Text>
          )}
          {item.avaliacoes && (
            <Text style={styles.carouselInfo}>⭐ {item.avaliacoes}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryButton = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryButton, { borderColor: item.cor || colors.primary }]}
      onPress={() => navigation.navigate('Categorias', { categoria: item.id })}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryIcon}>{item.icone}</Text>
      <Text style={styles.categoryName}>{item.nome}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Receitas</Text>
        <Text style={styles.headerSubtitle}>Descubra novos pratos deliciosos</Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Carousel de Receitas Indicadas */}
      <View style={styles.carouselSection}>
        <Text style={styles.sectionTitle}>✨ Receitas Indicadas</Text>
        {loadingSuggested ? (
          <View style={styles.carouselLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : suggestedRecipes.length > 0 ? (
          <>
            <FlatList
              ref={carouselRef}
              data={suggestedRecipes}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled={false}
              scrollEventThrottle={16}
              onScroll={handleCarouselScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={CAROUSEL_ITEM_WIDTH + 10}
              decelerationRate="fast"
            />

            {/* Indicadores de Carousel */}
            <View style={styles.carouselIndicators}>
              {suggestedRecipes.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentCarouselIndex === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyCarousel}>
            <Text style={styles.emptyText}>Nenhuma receita sugerida disponível</Text>
          </View>
        )}
      </View>

      {/* Navegação Rápida */}
      <View style={styles.navigationSection}>
        <Text style={styles.sectionTitle}>🚀 Acesso Rápido</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Categorias')}
          >
            <Text style={styles.navButtonIcon}>📖</Text>
            <Text style={styles.navButtonText}>Todas as{'\n'}Receitas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.navButtonIcon}>🛒</Text>
            <Text style={styles.navButtonText}>Produtos{'\n'}Reais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.navButtonIcon}>🏠</Text>
            <Text style={styles.navButtonText}>Minhas{'\n'}Compras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.navButtonIcon}>📋</Text>
            <Text style={styles.navButtonText}>Histórico{'\n'}de Cupons</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categorias de Produtos */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>📂 Por Categoria</Text>
        {loadingCategories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : categories.length > 0 ? (
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => navigation.navigate('Categorias', { categoria: category.id })}
              >
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryItemIcon}>{category.icone}</Text>
                  <Text style={styles.categoryItemName}>{category.nome}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhuma categoria disponível</Text>
        )}
      </View>

      {/* Seção de Filtros */}
      <View style={styles.filtersSection}>
        <Text style={styles.sectionTitle}>🔍 Filtrar Por</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>⏱️ Mais Rápido</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>⭐ Melhor Avaliada</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>🌱 Menos Calórica</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EF5350',
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
    flex: 1,
  },
  errorClose: {
    fontSize: 18,
    color: '#C62828',
    marginLeft: spacing.md,
  },
  carouselSection: {
    marginBottom: spacing.xl,
  },
  carouselLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  carouselContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.md,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  carouselInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselInfo: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  emptyCarousel: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.background.soft,
    borderRadius: borderRadius.md,
  },
  navigationSection: {
    marginBottom: spacing.xl,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  navButton: {
    width: '46%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  navButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text.primary,
    lineHeight: 16,
  },
  categoriesSection: {
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  categoryItemIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  categoryItemName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text.primary,
  },
  categoryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filtersSection: {
    marginBottom: spacing.xl,
  },
  filterButtons: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  filterButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },
  spacer: {
    height: spacing.xl,
  },
});
