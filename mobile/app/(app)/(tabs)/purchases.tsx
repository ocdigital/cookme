import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { Compra } from '@/types';

export default function PurchasesScreen() {
  const [purchases, setPurchases] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setError(null);
      const response = await api.get('/compras');
      setPurchases(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar compras:', err);
      setError('Erro ao carregar compras');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchases();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
        <TouchableOpacity style={styles.retryButton} onPress={loadPurchases}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.purchaseCard}>
            <TouchableOpacity
              style={styles.purchaseHeader}
              onPress={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
            >
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.purchaseLocal}>{item.local}</Text>
                  <Text style={styles.purchaseDate}>
                    {formatDate(item.data)}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                <View style={styles.purchaseTotal}>
                  <Text style={styles.purchaseTotalValue}>
                    {formatCurrency(item.total)}
                  </Text>
                  {item.economia && item.economia > 0 && (
                    <Text style={styles.economiaLabel}>
                      Economizou {formatCurrency(item.economia)}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons
                  name={
                    expandedId === item.id
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={24}
                  color="#999"
                  style={{ marginLeft: 12 }}
                />
              </View>
            </TouchableOpacity>

            {expandedId === item.id && item.itens && item.itens.length > 0 && (
              <View style={styles.itensContainer}>
                <View style={styles.itensDivider} />
                <Text style={styles.itensTitle}>
                  {item.itens.length} item{item.itens.length !== 1 ? 'ns' : ''} nesta compra
                </Text>

                {item.itens.map((itemCompra, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {itemCompra.nome}
                      </Text>
                      <Text style={styles.itemQty}>
                        Qty: {itemCompra.quantidade}
                      </Text>
                    </View>
                    <View style={styles.itemPrice}>
                      <Text style={styles.itemUnitPrice}>
                        {formatCurrency(itemCompra.preco_unitario)}
                      </Text>
                      <Text style={styles.itemTotalPrice}>
                        {formatCurrency(itemCompra.preco_total)}
                      </Text>
                    </View>
                  </View>
                ))}

                {item.cupom && (
                  <View style={styles.cupomRow}>
                    <MaterialCommunityIcons
                      name="receipt"
                      size={16}
                      color="#999"
                    />
                    <Text style={styles.cupomText}>{item.cupom}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="history"
              size={64}
              color="#ddd"
            />
            <Text style={styles.emptyText}>Nenhuma compra registrada</Text>
            <Text style={styles.emptySubtext}>
              Seu histórico de compras aparecerá aqui
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
    paddingBottom: 150,
  },
  purchaseCard: {
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
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  purchaseLocal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  purchaseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  purchaseTotal: {
    alignItems: 'flex-end',
  },
  purchaseTotalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  economiaLabel: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  itensContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  itensDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  itensTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  itemQty: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  itemPrice: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  itemUnitPrice: {
    fontSize: 11,
    color: '#999',
  },
  itemTotalPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  cupomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 6,
  },
  cupomText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
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
    textAlign: 'center',
    paddingHorizontal: 20,
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
