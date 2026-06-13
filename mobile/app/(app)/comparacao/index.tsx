import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '@/components/ScreenWrapper';

interface Compra {
  id: string;
  local: string;
  data: string;
  total: number;
  economia?: number;
  itens?: any[];
}

// Dados fictícios para comparação
const mockCompras: Record<string, Compra> = {
  '1': {
    id: '1',
    local: 'Hipermarket',
    data: '2026-03-20',
    total: 417.18,
    economia: 45.32,
    itens: [
      { nome: 'BOLO PANCO 300G', quantidade: 2, preco_unitario: 10.50 },
      { nome: 'AGUA MIN BIOLEUE 12', quantidade: 2, preco_unitario: 23.76 },
      { nome: 'CAFE MORGES 500G', quantidade: 1, preco_unitario: 25.90 },
    ],
  },
  '2': {
    id: '2',
    local: 'Supermercado',
    data: '2026-03-13',
    total: 498.50,
    economia: -12.50,
    itens: [
      { nome: 'BOLO PANCO 300G', quantidade: 2, preco_unitario: 10.98 },
      { nome: 'AGUA MIN BIOLEUE 12', quantidade: 2, preco_unitario: 21.80 },
      { nome: 'CAFE MORGES 500G', quantidade: 1, preco_unitario: 28.50 },
    ],
  },
};

export default function ComparacaoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [currentCompra, setCurrentCompra] = useState<Compra | null>(null);
  const [previousCompra, setPreviousCompra] = useState<Compra | null>(null);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 500));

    // Usar dados fictícios
    const current = mockCompras['1'];
    const previous = mockCompras['2'];

    if (current && previous) {
      const diff = current.total - previous.total;
      const percentChange = ((diff / previous.total) * 100).toFixed(1);

      // Comparar itens
      const comparisonItems = current.itens?.map(item => {
        const prevItem = previous.itens?.find(
          (p: any) => p.nome === item.nome
        );
        return {
          nome: item.nome,
          atual: item.preco_unitario,
          anterior: prevItem?.preco_unitario || 0,
          diferenca: item.preco_unitario - (prevItem?.preco_unitario || 0),
        };
      }) || [];

      setCurrentCompra(current);
      setPreviousCompra(previous);
      setComparison({
        diferenca: diff,
        percentChange,
        maisBaratos: comparisonItems.filter((i: any) => i.diferenca < 0).length,
        maisCaros: comparisonItems.filter((i: any) => i.diferenca > 0).length,
        items: comparisonItems,
      });
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </ScreenWrapper>
    );
  }

  if (!currentCompra || !previousCompra || !comparison) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comparação</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredContent}>
          <Text style={styles.errorText}>Dados não encontrados</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const isDifferencePositive = comparison.diferenca < 0;

  return (
    <ScreenWrapper>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparação</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Compra Anterior</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(previousCompra.total)}
            </Text>
            <Text style={styles.summaryDate}>
              {formatDate(previousCompra.data)}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons
              name="swap-vertical"
              size={24}
              color="#FF6B6B"
            />
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Compra Atual</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(currentCompra.total)}
            </Text>
            <Text style={styles.summaryDate}>
              {formatDate(currentCompra.data)}
            </Text>
          </View>
        </View>

        {/* Difference */}
        <View
          style={[
            styles.differenceCard,
            isDifferencePositive && styles.positiveCard,
          ]}
        >
          <Text style={styles.differenceLabel}>Diferença Total</Text>
          <Text
            style={[
              styles.differenceValue,
              isDifferencePositive && styles.positiveText,
            ]}
          >
            {isDifferencePositive ? '-' : '+'}
            {formatCurrency(Math.abs(comparison.diferenca))}
          </Text>
          <Text style={styles.percentageText}>
            {isDifferencePositive ? '-' : '+'}
            {comparison.percentChange}%
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="arrow-down"
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.statText}>
                {comparison.maisBaratos} mais baratos
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="arrow-up"
                size={20}
                color="#FF6B6B"
              />
              <Text style={styles.statText}>
                {comparison.maisCaros} mais caros
              </Text>
            </View>
          </View>
        </View>

        {/* Item Comparison */}
        <Text style={styles.sectionTitle}>Comparação por Item</Text>
        <View style={styles.itemsContainer}>
          {comparison.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemComparisonCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <MaterialCommunityIcons
                  name={item.diferenca < 0 ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={item.diferenca < 0 ? '#4CAF50' : '#FF6B6B'}
                />
              </View>

              <View style={styles.priceComparison}>
                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Anterior</Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(item.anterior)}
                  </Text>
                </View>

                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Atual</Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(item.atual)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.differencePill,
                    item.diferenca < 0
                      ? styles.savingPill
                      : styles.costPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.differencePillText,
                      item.diferenca < 0
                        ? styles.savingText
                        : styles.costText,
                    ]}
                  >
                    {item.diferenca < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(item.diferenca))}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.spacing} />
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  summaryDate: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
  },
  arrowContainer: {
    marginVertical: 8,
  },
  differenceCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  positiveCard: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#FF6B6B',
  },
  differenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  differenceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  positiveText: {
    color: '#FF6B6B',
  },
  percentageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemComparisonCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priceComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  priceColumn: {
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
  differencePill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  savingPill: {
    backgroundColor: '#e8f5e9',
  },
  costPill: {
    backgroundColor: '#ffebee',
  },
  differencePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  savingText: {
    color: '#4CAF50',
  },
  costText: {
    color: '#FF6B6B',
  },
  spacing: {
    height: 20,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
  },
});
