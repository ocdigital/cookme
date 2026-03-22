import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Dados fictícios para comparação
 */
const COMPRA_ATUAL = {
  id: '1',
  data: '20/03/2026',
  total: 417.18,
  itens: [
    { id: 1, nome: 'BOLO PANCO ABACAXI 300G', qtd: 1, precoAnterior: 10.50, precoAtual: 10.98, economia: -0.48 },
    { id: 2, nome: 'CAFE MORGES VACUO 500G', qtd: 1, precoAnterior: 25.98, precoAtual: 25.98, economia: 0 },
    { id: 3, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 1, precoAnterior: 23.76, precoAtual: 21.80, economia: 1.96 },
    { id: 4, nome: 'BISCOITO INTEGRAL 200G', qtd: 2, precoAnterior: 4.99, precoAtual: 4.99, economia: 0 },
    { id: 5, nome: 'LEITE INTEGRAL 1L', qtd: 3, precoAnterior: 5.50, precoAtual: 5.80, economia: -0.90 },
    { id: 6, nome: 'FRANGO PEITO 800G', qtd: 1, precoAnterior: 18.59, precoAtual: 18.59, economia: 0 },
    { id: 7, nome: 'ARROZ GRAO 5KG', qtd: 1, precoAnterior: 10.98, precoAtual: 10.98, economia: 0 },
    { id: 8, nome: 'FEIJAO BROTO 2 UN', qtd: 2, precoAnterior: 8.99, precoAtual: 8.99, economia: 0 },
    { id: 9, nome: 'TOMATE SALADA KG', qtd: 1, precoAnterior: 10.98, precoAtual: 8.43, economia: 2.55 },
    { id: 10, nome: 'CEBOLA NACIONAL KG', qtd: 1, precoAnterior: 4.69, precoAtual: 4.08, economia: 0.61 },
  ],
};

const COMPRA_ANTERIOR = {
  id: '2',
  data: '13/03/2026',
  total: 498.50,
  itens: [
    { id: 1, nome: 'BOLO PANCO ABACAXI 300G', qtd: 1, precoAnterior: 10.50, precoAtual: 10.50, economia: 0 },
    { id: 2, nome: 'CAFE MORGES VACUO 500G', qtd: 1, precoAnterior: 25.98, precoAtual: 25.98, economia: 0 },
    { id: 3, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 2, precoAnterior: 11.88, precoAtual: 23.76, economia: -11.88 },
    { id: 4, nome: 'LEITE INTEGRAL 1L', qtd: 2, precoAnterior: 5.50, precoAtual: 11.00, economia: 0 },
  ],
};

export default function ComparacaoScreen({ navigation, route }) {
  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return `R$ ${Number(valor).toFixed(2)}`.replace('.', ',');
  };

  const getCorEconomia = (valor) => {
    if (valor > 0) return { bg: '#e8f5e9', text: '#2e7d32', icon: 'trending-down' };
    if (valor < 0) return { bg: '#ffebee', text: '#c62828', icon: 'trending-up' };
    return { bg: '#f5f5f5', text: '#757575', icon: 'minus' };
  };

  // Calcular totais
  const totalEconomia = COMPRA_ATUAL.itens.reduce((sum, item) => sum + item.economia, 0);
  const percentualEconomia = ((totalEconomia / COMPRA_ANTERIOR.total) * 100).toFixed(1);
  const itensMais = COMPRA_ATUAL.itens.filter((i) => i.economia > 0).length;
  const itensMenos = COMPRA_ATUAL.itens.filter((i) => i.economia < 0).length;

  const renderItemComparacao = ({ item }) => {
    const cor = getCorEconomia(item.economia);

    return (
      <View style={styles.itemComparacao}>
        <View style={styles.itemNome}>
          <Text style={styles.itemNomeText} numberOfLines={2}>
            {item.nome}
          </Text>
          <Text style={styles.itemQtd}>Qtd: {item.qtd}</Text>
        </View>

        <View style={styles.itemPrecos}>
          <View style={styles.precoColuna}>
            <Text style={styles.precoLabel}>Anterior</Text>
            <Text style={styles.precoValor}>{formatarMoeda(item.precoAnterior)}</Text>
          </View>

          <MaterialCommunityIcons name="arrow-right" size={16} color="#ddd" />

          <View style={styles.precoColuna}>
            <Text style={styles.precoLabel}>Atual</Text>
            <Text style={styles.precoValor}>{formatarMoeda(item.precoAtual)}</Text>
          </View>
        </View>

        <View style={[styles.economiaColuna, { backgroundColor: cor.bg }]}>
          <MaterialCommunityIcons name={cor.icon} size={16} color={cor.text} />
          <Text style={[styles.economiaValor, { color: cor.text }]}>
            {item.economia > 0 ? '-' : item.economia < 0 ? '+' : ''}
            {Math.abs(item.economia).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparação de Compras</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Resumo */}
        <View style={styles.resumoContainer}>
          <View style={styles.resumoCard}>
            <View style={styles.resumoTop}>
              <Text style={styles.resumoLabel}>Compra Anterior</Text>
              <Text style={styles.resumoData}>{COMPRA_ANTERIOR.data}</Text>
            </View>
            <Text style={styles.resumoTotal}>{formatarMoeda(COMPRA_ANTERIOR.total)}</Text>
          </View>

          <View style={styles.resumoIconContainer}>
            <MaterialCommunityIcons name="compare" size={24} color="#ff6b6b" />
          </View>

          <View style={styles.resumoCard}>
            <View style={styles.resumoTop}>
              <Text style={styles.resumoLabel}>Compra Atual</Text>
              <Text style={styles.resumoData}>{COMPRA_ATUAL.data}</Text>
            </View>
            <Text style={styles.resumoTotal}>{formatarMoeda(COMPRA_ATUAL.total)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: totalEconomia > 0 ? '#e8f5e9' : '#ffebee' },
            ]}
          >
            <MaterialCommunityIcons
              name={totalEconomia > 0 ? 'trending-down' : 'trending-up'}
              size={28}
              color={totalEconomia > 0 ? '#2e7d32' : '#c62828'}
            />
            <Text style={styles.statLabel}>Diferença Total</Text>
            <Text
              style={[
                styles.statValue,
                { color: totalEconomia > 0 ? '#2e7d32' : '#c62828' },
              ]}
            >
              {totalEconomia > 0 ? '-' : '+'}
              {Math.abs(totalEconomia).toFixed(2)}
            </Text>
            <Text
              style={[
                styles.statPercent,
                { color: totalEconomia > 0 ? '#2e7d32' : '#c62828' },
              ]}
            >
              {percentualEconomia}%
            </Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-down" size={28} color="#4caf50" />
            <Text style={styles.statLabel}>Mais Baratos</Text>
            <Text style={styles.statValue}>{itensMais}</Text>
            <Text style={styles.statPercent}>itens</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={28} color="#ff6b6b" />
            <Text style={styles.statLabel}>Mais Caros</Text>
            <Text style={styles.statValue}>{itensMenos}</Text>
            <Text style={styles.statPercent}>itens</Text>
          </View>
        </View>

        {/* Lista Comparativa */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Detalhes dos Itens</Text>
          <Text style={styles.listSubtitle}>{COMPRA_ATUAL.itens.length} produtos</Text>
        </View>

        <FlatList
          data={COMPRA_ATUAL.itens}
          renderItem={renderItemComparacao}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.bottomBtn}>
          <MaterialCommunityIcons name="download" size={20} color="#fff" />
          <Text style={styles.bottomBtnText}>Salvar Comparação</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  resumoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  resumoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  resumoTop: {
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  resumoData: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 2,
  },
  resumoTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  resumoIconContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statPercent: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  itemComparacao: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f5f5f5',
  },
  itemNome: {
    marginBottom: 12,
  },
  itemNomeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  itemQtd: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  itemPrecos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  precoColuna: {
    flex: 1,
  },
  precoLabel: {
    fontSize: 9,
    color: '#999',
  },
  precoValor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  economiaColuna: {
    width: 60,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 2,
  },
  economiaValor: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomAction: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  bottomBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
