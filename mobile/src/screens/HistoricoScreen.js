import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

/**
 * Dados fictícios de histórico de preços
 */
const HISTORICO_PRODUTOS = [
  {
    id: 1,
    nome: 'CAFÉ MORGES VACUO 500G',
    precos: [
      { data: '20/01', preco: 25.50 },
      { data: '27/01', preco: 26.20 },
      { data: '03/02', preco: 25.98 },
      { data: '10/02', preco: 27.50 },
      { data: '17/02', preco: 26.80 },
      { data: '24/02', preco: 25.98 },
      { data: '03/03', preco: 26.50 },
      { data: '10/03', preco: 25.98 },
      { data: '17/03', preco: 25.98 },
      { data: '20/03', preco: 25.98 },
    ],
  },
  {
    id: 2,
    nome: 'AGUA MIN BIOLEUE PRIME',
    precos: [
      { data: '20/01', preco: 25.50 },
      { data: '27/01', preco: 25.00 },
      { data: '03/02', preco: 24.50 },
      { data: '10/02', preco: 23.76 },
      { data: '17/02', preco: 23.76 },
      { data: '24/02', preco: 23.00 },
      { data: '03/03', preco: 22.50 },
      { data: '10/03', preco: 22.00 },
      { data: '17/03', preco: 21.80 },
      { data: '20/03', preco: 21.80 },
    ],
  },
  {
    id: 3,
    nome: 'BOLO PANCO ABACAXI',
    precos: [
      { data: '20/01', preco: 9.50 },
      { data: '27/01', preco: 9.50 },
      { data: '03/02', preco: 10.20 },
      { data: '10/02', preco: 10.50 },
      { data: '17/02', preco: 10.50 },
      { data: '24/02', preco: 10.50 },
      { data: '03/03', preco: 10.98 },
      { data: '10/03', preco: 10.98 },
      { data: '17/03', preco: 10.98 },
      { data: '20/03', preco: 10.98 },
    ],
  },
];

export default function HistoricoScreen({ navigation }) {
  const [selectedProduct, setSelectedProduct] = useState(HISTORICO_PRODUTOS[0]);
  const [chartType, setChartType] = useState('line'); // 'line' ou 'bar'

  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return `R$ ${Number(valor).toFixed(2)}`.replace('.', ',');
  };

  // Calcular stats do produto
  const precos = selectedProduct.precos.map((p) => p.preco);
  const minPreco = Math.min(...precos);
  const maxPreco = Math.max(...precos);
  const mediaPreco = (precos.reduce((a, b) => a + b, 0) / precos.length).toFixed(2);
  const precoAtual = precos[precos.length - 1];
  const mudanca = (precoAtual - precos[0]).toFixed(2);
  const mudancaPercent = ((mudanca / precos[0]) * 100).toFixed(1);

  // Dados para o gráfico
  const chartData = {
    labels: selectedProduct.precos.map((p) => p.data.split('/')[0]),
    datasets: [
      {
        data: precos,
        color: () => '#ff6b6b',
        strokeWidth: 2,
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Preços</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Selector de Produtos */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Selecione um Produto:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorList}
          >
            {HISTORICO_PRODUTOS.map((produto) => (
              <TouchableOpacity
                key={produto.id}
                style={[
                  styles.selectorBtn,
                  selectedProduct.id === produto.id && styles.selectorBtnActive,
                ]}
                onPress={() => setSelectedProduct(produto)}
              >
                <Text
                  style={[
                    styles.selectorBtnText,
                    selectedProduct.id === produto.id && styles.selectorBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {produto.nome.substring(0, 15)}...
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statSmallCard}>
            <Text style={styles.statSmallLabel}>Preço Atual</Text>
            <Text style={styles.statSmallValue}>{formatarMoeda(precoAtual)}</Text>
          </View>

          <View style={styles.statSmallCard}>
            <Text style={styles.statSmallLabel}>Mínimo</Text>
            <Text style={[styles.statSmallValue, { color: '#4caf50' }]}>
              {formatarMoeda(minPreco)}
            </Text>
          </View>

          <View style={styles.statSmallCard}>
            <Text style={styles.statSmallLabel}>Máximo</Text>
            <Text style={[styles.statSmallValue, { color: '#ff6b6b' }]}>
              {formatarMoeda(maxPreco)}
            </Text>
          </View>

          <View style={styles.statSmallCard}>
            <Text style={styles.statSmallLabel}>Média</Text>
            <Text style={styles.statSmallValue}>{formatarMoeda(mediaPreco)}</Text>
          </View>
        </View>

        {/* Mudança de Preço */}
        <View style={styles.mudancaCard}>
          <View style={styles.mudancaLeft}>
            <MaterialCommunityIcons
              name={parseFloat(mudanca) > 0 ? 'trending-up' : 'trending-down'}
              size={32}
              color={parseFloat(mudanca) > 0 ? '#ff6b6b' : '#4caf50'}
            />
            <View style={styles.mudancaTexts}>
              <Text style={styles.mudancaLabel}>Variação de Preço</Text>
              <Text
                style={[
                  styles.mudancaValue,
                  { color: parseFloat(mudanca) > 0 ? '#ff6b6b' : '#4caf50' },
                ]}
              >
                {parseFloat(mudanca) > 0 ? '+' : ''}{mudanca} ({mudancaPercent}%)
              </Text>
            </View>
          </View>

          <View style={styles.mudancaRight}>
            <Text style={styles.periodo}>Últimos 2 meses</Text>
          </View>
        </View>

        {/* Toggle Tipo de Gráfico */}
        <View style={styles.chartTypeContainer}>
          <TouchableOpacity
            style={[styles.chartTypeBtn, chartType === 'line' && styles.chartTypeBtnActive]}
            onPress={() => setChartType('line')}
          >
            <MaterialCommunityIcons
              name="chart-line"
              size={20}
              color={chartType === 'line' ? '#ff6b6b' : '#999'}
            />
            <Text
              style={[
                styles.chartTypeText,
                chartType === 'line' && styles.chartTypeTextActive,
              ]}
            >
              Linha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chartTypeBtn, chartType === 'bar' && styles.chartTypeBtnActive]}
            onPress={() => setChartType('bar')}
          >
            <MaterialCommunityIcons
              name="chart-bar"
              size={20}
              color={chartType === 'bar' ? '#ff6b6b' : '#999'}
            />
            <Text
              style={[
                styles.chartTypeText,
                chartType === 'bar' && styles.chartTypeTextActive,
              ]}
            >
              Barras
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico */}
        <View style={styles.chartContainer}>
          {chartType === 'line' ? (
            <LineChart
              data={chartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: () => '#eee',
                strokeWidth: 2,
                useShadowColorFromDataset: false,
                labelColor: () => '#999',
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <BarChart
              data={chartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: () => '#eee',
                labelColor: () => '#999',
              }}
              style={styles.chart}
            />
          )}
        </View>

        {/* Informações */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#ff9800" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Dica</Text>
              <Text style={styles.infoDesc}>
                {parseFloat(mudanca) < 0
                  ? '✅ Preço em queda! Ótima oportunidade'
                  : '⚠️ Preço em alta. Compare com outras lojas'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Action */}
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Alertar se Preço Mudar</Text>
        </TouchableOpacity>

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
  selectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  selectorList: {
    gap: 8,
  },
  selectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectorBtnActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  selectorBtnText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  selectorBtnTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statSmallCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  statSmallLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  statSmallValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  mudancaCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mudancaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mudancaTexts: {
    gap: 2,
  },
  mudancaLabel: {
    fontSize: 11,
    color: '#999',
  },
  mudancaValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mudancaRight: {
    alignItems: 'flex-end',
  },
  periodo: {
    fontSize: 11,
    color: '#999',
  },
  chartTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chartTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 6,
  },
  chartTypeBtnActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  chartTypeText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  chartTypeTextActive: {
    color: '#fff',
  },
  chartContainer: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  infoContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fffbf0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
  },
  infoDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  actionBtn: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
