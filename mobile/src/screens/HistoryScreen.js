import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert, // <--- Importar Alert
} from 'react-native';
import { scraperService } from '../services/api';

const STATUS_LABELS = {
// ... (Mantido o mesmo)
  iniciando: 'Iniciando',
  consultando_sat: 'Consultando SAT',
  aguardando_captcha: 'Aguardando CAPTCHA',
  processando_dados: 'Processando Dados',
  salvando_api: 'Salvando',
  concluido: 'Concluído',
  erro: 'Erro',
  timeout: 'Timeout',
  cancelado: 'Cancelado',
};

const STATUS_COLORS = {
// ... (Mantido o mesmo)
  iniciando: '#FFA726',
  consultando_sat: '#42A5F5',
  aguardando_captcha: '#FFA726',
  processando_dados: '#42A5F5',
  salvando_api: '#42A5F5',
  concluido: '#66BB6A',
  erro: '#EF5350',
  timeout: '#EF5350',
  cancelado: '#9E9E9E',
};

export default function HistoryScreen({ navigation }) {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false); // Novo estado

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      setLoading(true);
      const data = await scraperService.getMinhasConsultas();
      setConsultas(data);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConsultas();
    setRefreshing(false);
  };

  // ---------------------------------------------
  // FUNÇÃO PARA LIMPAR O HISTÓRICO
  // ---------------------------------------------
  const handleClearHistory = () => {
    Alert.alert(
      'Limpar Histórico',
      'Tem certeza que deseja apagar **TODO** o seu histórico de consultas? Esta ação é irreversível.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sim, Apagar Tudo',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              // *** CHAMADA AO NOVO MÉTODO NO SCRAPER SERVICE ***
              await scraperService.clearMinhasConsultas(); 
              
              // Se o backend retornou sucesso, limpa o estado local
              setConsultas([]);
              Alert.alert('Sucesso', 'O histórico de consultas foi limpo com sucesso.');
            } catch (error) {
              console.error('Erro ao limpar histórico:', error);
              Alert.alert('Erro', 'Não foi possível limpar o histórico. Tente novamente.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };
  // ---------------------------------------------

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

  const renderItem = ({ item }) => {
    // ... (Mantido o mesmo)
    const statusColor = STATUS_COLORS[item.status] || '#9E9E9E';
    const statusLabel = STATUS_LABELS[item.status] || item.status;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          // ... (Mantido o mesmo)
          console.log('Item clicado:', item);
          console.log('Item.compraId:', item.compraId);
          if (item.compraId) {
            console.log('Navegando para PurchaseDetails com compraId:', item.compraId);
            navigation.navigate('PurchaseDetails', { compraId: item.compraId });
          } else {
            console.log('compraId não encontrado no item');
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${item.progress}%`, backgroundColor: statusColor },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>

          {item.status === 'concluido' && (
            <View style={styles.successInfo}>
              <Text style={styles.infoText}>
                ✅ {item.totalProdutos} produtos
              </Text>
              <Text style={styles.infoText}>
                💰 R$ {item.valorTotal?.toFixed(2)}
              </Text>
            </View>
          )}

          {item.erro && (
            <View style={styles.errorInfo}>
              <Text style={styles.errorText}>❌ {item.erro}</Text>
            </View>
          )}

          <Text style={styles.sessionId}>
            Session: {item.sessionId.substring(0, 8)}...
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* NOVO: Botão de Limpar Histórico */}
      {consultas.length > 0 && (
        <View style={styles.clearButtonContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.clearButtonText}>🗑️ Limpar Histórico</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={consultas}
        renderItem={renderItem}
        keyExtractor={(item) => item.sessionId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              Nenhuma consulta realizada ainda
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Text style={styles.scanButtonText}>
                Escanear Primeiro Cupom
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Estilos existentes)
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // ---------------------------------------------
  // NOVOS ESTILOS
  // ---------------------------------------------
  clearButtonContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  clearButton: {
    backgroundColor: '#9E9E9E',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // ... (Restante dos estilos)
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
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  cardBody: {
    gap: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  successInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  errorInfo: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#C62828',
  },
  sessionId: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});