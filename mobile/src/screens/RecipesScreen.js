import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { mockRecipesCarousel, mockProductCategories } from '../services/mockRecipesData';

const { width } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = width * 0.85;
const CAROUSEL_ITEM_HEIGHT = 250;

export default function RecipesScreen({ navigation }) {
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef(null);

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
          <Text style={styles.carouselInfo}>⏱️ {item.tempoPreparo + item.tempoCozimento}min</Text>
          <Text style={styles.carouselInfo}>⭐ {item.avaliacoes}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryButton = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryButton, { borderColor: item.cor }]}
      onPress={() => navigation.navigate('RecipesList', { categoria: item.id })}
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

      {/* Carousel de Receitas Indicadas */}
      <View style={styles.carouselSection}>
        <Text style={styles.sectionTitle}>✨ Receitas Indicadas</Text>
        <FlatList
          ref={carouselRef}
          data={mockRecipesCarousel}
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
          {mockRecipesCarousel.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentCarouselIndex === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Navegação Rápida */}
      <View style={styles.navigationSection}>
        <Text style={styles.sectionTitle}>🚀 Acesso Rápido</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('RecipesList')}
          >
            <Text style={styles.navButtonIcon}>📖</Text>
            <Text style={styles.navButtonText}>Todas as{'\n'}Receitas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.navButtonIcon}>🛒</Text>
            <Text style={styles.navButtonText}>Produtos{'\n'}(Mockado)</Text>
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
        <View style={styles.categoriesGrid}>
          {mockProductCategories.map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <Text style={styles.categoryItemIcon}>{category.icone}</Text>
              <Text style={styles.categoryItemName}>{category.nome}</Text>
            </View>
          ))}
        </View>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  carouselSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#333',
  },
  carouselContainer: {
    paddingHorizontal: 8,
    gap: 10,
  },
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
    padding: 12,
    paddingBottom: 14,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  carouselInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselInfo: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  indicatorActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  navigationSection: {
    marginBottom: 24,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    gap: 12,
  },
  navButton: {
    width: '46%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    lineHeight: 16,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItemIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  filtersSection: {
    marginBottom: 24,
  },
  filterButtons: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4CAF50',
    textAlign: 'center',
  },
  spacer: {
    height: 50,
  },
});
