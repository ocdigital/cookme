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
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

/**
 * Dados fictícios para análise
 */
const GASTOS_MENSAIS = [
  { mes: 'Jan', gasto: 450 },
  { mes: 'Fev', gasto: 420 },
  { mes: 'Mar', gasto: 390 },
];

const TOP_PRODUTOS_CAROS = [
  { id: 1, nome: 'FRANGO PEITO 800G', preco: 18.59, categoria: 'Proteínas' },
  { id: 2, nome: 'CAFÉ MORGES 500G', preco: 25.98, categoria: 'Bebidas' },
  { id: 3, nome: 'AGUA MIN 12 UN', preco: 23.76, categoria: 'Bebidas' },
  { id: 4, nome: 'LEITE INTEGRAL 1L', preco: 5.80, categoria: 'Laticínios' },
];

const GASTOS_POR_CATEGORIA = [
  { categoria: 'Alimentos', gasto: 250, percentual: 45 },
  { categoria: 'Bebidas', gasto: 85, percentual: 22 },
  { categoria: 'Laticínios', gasto: 50, percentual: 13 },
  { categoria: 'Higiene', gasto: 55, percentual: 20 },
];

export default function AnalisePage({ navigation }) {
  const [filtroMes, setFiltroMes] = useState('Mar');

  const formatarMoeda = (valor) => {
    return `R$ ${valor.toFixed(2)}`.replace('.', ',');
  };

  // Dados do gráfico de gastos
  const chartData = {
    labels: GASTOS_MENSAIS.map((m) => m.mes),
    datasets: [
      {
        data: GASTOS_MENSAIS.map((m) => m.gasto),
        color: () => '#ff6b6b',
      },
    ],
  };

  // Calcular stats
  const totalGasto = GASTOS_MENSAIS.reduce((sum, m) => sum + m.gasto, 0);
  const mediaGasto = (totalGasto / GASTOS_MENSAIS.length).toFixed(2);
  const economiaTeoriaAnual = 540; // Simulado
  const tendencia = -7.1; // Percentual de mudança

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Análise de Gastos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewIcon}>
              <MaterialCommunityIcons name="wallet" size={24} color="#ff6b6b" />
            </View>
            <Text style={styles.overviewLabel}>Total 3 Meses</Text>
            <Text style={styles.overviewValue}>{formatarMoeda(totalGasto)}</Text>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewIcon}>
              <MaterialCommunityIcons name="average" size={24} color="#2196f3" />
            </View>
            <Text style={styles.overviewLabel}>Média Mensal</Text>
            <Text style={styles.overviewValue}>{formatarMoeda(mediaGasto)}</Text>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewIcon}>
              <MaterialCommunityIcons name="trending-down" size={24} color="#4caf50" />
            </View>
            <Text style={styles.overviewLabel}>Tendência</Text>
            <Text style={[styles.overviewValue, { color: '#4caf50' }]}>
              {tendencia}%
            </Text>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewIcon}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#ff9800" />
            </View>
            <Text style={styles.overviewLabel}>Economia Possível</Text>
            <Text style={styles.overviewValue}>{formatarMoeda(economiaTeoriaAnual)}</Text>
          </View>
        </View>

        {/* Gráfico de Gastos Mensais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos por Mês</Text>

          <View style={styles.chartContainer}>
            <BarChart
              data={chartData}
              width={screenWidth - 32}
              height={200}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: () => '#eee',
                labelColor: () => '#999',
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <MaterialCommunityIcons name="circle" size={8} color="#ff6b6b" />
              <Text style={styles.legendText}>Gasto em R$</Text>
            </View>
            <View style={styles.legendItem}>
              <MaterialCommunityIcons name="trending-down" size={12} color="#4caf50" />
              <Text style={styles.legendText}>Tendência em queda</Text>
            </View>
          </View>
        </View>

        {/* Gastos por Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos por Categoria</Text>

          {GASTOS_POR_CATEGORIA.map((item, index) => (
            <View key={index} style={styles.categoriaItem}>
              <View style={styles.categoriaLeft}>
                <Text style={styles.categoriaNome}>{item.categoria}</Text>
                <View style={styles.barraContainer}>
                  <View
                    style={[
                      styles.barra,
                      {
                        width: `${item.percentual * 2}%`,
                        backgroundColor: ['#ff6b6b', '#2196f3', '#4caf50', '#ff9800'][index],
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.categoriaRight}>
                <Text style={styles.categoriaGasto}>{formatarMoeda(item.gasto)}</Text>
                <Text style={styles.categoriaPercent}>{item.percentual}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Produtos Mais Caros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos Mais Caros</Text>

          {TOP_PRODUTOS_CAROS.map((item, index) => (
            <View key={item.id} style={styles.produtoCard}>
              <View style={styles.produtoRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>

              <View style={styles.produtoInfo}>
                <Text style={styles.produtoNome}>{item.nome}</Text>
                <Text style={styles.produtoCategoria}>{item.categoria}</Text>
              </View>

              <View style={styles.produtoPreco}>
                <Text style={styles.precoCaro}>{formatarMoeda(item.preco)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>

          <View style={styles.insightCard}>
            <MaterialCommunityIcons name="lightbulb" size={20} color="#ff9800" />
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>Bom trabalho!</Text>
              <Text style={styles.insightDesc}>
                Seus gastos diminuíram 7,1% comparado ao mês anterior
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#ff6b6b" />
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>Atenção!</Text>
              <Text style={styles.insightDesc}>
                Café é sua categoria mais cara. Considere procurar alternativas
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <MaterialCommunityIcons name="trending-down" size={20} color="#4caf50" />
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>Economia Potencial</Text>
              <Text style={styles.insightDesc}>
                Se manter a tendência, economizará ~R$ 540/ano
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.ctaBtn}>
            <MaterialCommunityIcons name="download" size={20} color="#fff" />
            <Text style={styles.ctaBtnText}>Exportar Relatório</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ctaBtn, styles.ctaBtnSecondary]}>
            <MaterialCommunityIcons name="bell-outline" size={20} color="#ff6b6b" />
            <Text style={[styles.ctaBtnText, { color: '#ff6b6b' }]}>
              Receber Alertas
            </Text>
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#999',
  },
  categoriaItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriaLeft: {
    flex: 1,
  },
  categoriaNome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  barraContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: 3,
  },
  categoriaRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoriaGasto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  categoriaPercent: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  produtoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  produtoRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  produtoCategoria: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  produtoPreco: {
    alignItems: 'flex-end',
  },
  precoCaro: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  insightDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  ctaContainer: {
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  ctaBtnSecondary: {
    backgroundColor: '#f5f5f5',
  },
  ctaBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
