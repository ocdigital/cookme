import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { comprasService } from '../services/api';

const PurchaseDetailsScreen = ({ route, navigation }) => {
  const { compraId } = route.params;
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('PurchaseDetailsScreen - compraId recebido:', compraId);
    console.log('PurchaseDetailsScreen - type:', typeof compraId);
    loadPurchaseDetails();
  }, []);

  const loadPurchaseDetails = async () => {
    try {
      setLoading(true);
      console.log('Chamando comprasService.getById com:', compraId);
      const data = await comprasService.getById(compraId);
      console.log('Resposta recebida:', data);
      setCompra(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da compra:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      Alert.alert('Erro', `Não foi possível carregar os detalhes da compra: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchaseDetails();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItemCard = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemNumber}>
          <Text style={styles.itemNumberText}>{item.quantidade}</Text>
          <Text style={styles.itemUnit}>
            {item.unidade?.toLowerCase() || 'un'}
          </Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.produto?.nome || 'Produto desconhecido'}
          </Text>
          <Text style={styles.itemCode}>
            Código: {item.produto?.codigo_barras || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Unitário</Text>
          <Text style={styles.priceValue}>
            R$ {parseFloat(item.preco_unitario || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValueTotal}>
            R$ {(parseFloat(item.quantidade) * parseFloat(item.preco_unitario || 0)).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!compra) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Compra não encontrada</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadPurchaseDetails}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalItems = compra.itens?.length || 0;
  const totalValue = parseFloat(compra.valor_total || 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
        />
      }
    >
      {/* Header com informações gerais */}
      <View style={styles.headerSection}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>Local</Text>
          <Text style={styles.headerValue} numberOfLines={2}>
            {compra.local_compra || 'Não informado'}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>Data da Compra</Text>
          <Text style={styles.headerValue}>
            {formatDate(compra.data_compra)}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>Método de Cadastro</Text>
          <Text style={styles.headerValue}>
            {compra.metodo_cadastro === 'cupom_sat' ? '🧾 Cupom SAT' : '📝 Manual'}
          </Text>
        </View>
      </View>

      {/* Resumo de valores */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total de Itens</Text>
          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Valor Total</Text>
          <Text style={styles.summaryValueTotal}>
            R$ {totalValue.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Lista de itens */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Itens da Compra</Text>

        {totalItems > 0 ? (
          <FlatList
            data={compra.itens}
            renderItem={renderItemCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.itemsList}
          />
        ) : (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>Nenhum item nesta compra</Text>
          </View>
        )}
      </View>

      {/* Footer com ação */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Deletar Compra',
              'Tem certeza que deseja deletar esta compra? Esta ação não pode ser desfeita.',
              [
                { text: 'Cancelar', onPress: () => {} },
                {
                  text: 'Deletar',
                  onPress: async () => {
                    try {
                      await comprasService.delete(compraId);
                      Alert.alert('Sucesso', 'Compra deletada com sucesso');
                      navigation.goBack();
                    } catch (error) {
                      Alert.alert('Erro', 'Não foi possível deletar a compra');
                    }
                  },
                  style: 'destructive',
                },
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>🗑️ Deletar Compra</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerSection: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerInfo: {
    marginBottom: 15,
  },
  headerLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 5,
  },
  headerValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  summarySection: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  itemsSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemNumber: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  itemUnit: {
    fontSize: 10,
    color: '#558B2F',
    marginTop: 2,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceValueTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyItems: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF5350',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PurchaseDetailsScreen;
