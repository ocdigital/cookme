import React, { useState, useEffect } from 'react';
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
import shoppingListService from '../services/shoppingListService';

const screenWidth = Dimensions.get('window').width;

export default function ProductPriceComparatorScreen({ navigation, route }) {
  const { nomeProduto } = route.params;
  const [analise, setAnalise] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [precoUsuario, setPrecoUsuario] = useState('');

  useEffect(() => {
    const dados = shoppingListService.obterAnaliseProduto(nomeProduto);
    setAnalise(dados);
  }, [nomeProduto]);

  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return `R$ ${Number(valor).toFixed(2)}`.replace('.', ',');
  };

  const getRecomendacaoColor = () => {
    if (!analise) return '#666';
    if (analise.recomendacao.includes('⚠️')) return '#ff6b6b';
    if (analise.recomendacao.includes('✅')) return '#4caf50';
    return '#2196f3';
  };

  const getTendenciaColor = () => {
    if (!analise) return '#666';
    if (analise.tendencia === 'ALTA') return '#ff6b6b';
    if (analise.tendencia === 'QUEDA') return '#4caf50';
    return '#999';
  };

  const getTendenciaIcon = () => {
    if (!analise) return 'minus';
    if (analise.tendencia === 'ALTA') return 'trending-up';
    if (analise.tendencia === 'QUEDA') return 'trending-down';
    return 'minus';
  };

  if (!analise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = shoppingListService.gerarDadosGrafico(nomeProduto);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {analise.nome}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Recomendação */}
        <View style={styles.recomendacaoContainer}>
          <View
            style={[
              styles.recomendacaoCard,
              { borderLeftColor: getRecomendacaoColor() },
            ]}
          >
            <View style={styles.recomendacaoIcon}>
              <MaterialCommunityIcons
                name={analise.recomendacao.includes('⚠️') ? 'alert-circle' : 'lightbulb'}
                size={20}
                color={getRecomendacaoColor()}
              />
            </View>
            <Text style={[styles.recomendacaoText, { color: getRecomendacaoColor() }]}>
              {analise.recomendacao}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Última Compra</Text>
            <Text style={styles.statValue}>{formatarMoeda(analise.precos.atual)}</Text>
            <Text style={styles.statDate}>{analise.ultimaCompra}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Melhor Preço</Text>
            <Text style={[styles.statValue, { color: '#4caf50' }]}>
              {formatarMoeda(analise.precos.minimo)}
            </Text>
            <Text style={styles.statEconomia}>
              Economize: {formatarMoeda(analise.precos.atual - analise.precos.minimo)}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Preço Médio</Text>
            <Text style={styles.statValue}>{formatarMoeda(analise.precos.media)}</Text>
            <Text style={styles.statSubtext}>
              {analise.precos.atual > analise.precos.media ? '↑' : '↓'}{' '}
              {formatarMoeda(Math.abs(analise.precos.atual - analise.precos.media))}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pior Preço</Text>
            <Text style={[styles.statValue, { color: '#ff6b6b' }]}>
              {formatarMoeda(analise.precos.maximo)}
            </Text>
            <Text style={styles.statSubtext}>
              {formatarMoeda(analise.precos.maximo - analise.precos.minimo)} de diferença
            </Text>
          </View>
        </View>

        {/* Tendência */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análise de Tendência</Text>

          <View style={styles.tendenciaCard}>
            <View style={styles.tendenciaLeft}>
              <MaterialCommunityIcons
                name={getTendenciaIcon()}
                size={32}
                color={getTendenciaColor()}
              />
              <View style={styles.tendenciaTexts}>
                <Text style={styles.tendenciaLabel}>Tendência</Text>
                <Text
                  style={[styles.tendenciaValue, { color: getTendenciaColor() }]}
                >
                  {analise.tendencia}
                </Text>
              </View>
            </View>

            <View style={styles.tendenciaRight}>
              <Text style={styles.variacaoLabel}>Variação</Text>
              <Text
                style={[
                  styles.variacaoValue,
                  { color: analise.variacao.percentual > 0 ? '#ff6b6b' : '#4caf50' },
                ]}
              >
                {analise.variacao.percentual > 0 ? '+' : ''}
                {analise.variacao.percentual}%
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico */}
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Histórico de Preços</Text>
            <View style={styles.chartTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.chartTypeBtn,
                  chartType === 'line' && styles.chartTypeBtnActive,
                ]}
                onPress={() => setChartType('line')}
              >
                <MaterialCommunityIcons
                  name="chart-line"
                  size={16}
                  color={chartType === 'line' ? '#ff6b6b' : '#999'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chartTypeBtn,
                  chartType === 'bar' && styles.chartTypeBtnActive,
                ]}
                onPress={() => setChartType('bar')}
              >
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={16}
                  color={chartType === 'bar' ? '#ff6b6b' : '#999'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {chartData && (
            <View style={styles.chartContainer}>
              {chartType === 'line' ? (
                <LineChart
                  data={chartData}
                  width={screenWidth - 32}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    color: () => '#eee',
                    strokeWidth: 2,
                    labelColor: () => '#999',
                  }}
                  bezier
                  style={styles.chart}
                />
              ) : (
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
              )}
            </View>
          )}
        </View>

        {/* Comparar Preço Atual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preço Visto no Mercado</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>R$ </Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Digite o preço visto"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
              value={precoUsuario}
              onChangeText={setPrecoUsuario}
            />
          </View>

          {precoUsuario && !isNaN(parseFloat(precoUsuario)) && (
            <View style={styles.comparacaoResultado}>
              <Text style={styles.comparacaoLabel}>Comparação com histórico:</Text>
              <View style={styles.comparacaoItems}>
                <View style={styles.comparacaoItem}>
                  <Text style={styles.compLabel}>vs. Melhor preço:</Text>
                  <Text
                    style={[
                      styles.compValue,
                      {
                        color:
                          parseFloat(precoUsuario) <= analise.precos.minimo
                            ? '#4caf50'
                            : '#ff6b6b',
                      },
                    ]}
                  >
                    {parseFloat(precoUsuario) <= analise.precos.minimo ? '✅ ' : '⚠️ '}
                    {parseFloat(precoUsuario) <= analise.precos.minimo
                      ? 'Ótimo preço!'
                      : `+${(
                          parseFloat(precoUsuario) - analise.precos.minimo
                        ).toFixed(2)}`}
                  </Text>
                </View>

                <View style={styles.comparacaoItem}>
                  <Text style={styles.compLabel}>vs. Preço médio:</Text>
                  <Text
                    style={[
                      styles.compValue,
                      {
                        color:
                          parseFloat(precoUsuario) <= analise.precos.media
                            ? '#4caf50'
                            : '#ff6b6b',
                      },
                    ]}
                  >
                    {parseFloat(precoUsuario) <= analise.precos.media
                      ? '👍 Bom preço'
                      : `⚠️ ${((parseFloat(precoUsuario) / analise.precos.media - 1) * 100).toFixed(0)}% acima`}
                  </Text>
                </View>

                <View style={styles.comparacaoItem}>
                  <Text style={styles.compLabel}>vs. Pior preço:</Text>
                  <Text style={[styles.compValue, { color: '#4caf50' }]}>
                    {`Economiza ${(
                      analise.precos.maximo - parseFloat(precoUsuario)
                    ).toFixed(2)}`}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="bell-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Alertar se Baixar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
            <MaterialCommunityIcons name="share" size={20} color="#ff6b6b" />
            <Text style={[styles.actionBtnText, { color: '#ff6b6b' }]}>
              Compartilhar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const TextInput = React.memo(function TextInputComponent(props) {
  const RNTextInput = require('react-native').TextInput;
  return <RNTextInput {...props} />;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recomendacaoContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  recomendacaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    borderLeftWidth: 4,
  },
  recomendacaoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recomendacaoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
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
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statDate: {
    fontSize: 9,
    color: '#ccc',
    marginTop: 2,
  },
  statEconomia: {
    fontSize: 10,
    color: '#4caf50',
    fontWeight: '500',
    marginTop: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTypeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  chartTypeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTypeBtnActive: {
    backgroundColor: '#ff6b6b',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  tendenciaCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tendenciaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tendenciaTexts: {
    gap: 2,
  },
  tendenciaLabel: {
    fontSize: 11,
    color: '#999',
  },
  tendenciaValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tendenciaRight: {
    alignItems: 'flex-end',
  },
  variacaoLabel: {
    fontSize: 10,
    color: '#999',
  },
  variacaoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
  },
  comparacaoResultado: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  comparacaoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  comparacaoItems: {
    gap: 10,
  },
  comparacaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comparacaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  compLabel: {
    fontSize: 11,
    color: '#666',
  },
  compValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
