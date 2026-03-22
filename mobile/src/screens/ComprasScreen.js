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
 * Dados fictícios para demonstração
 */
const MOCK_COMPRAS = [
  {
    id: '1',
    data: '20/03/2026',
    local: 'Hipermarket Bom Preço',
    total: 417.18,
    itens: 22,
    cupom: '11308_176',
    economia: 45.32,
  },
  {
    id: '2',
    data: '13/03/2026',
    local: 'Supermercado Zona Sul',
    total: 498.50,
    itens: 28,
    cupom: '11307_175',
    economia: 12.50,
  },
  {
    id: '3',
    data: '06/03/2026',
    local: 'Hipermarket Bom Preço',
    total: 520.75,
    itens: 25,
    cupom: '11306_174',
    economia: -18.30,
  },
  {
    id: '4',
    data: '27/02/2026',
    local: 'Supermercado Zona Sul',
    total: 445.90,
    itens: 20,
    cupom: '11305_173',
    economia: 5.20,
  },
  {
    id: '5',
    data: '20/02/2026',
    local: 'Mercado do Bairro',
    total: 389.50,
    itens: 18,
    cupom: '11304_172',
    economia: 55.40,
  },
];

export default function ComprasScreen({ navigation }) {
  const [selectedCompra, setSelectedCompra] = useState(null);

  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return `R$ ${Number(valor).toFixed(2)}`.replace('.', ',');
  };

  const getEconomiaColor = (economia) => {
    if (economia > 0) return '#4caf50'; // Verde
    if (economia < 0) return '#ff6b6b'; // Vermelho
    return '#999'; // Cinza
  };

  const getEconomiaIcon = (economia) => {
    if (economia > 0) return 'trending-down';
    if (economia < 0) return 'trending-up';
    return 'minus';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.compraCard}
      onPress={() => setSelectedCompra(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.compraHeader}>
        <View style={styles.compraInfo}>
          <Text style={styles.dataCompra}>{item.data}</Text>
          <Text style={styles.localCompra}>{item.local}</Text>
        </View>
        <View
          style={[
            styles.economiaTag,
            { backgroundColor: getEconomiaColor(item.economia) + '20' },
          ]}
        >
          <MaterialCommunityIcons
            name={getEconomiaIcon(item.economia)}
            size={16}
            color={getEconomiaColor(item.economia)}
          />
          <Text
            style={[
              styles.economiaText,
              { color: getEconomiaColor(item.economia) },
            ]}
          >
            {Math.abs(item.economia) > 0
              ? `${item.economia > 0 ? '-' : '+'}${Math.abs(item.economia).toFixed(2)}`
              : '0,00'}
          </Text>
        </View>
      </View>

      <View style={styles.compraFooter}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="tag-multiple" size={16} color="#999" />
          <Text style={styles.footerText}>{item.itens} itens</Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="receipt" size={16} color="#999" />
          <Text style={styles.footerText}>#{item.cupom}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.totalCompra}>{formatarMoeda(item.total)}</Text>
        </View>
      </View>

      {selectedCompra === item.id && (
        <View style={styles.compraActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Comparacao', { compraId: item.id })}
          >
            <MaterialCommunityIcons name="compare" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Comparar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => navigation.navigate('Detalhes', { compraId: item.id })}
          >
            <MaterialCommunityIcons name="eye" size={16} color="#ff6b6b" />
            <Text style={[styles.actionBtnText, { color: '#ff6b6b' }]}>
              Detalhes
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  // Calcular stats
  const totalGasto = MOCK_COMPRAS.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
  const totalEconomizado = MOCK_COMPRAS.reduce((sum, c) => sum + (Number(c.economia) > 0 ? Number(c.economia) : 0), 0);
  const mediaCompra = MOCK_COMPRAS.length > 0 ? (totalGasto / MOCK_COMPRAS.length).toFixed(2) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Compras</Text>
        <Text style={styles.headerSubtitle}>Acompanhe seu histórico</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="cart" size={24} color="#ff6b6b" />
            </View>
            <Text style={styles.statLabel}>Total Gasto</Text>
            <Text style={styles.statValue}>{formatarMoeda(totalGasto)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="trending-down" size={24} color="#4caf50" />
            </View>
            <Text style={styles.statLabel}>Economizado</Text>
            <Text style={styles.statValue}>{formatarMoeda(totalEconomizado)}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="calculator" size={24} color="#2196f3" />
            </View>
            <Text style={styles.statLabel}>Média por Compra</Text>
            <Text style={styles.statValue}>{formatarMoeda(mediaCompra)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="counter" size={24} color="#ff9800" />
            </View>
            <Text style={styles.statLabel}>Total de Compras</Text>
            <Text style={styles.statValue}>{MOCK_COMPRAS.length}</Text>
          </View>
        </View>

        {/* Compras List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Histórico de Compras</Text>
        </View>

        <FlatList
          data={MOCK_COMPRAS}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
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
    paddingVertical: 20,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  compraCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  compraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  compraInfo: {
    flex: 1,
  },
  dataCompra: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  localCompra: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  economiaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  economiaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compraFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#999',
  },
  totalCompra: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  compraActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 6,
    paddingVertical: 8,
    gap: 4,
  },
  actionBtnSecondary: {
    backgroundColor: '#f5f5f5',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
