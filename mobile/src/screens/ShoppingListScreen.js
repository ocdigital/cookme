import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import shoppingListService from '../services/shoppingListService';

// Simple debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function ShoppingListScreen({ navigation }) {
  const [favoritos, setFavoritos] = useState([]);
  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [mostraBusca, setMostraBusca] = useState(false);

  useEffect(() => {
    try {
      // Carregar favoritos ao montar
      const fav = shoppingListService.obterFavoritos(10);
      if (fav && Array.isArray(fav)) {
        setFavoritos(fav);
      } else {
        console.warn('Favoritos inválidos:', fav);
        setFavoritos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavoritos([]);
    }
  }, []);

  // Debounce da busca
  const executarBusca = debounce((termo) => {
    if (termo.trim()) {
      const resultados = shoppingListService.buscarProdutos(termo);
      setResultadosBusca(resultados);
      setMostraBusca(true);
    } else {
      setResultadosBusca([]);
      setMostraBusca(false);
    }
  }, 300);

  const handleBuscaChange = (texto) => {
    setBusca(texto);
    executarBusca(texto);
  };

  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return `R$ ${Number(valor).toFixed(2)}`.replace('.', ',');
  };

  const renderFavoritoCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.favoritoCard}
      onPress={() =>
        navigation.navigate('ComparadorProduto', { nomeProduto: item.nome })
      }
      activeOpacity={0.7}
    >
      <View style={styles.favoritoHeader}>
        <View style={styles.favoritoInfo}>
          <View style={styles.frequenciaBadge}>
            <Text style={styles.frequenciaText}>{index + 1}</Text>
          </View>
          <View style={styles.favoritoTexts}>
            <Text style={styles.favoritoNome} numberOfLines={2}>
              {item.nome}
            </Text>
            <Text style={styles.frequenciaLabel}>
              {item.frequencia}x comprado
            </Text>
          </View>
        </View>

        <View style={styles.favoritoPrecos}>
          <Text style={styles.precoLabel}>Último</Text>
          <Text style={styles.precoAtual}>
            {formatarMoeda(item.ultimoPreco)}
          </Text>
        </View>
      </View>

      <View style={styles.favoritoFooter}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="trending-down" size={14} color="#4caf50" />
          <Text style={styles.footerLabel}>Melhor</Text>
          <Text style={styles.footerValue}>{formatarMoeda(item.menorPreco)}</Text>
        </View>

        <View style={styles.economiaItem}>
          <MaterialCommunityIcons name="percent" size={14} color="#ff6b6b" />
          <Text style={styles.economiaText}>
            +{((item.ultimoPreco - item.menorPreco) / item.menorPreco * 100).toFixed(0)}%
          </Text>
        </View>

        <View style={styles.btnComparar}>
          <MaterialCommunityIcons name="compare" size={16} color="#ff6b6b" />
          <Text style={styles.btnCompararText}>COMPARAR</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderResultadoBusca = ({ item }) => (
    <TouchableOpacity
      style={styles.resultadoItem}
      onPress={() =>
        navigation.navigate('ComparadorProduto', { nomeProduto: item.nome })
      }
    >
      <View style={styles.resultadoInfo}>
        <Text style={styles.resultadoNome}>{item.nome}</Text>
        <View style={styles.resultadoFooter}>
          <View style={styles.resultadoBadge}>
            <MaterialCommunityIcons name="repeat" size={12} color="#999" />
            <Text style={styles.resultadoBadgeText}>{item.frequencia}x</Text>
          </View>
          <Text style={styles.resultadoPreco}>{formatarMoeda(item.ultimoPreco)}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#ddd" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Minha Lista</Text>
          <Text style={styles.headerSubtitle}>
            🛒 Seu assistente no mercado
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          placeholderTextColor="#ccc"
          value={busca}
          onChangeText={handleBuscaChange}
        />
        {busca ? (
          <TouchableOpacity
            onPress={() => {
              setBusca('');
              setResultadosBusca([]);
              setMostraBusca(false);
            }}
          >
            <MaterialCommunityIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Resultados de Busca */}
        {mostraBusca && resultadosBusca.length > 0 ? (
          <View style={styles.buscaSection}>
            <Text style={styles.buscaTitle}>Resultados ({resultadosBusca.length})</Text>
            <FlatList
              data={resultadosBusca}
              renderItem={renderResultadoBusca}
              keyExtractor={(item) => item.nome}
              scrollEnabled={false}
            />
          </View>
        ) : mostraBusca && resultadosBusca.length === 0 ? (
          <View style={styles.semResultados}>
            <MaterialCommunityIcons
              name="magnify"
              size={48}
              color="#ddd"
            />
            <Text style={styles.semResultadosText}>Nenhum produto encontrado</Text>
            <Text style={styles.semResultadosSubtext}>
              Tente outro termo ou confira seus produtos favoritos
            </Text>
          </View>
        ) : (
          <>
            {/* Favoritos */}
            <View style={styles.favoritosSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="star"
                  size={20}
                  color="#ff9800"
                />
                <Text style={styles.sectionTitle}>
                  Seus Favoritos ({favoritos.length})
                </Text>
              </View>

              <FlatList
                data={favoritos}
                renderItem={renderFavoritoCard}
                keyExtractor={(item) => item.nome}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            </View>

            {/* Dica */}
            <View style={styles.dicaContainer}>
              <View style={styles.dicaCard}>
                <MaterialCommunityIcons
                  name="lightbulb"
                  size={20}
                  color="#ff9800"
                />
                <View style={styles.dicaText}>
                  <Text style={styles.dicaTitle}>💡 Dica Rápida</Text>
                  <Text style={styles.dicaDesc}>
                    Digite o nome de um produto para buscar com autocomplete.
                    Pressione COMPARAR para ver histórico de preços!
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  buscaSection: {
    paddingHorizontal: 16,
  },
  buscaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 12,
  },
  resultadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultadoInfo: {
    flex: 1,
  },
  resultadoNome: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  resultadoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  resultadoBadgeText: {
    fontSize: 10,
    color: '#999',
  },
  resultadoPreco: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  semResultados: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  semResultadosText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  semResultadosSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  favoritosSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  favoritoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  favoritoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  favoritoInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginRight: 12,
  },
  frequenciaBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequenciaText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  favoritoTexts: {
    flex: 1,
  },
  favoritoNome: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  frequenciaLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  favoritoPrecos: {
    alignItems: 'flex-end',
  },
  precoLabel: {
    fontSize: 9,
    color: '#999',
  },
  precoAtual: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  favoritoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLabel: {
    fontSize: 9,
    color: '#999',
  },
  footerValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  economiaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  economiaText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  btnComparar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fff3f1',
    borderRadius: 6,
  },
  btnCompararText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  dicaContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  dicaCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbf0',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  dicaText: {
    flex: 1,
  },
  dicaTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
  },
  dicaDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
});
