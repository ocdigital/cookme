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

export default function ShoppingScreen() {
  const [purchases, setPurchases] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadPurchases();
    loadStats();
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

  const loadStats = async () => {
    try {
      const response = await api.get('/compras/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchases();
    await loadStats();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
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
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="shopping-outline"
              size={24}
              color="#FF6B6B"
            />
            <Text style={styles.statValue}>{stats.totalCompras || 0}</Text>
            <Text style={styles.statLabel}>Compras</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="cash"
              size={24}
              color="#FF6B6B"
            />
            <Text style={styles.statValue}>
              {formatCurrency(stats.totalGasto || 0)}
            </Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
          {stats.totalEconomia > 0 && (
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="coin-multiple"
                size={24}
                color="#4CAF50"
              />
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {formatCurrency(stats.totalEconomia)}
              </Text>
              <Text style={styles.statLabel}>Economia</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.purchaseCard}>
            <View style={styles.purchaseHeader}>
              <View>
                <Text style={styles.purchaseLocal}>{item.local}</Text>
                <Text style={styles.purchaseDate}>
                  {formatDate(item.data)}
                </Text>
              </View>
              <View style={styles.purchaseTotal}>
                <Text style={styles.purchaseTotalValue}>
                  {formatCurrency(item.total)}
                </Text>
                {item.economia && item.economia > 0 && (
                  <Text style={styles.economiaLabel}>
                    Economia: {formatCurrency(item.economia)}
                  </Text>
                )}
              </View>
            </View>

            {item.itens && item.itens.length > 0 && (
              <View style={styles.itensContainer}>
                <Text style={styles.itensTitle}>
                  {item.itens.length} item{item.itens.length !== 1 ? 'ns' : ''}
                </Text>
                {item.itens.slice(0, 3).map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {item.quantidade}x {formatCurrency(item.preco_unitario)}
                    </Text>
                  </View>
                ))}
                {item.itens.length > 3 && (
                  <Text style={styles.moreItems}>
                    +{item.itens.length - 3} itens
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="shopping-outline"
              size={64}
              color="#ddd"
            />
            <Text style={styles.emptyText}>Nenhuma compra registrada</Text>
            <Text style={styles.emptySubtext}>
              Registre suas compras para ver estatísticas
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  purchaseCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12,
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
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  itensTitle: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  moreItems: {
    fontSize: 11,
    color: '#FF6B6B',
    marginTop: 4,
    fontWeight: '600',
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
