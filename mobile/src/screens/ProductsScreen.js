import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
} from 'react-native';

// Mock de produtos (será substituído pela API real)
const mockProducts = [
  {
    id: '1',
    nome: 'Macarrão Integral',
    categoria: 'Grãos e Cereais',
    preco: 4.50,
    imagem: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop',
    quantidade: 500,
    unidade: 'g',
  },
  {
    id: '2',
    nome: 'Frango Peito',
    categoria: 'Carnes e Peixes',
    preco: 18.90,
    imagem: 'https://images.unsplash.com/photo-1633203777956-8f6530120795?w=200&h=200&fit=crop',
    quantidade: 600,
    unidade: 'g',
  },
  {
    id: '3',
    nome: 'Queijo Meia Cura',
    categoria: 'Laticínios',
    preco: 25.00,
    imagem: 'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=200&h=200&fit=crop',
    quantidade: 500,
    unidade: 'g',
  },
  {
    id: '4',
    nome: 'Tomate Caqui',
    categoria: 'Frutas e Vegetais',
    preco: 8.90,
    imagem: 'https://images.unsplash.com/photo-1583502282127-d0b88c4a5a7f?w=200&h=200&fit=crop',
    quantidade: 1,
    unidade: 'kg',
  },
  {
    id: '5',
    nome: 'Alface Crespa',
    categoria: 'Frutas e Vegetais',
    preco: 3.50,
    imagem: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    quantidade: 1,
    unidade: 'un',
  },
];

export default function ProductsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);

  const categories = ['Todos', 'Grãos e Cereais', 'Carnes e Peixes', 'Laticínios', 'Frutas e Vegetais'];

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product?.nome?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? true;
    const matchesCategory = !selectedCategory || selectedCategory === 'Todos' || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
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
          <Text style={styles.productPrice}>R$ {(item?.preco || 0).toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(item)}
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
        <Text style={styles.headerTitle}>Produtos (Mockado)</Text>
        {cart.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        )}
      </View>

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTag,
              selectedCategory === category && styles.categoryTagActive,
              category === 'Todos' && !selectedCategory && styles.categoryTagActive,
            ]}
            onPress={() => setSelectedCategory(category === 'Todos' ? null : category)}
          >
            <Text
              style={[
                styles.categoryTagText,
                (selectedCategory === category || (category === 'Todos' && !selectedCategory)) &&
                  styles.categoryTagTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid de Produtos */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.gridRow}
      />

      {/* Info Mockada */}
      <View style={styles.mockInfo}>
        <Text style={styles.mockInfoText}>
          💡 Esta é uma versão mockada dos produtos.{'\n'}
          Será integrada com a API real em breve.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  searchIcon: {
    fontSize: 18,
  },
  categoriesScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  categoryTagActive: {
    backgroundColor: '#4CAF50',
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  categoryTagTextActive: {
    color: '#fff',
  },
  productsGrid: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 10,
    color: '#999',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mockInfo: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  mockInfoText: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 18,
  },
});
