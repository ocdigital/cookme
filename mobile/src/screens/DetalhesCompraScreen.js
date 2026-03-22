import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Dados fictícios - detalhes de uma compra
 */
const COMPRA_DETALHES = {
  id: '1',
  data: '20/03/2026',
  local: 'Hipermarket Bom Preço',
  total: 417.18,
  cupom: '11308_176',
  itens: [
    { id: 1, nome: 'BOLO PANCO ABACAXI 300G', qtd: 1, precoUnitario: 10.98, precoTotal: 10.98 },
    { id: 2, nome: 'CAFE MORGES VACUO 500G', qtd: 1, precoUnitario: 25.98, precoTotal: 25.98 },
    { id: 3, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 1, precoUnitario: 21.80, precoTotal: 21.80 },
    { id: 4, nome: 'BISCOITO INTEGRAL 200G', qtd: 2, precoUnitario: 4.99, precoTotal: 9.98 },
    { id: 5, nome: 'LEITE INTEGRAL 1L', qtd: 3, precoUnitario: 5.80, precoTotal: 17.40 },
    { id: 6, nome: 'FRANGO PEITO 800G', qtd: 1, precoUnitario: 18.59, precoTotal: 18.59 },
    { id: 7, nome: 'ARROZ GRAO 5KG', qtd: 1, precoUnitario: 10.98, precoTotal: 10.98 },
    { id: 8, nome: 'FEIJAO BROTO 2 UN', qtd: 2, precoUnitario: 8.99, precoTotal: 17.98 },
    { id: 9, nome: 'TOMATE SALADA KG', qtd: 1, precoUnitario: 8.43, precoTotal: 8.43 },
    { id: 10, nome: 'CEBOLA NACIONAL KG', qtd: 1, precoUnitario: 4.08, precoTotal: 4.08 },
  ],
};

export default function DetalhesCompraScreen({ navigation, route }) {
  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return `R$ ${Number(valor).toFixed(2)}`.replace('.', ',');
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.nome}</Text>
        <Text style={styles.itemQtd}>Qtd: {item.qtd} × {formatarMoeda(item.precoUnitario)}</Text>
      </View>
      <Text style={styles.itemPrice}>{formatarMoeda(item.precoTotal)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Compra</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infRow}>
            <View style={styles.infItem}>
              <Text style={styles.infLabel}>Data</Text>
              <Text style={styles.infValue}>{COMPRA_DETALHES.data}</Text>
            </View>
            <View style={styles.infItem}>
              <Text style={styles.infLabel}>Local</Text>
              <Text style={styles.infValue}>{COMPRA_DETALHES.local}</Text>
            </View>
          </View>

          <View style={styles.infRow}>
            <View style={styles.infItem}>
              <Text style={styles.infLabel}>Cupom</Text>
              <Text style={styles.infValue}>#{COMPRA_DETALHES.cupom}</Text>
            </View>
            <View style={styles.infItem}>
              <Text style={styles.infLabel}>Total</Text>
              <Text style={[styles.infValue, { color: '#ff6b6b', fontWeight: 'bold' }]}>
                {formatarMoeda(COMPRA_DETALHES.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens da Compra ({COMPRA_DETALHES.itens.length})</Text>

          <View style={styles.itemsContainer}>
            <FlatList
              data={COMPRA_DETALHES.itens}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total da Compra</Text>
              <Text style={styles.totalValue}>{formatarMoeda(COMPRA_DETALHES.total)}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="download" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Salvar Nota Fiscal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
            <MaterialCommunityIcons name="share" size={20} color="#ff6b6b" />
            <Text style={[styles.actionBtnText, { color: '#ff6b6b' }]}>Compartilhar</Text>
          </TouchableOpacity>
        </View>

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
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  infRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infItem: {
    flex: 1,
  },
  infLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  infValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  itemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQtd: {
    fontSize: 10,
    color: '#999',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff6b6b',
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  actionsContainer: {
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  actionBtnSecondary: {
    backgroundColor: '#f5f5f5',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
