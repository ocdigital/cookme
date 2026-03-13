import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { produtosService, categoriasService } from '../services/api';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

export default function ProductsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);

  // Carregar categorias ao montar
  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  // Recarregar produtos quando categoria mudar
  useEffect(() => {
    if (selectedCategory) {
      loadProductsByCategory(selectedCategory);
    } else {
      loadProducts();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      setError(null);
      const data = await categoriasService.getCategorias();
      if (data && Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError('Erro ao carregar categorias');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await produtosService.getProdutos();
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsByCategory = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await produtosService.getProdutosPorCategoria(categoryId);
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos da categoria:', err);
      setError('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product?.nome?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? true;
    return matchesSearch;
  });

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const renderProductCard = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.imagem }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nome}
        </Text>
        <Text style={styles.productCategory}>{item.categoria}</Text>
        <View style={styles.productFooter}>
          {item.preco && (
            <Text style={styles.productPrice}>R$ {(item.preco || 0).toFixed(2)}</Text>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
        {cart.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        )}
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

      {/* Barra de Busca */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Categorias */}
      {loadingCategories ? (
        <View style={styles.categoriesLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryTag,
              !selectedCategory && styles.categoryTagActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryTagText,
                !selectedCategory && styles.categoryTagTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTag,
                selectedCategory === category.id && styles.categoryTagActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryTagText,
                  selectedCategory === category.id && styles.categoryTagTextActive,
                ]}
              >
                {category.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Grid de Produtos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          columnWrapperStyle={styles.gridRow}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          <Text style={styles.emptySubtext}>
            Tente buscar por outro termo ou categoria
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  cartBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 12,
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
  searchSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background.soft,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 13,
    color: colors.text.primary,
  },
  searchIcon: {
    fontSize: 18,
  },
  categoriesScroll: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoriesLoading: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  categoryTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.background.soft,
  },
  categoryTagActive: {
    backgroundColor: colors.primary,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  categoryTagTextActive: {
    color: colors.white,
  },
  productsGrid: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  productCard: {
    flex: 0.48,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.background.soft,
  },
  productInfo: {
    padding: spacing.md,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  productCategory: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
