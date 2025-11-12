import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { mockRecipesCarousel } from '../services/mockRecipesData';
import { inventarioService } from '../services/api';

const { width } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = width * 0.85;
const CAROUSEL_ITEM_HEIGHT = 220;

export default function HomeScreenRecipes({ navigation }) {
  const { user, logout } = useAuth();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [loadingExpiring, setLoadingExpiring] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    loadExpiringProducts();
  }, []);

  const loadExpiringProducts = async () => {
    try {
      setLoadingExpiring(true);
      const data = await inventarioService.getVencendo(7); // Produtos vencendo nos próximos 7 dias
      if (data && Array.isArray(data) && data.length > 0) {
        setExpiringProducts(data);
      } else {
        // DADOS DE TESTE - Para visualização do alerta
        setExpiringProducts([
          { id: '1', nome: 'Leite Integral', diasRestantes: 2, dataValidade: '2025-11-13' },
          { id: '2', nome: 'Ovos', diasRestantes: 3, dataValidade: '2025-11-14' },
          { id: '3', nome: 'Iogurte Grego', diasRestantes: 1, dataValidade: '2025-11-12' },
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos vencendo:', error);
      // Em caso de erro, mostra dados de teste
      setExpiringProducts([
        { id: '1', nome: 'Leite Integral', diasRestantes: 2, dataValidade: '2025-11-13' },
        { id: '2', nome: 'Ovos', diasRestantes: 3, dataValidade: '2025-11-14' },
        { id: '3', nome: 'Iogurte Grego', diasRestantes: 1, dataValidade: '2025-11-12' },
      ]);
    } finally {
      setLoadingExpiring(false);
    }
  };

  const handleCarouselScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CAROUSEL_ITEM_WIDTH + 10));
    setCurrentCarouselIndex(index);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Linha superior com Logo e Avatar */}
      {/* ALERTA FIXO - Produtos Vencendo (SEMPRE EXIBIDO) */}
      <View style={styles.alertBoxFixed}>
        {/* Linha 1: Título com ícone */}
        <View style={styles.alertFixedTitleRow}>
          <Text style={styles.alertFixedIcon}>⏰</Text>
          <Text style={styles.alertFixedMainTitle}>
            {expiringProducts.length} produto{expiringProducts.length > 1 ? 's' : ''} vencendo
          </Text>
        </View>

        {/* Linha 2: Lista de produtos com tags */}
        <View style={styles.alertFixedProductsRow}>
          {expiringProducts.map((product) => (
            <View key={product.id} style={styles.productTag}>
              <Text style={styles.productTagName} numberOfLines={1}>
                {product.nome || product.name}
              </Text>
              <Text style={styles.productTagDays}>
                {product.diasRestantes || 0}d
              </Text>
            </View>
          ))}
        </View>

        {/* Linha 3: Botão */}
        <TouchableOpacity
          style={styles.alertFixedButton}
          onPress={() => navigation.navigate('RecipesList')}
          activeOpacity={0.6}
        >
          <Text style={styles.alertFixedButtonIcon}>🍳</Text>
          <Text style={styles.alertFixedButtonText}>Ver receitas com esses alimentos</Text>
          <Text style={styles.alertFixedButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.carouselSection}>
          <Text style={styles.sectionTitle}>Receitas em Destaque</Text>
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

        {/* Navegação Principal */}
        <View style={styles.mainNavigation}>
          <TouchableOpacity
            style={[styles.mainButton, styles.recipesButton]}
            onPress={() => navigation.navigate('RecipesList')}
          >
            <Text style={styles.mainButtonIcon}>🍳</Text>
            <Text style={styles.mainButtonTitle}>Todas as Receitas</Text>
            <Text style={styles.mainButtonSubtitle}>Explore receitas por categoria</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, styles.inventoryButton]}
            onPress={() => navigation.navigate('Inventory')}
          >
            <Text style={styles.mainButtonIcon}>📦</Text>
            <Text style={styles.mainButtonTitle}>Meu Inventário</Text>
            <Text style={styles.mainButtonSubtitle}>Cadastre e gerencie produtos</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Acesso Rápido */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => navigation.navigate('RecipesList')}
            >
              <Text style={styles.quickAccessIcon}>📖</Text>
              <Text style={styles.quickAccessText}>Buscar{'\n'}Receitas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => navigation.navigate('Inventory')}
            >
              <Text style={styles.quickAccessIcon}>🍽️</Text>
              <Text style={styles.quickAccessText}>Produtos{'\n'}Cadastrados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.quickAccessIcon}>📋</Text>
              <Text style={styles.quickAccessText}>Histórico{'\n'}de Cupons</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => navigation.navigate('Favorites')}
            >
              <Text style={styles.quickAccessIcon}>❤️</Text>
              <Text style={styles.quickAccessText}>Receitas{'\n'}Favoritas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção de Sugestões */}
        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.sectionTitle}>Sugestões para Você</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>Ver tudo →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.suggestionCard}>
            <View style={styles.suggestionBadge}>
              <Text style={styles.suggestionBadgeText}>Recomendado</Text>
            </View>
            <Text style={styles.suggestionTitle}>
              Receitas com seus produtos
            </Text>
            <Text style={styles.suggestionSubtitle}>
              Com base no seu inventário atual
            </Text>
            <TouchableOpacity style={styles.suggestionButton}>
              <Text style={styles.suggestionButtonText}>Explorar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Dica do Dia</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🥗</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Prepare ingredientes com antecedência</Text>
              <Text style={styles.tipText}>
                O "mise en place" deixa a culinária mais fácil e rápida. Prepare tudo antes de começar a cozinhar!
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  headerContainer: {
    backgroundColor: '#FF8C42',
    paddingBottom: 0,
  },
  headerTop: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImageHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  alertBoxFixed: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0,
    gap: 10,
  },
  alertFixedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertFixedIcon: {
    fontSize: 20,
    color: '#333',
  },
  alertFixedMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  alertFixedProductsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productTag: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  productTagName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    maxWidth: 80,
  },
  productTagDays: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertFixedButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  alertFixedButtonIcon: {
    fontSize: 16,
  },
  alertFixedButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  alertFixedButtonArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  alertBoxHeader: {
    flex: 1,
    backgroundColor: '#FF8C42',
  },
  alertHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertHeaderIcon: {
    fontSize: 20,
    color: '#fff',
  },
  alertHeaderText: {
    flex: 1,
  },
  alertHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  alertHeaderSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  alertHeaderArrow: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  cookMeIcon: {
    fontSize: 20,
  },
  cookMeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  alertBox: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  alertBoxFixed: {
    marginHorizontal: 16,
    marginVertical: 12,
    marginTop: 8,


    padding: 5,

  },
  alertBoxCompact: {
    backgroundColor: 'rgba(255, 179, 71, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB347',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  alertCompactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertCompactIcon: {
    fontSize: 18,
  },
  alertCompactText: {
    flex: 1,
  },
  alertCompactTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 1,
  },
  alertCompactSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  alertCompactArrow: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  alertHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D84315',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#E64A19',
  },
  expiringProductsList: {
    marginBottom: 12,
    gap: 8,
  },
  expiringProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  productDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
  },
  productName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  diasRestantes: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suggestRecipeButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  suggestRecipeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  carouselSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 12,
    color: '#2C1810',
  },
  carouselContainer: {
    paddingHorizontal: 10,
    gap: 10,
  },
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: 14,
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 12,
    paddingBottom: 14,
  },
  carouselTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
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
    backgroundColor: '#E8D5C4',
  },
  indicatorActive: {
    backgroundColor: '#FF8C42',
    width: 24,
  },
  mainNavigation: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  mainButton: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipesButton: {
    backgroundColor: '#FFE4C4',
  },
  inventoryButton: {
    backgroundColor: '#FFEFD5',
  },
  mainButtonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  mainButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 4,
  },
  mainButtonSubtitle: {
    fontSize: 11,
    color: '#6B4423',
    lineHeight: 15,
  },
  quickAccessSection: {
    marginBottom: 24,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 10,
  },
  quickAccessItem: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0E5D8',
  },
  quickAccessIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  quickAccessText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2C1810',
    lineHeight: 14,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  seeAllLink: {
    color: '#FF8C42',
    fontWeight: '600',
    fontSize: 12,
  },
  suggestionCard: {
    backgroundColor: '#FF8C42',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#fff',
  },
  suggestionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  suggestionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
    color: '#FF8C42',
    fontWeight: '700',
    fontSize: 12,
  },
  tipsSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB84D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tipIcon: {
    fontSize: 32,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#6B4423',
    lineHeight: 16,
  },
  spacer: {
    height: 30,
  },
});
