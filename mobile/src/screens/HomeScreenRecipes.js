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
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { inventarioService, receitasService } from '../services/api';
import { colors, spacing, shadows, borderRadius } from '../theme/colors';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { HeaderWithProfile } from '../components/HeaderWithProfile';

const { width } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = width * 0.85;
const CAROUSEL_ITEM_HEIGHT = 220;

export default function HomeScreenRecipes({ navigation }) {
  const { user, logout } = useAuth();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [loadingExpiring, setLoadingExpiring] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    loadExpiringProducts();
    loadSuggestedRecipes();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderWithProfile
          onAlertPress={() => setShowExpiringModal(true)}
          onProfilePress={() => navigation.navigate('Profile')}
          alertCount={expiringProducts.length}
          alertColor={colors.primary}
        />
      ),
    });
  }, [expiringProducts, navigation]);

  const loadExpiringProducts = async () => {
    try {
      setLoadingExpiring(true);
      const data = await inventarioService.getVencendo(7); // Produtos vencendo nos próximos 7 dias
      if (data && Array.isArray(data)) {
        setExpiringProducts(data);
      } else {
        setExpiringProducts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos vencendo:', error);
      setExpiringProducts([]);
    } finally {
      setLoadingExpiring(false);
    }
  };

  const loadSuggestedRecipes = async () => {
    try {
      setLoadingSuggestions(true);
      const data = await receitasService.getSugestoes();
      if (data && Array.isArray(data)) {
        setSuggestedRecipes(data);
      } else {
        setSuggestedRecipes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões de receitas:', error);
      setSuggestedRecipes([]);
    } finally {
      setLoadingSuggestions(false);
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


  const renderExpiringProductsModal = () => (
    <Modal
      visible={showExpiringModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowExpiringModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalIcon}>⏰</Text>
              <Text style={styles.modalTitle}>
                {expiringProducts.length} produto{expiringProducts.length > 1 ? 's' : ''} vencendo
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowExpiringModal(false)}
              activeOpacity={0.6}
            >
              <FeatherIcon
                name="x"
                size={24}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Modal Body - Products List */}
          <ScrollView style={styles.modalBody}>
            <View style={styles.modalProductsList}>
              {expiringProducts.map((product) => (
                <View key={product.id} style={styles.modalProductItem}>
                  <View style={styles.modalProductInfo}>
                    <Text style={styles.modalProductName}>
                      {product.nome || product.name}
                    </Text>
                    <Text style={styles.modalProductDate}>
                      Vence em: {product.dataValidade}
                    </Text>
                  </View>
                  <View style={styles.modalProductDays}>
                    <Text style={styles.modalProductDaysText}>
                      {product.diasRestantes || 0}
                    </Text>
                    <Text style={styles.modalProductDaysLabel}>dias</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Modal Footer - Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowExpiringModal(false);
                navigation.navigate('Categorias');
              }}
              activeOpacity={0.6}
            >
              <FeatherIcon
                name="utensils"
                size={18}
                color={colors.white}
              />
              <Text style={styles.modalButtonText}>
                Ver receitas com esses alimentos
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderExpiringProductsModal()}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.carouselSection}>
          <Text style={styles.sectionTitle}>Receitas em Destaque</Text>
          {loadingSuggestions ? (
            <View style={styles.loadingContainer}>
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
              <Text style={styles.emptyText}>Nenhuma sugestão disponível</Text>
            </View>
          )}
        </View>

        {/* Navegação Principal */}
        <View style={styles.mainNavigation}>
          <TouchableOpacity
            style={[styles.mainButton, styles.recipesButton]}
            onPress={() => navigation.navigate('Categorias')}
          >
            <Text style={styles.mainButtonIcon}>🍳</Text>
            <Text style={styles.mainButtonTitle}>Todas as Receitas</Text>
            <Text style={styles.mainButtonSubtitle}>Explore receitas por categoria</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, styles.inventoryButton]}
            onPress={() => navigation.navigate('Pesquisa')}
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
              onPress={() => navigation.navigate('Categorias')}
            >
              <Text style={styles.quickAccessIcon}>📖</Text>
              <Text style={styles.quickAccessText}>Buscar{'\n'}Receitas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => navigation.navigate('Pesquisa')}
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
    backgroundColor: colors.background.main,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCarousel: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
  },
  headerTop: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  profileButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  carouselContainer: {
    paddingHorizontal: 10,
    gap: 10,
  },
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
    ...shadows.lg,
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
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  carouselTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
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
    gap: spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
  },
  indicatorActive: {
    backgroundColor: colors.primary,
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    minHeight: 140,
    ...shadows.md,
  },
  recipesButton: {
    backgroundColor: colors.primarySoft,
  },
  inventoryButton: {
    backgroundColor: colors.primaryLight,
  },
  mainButtonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  mainButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  mainButtonSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
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
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quickAccessIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  quickAccessText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text.primary,
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
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  suggestionCard: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.white,
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
    color: colors.white,
    marginBottom: spacing.xs,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.md,
  },
  suggestionButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  tipsSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  tipCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.sm,
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
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  spacer: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.main,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingTop: spacing.lg,
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalProductsList: {
    gap: spacing.md,
  },
  modalProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalProductDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  modalProductDays: {
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  modalProductDaysText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  modalProductDaysLabel: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
