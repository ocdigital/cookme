import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ProgressBarAndroid,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useValidacao } from '@/hooks/useValidacao';
import api from '@/services/api';

interface ProdutoItem {
  nome: string;
  categoria: string;
  confianca: number;
  motivo: string;
  eh_alimento: boolean;
  validado: boolean;
  requer_validacao: boolean;
  ingrediente_receita?: boolean | null;
}

export default function ValidacaoScreen() {
  const router = useRouter();
  const { produtos_json } = useLocalSearchParams<{ produtos_json: string }>();

  const {
    produtos_para_validar,
    produtos_validados,
    loading,
    erro,
    validarProduto,
    percentualValidacao,
  } = useValidacao();

  const [items, setItems] = useState<ProdutoItem[]>([]);

  useEffect(() => {
    if (produtos_json) {
      try {
        console.log('produtos_json recebido:', produtos_json);
        const parsed = JSON.parse(produtos_json);
        console.log('parsed:', parsed);
        const mapeados = parsed.map((p: any) => ({
          nome: p.nome,
          categoria: p.categoria,
          confianca: p.confianca_classificacao || 0,
          motivo: p.motivo || '',
          eh_alimento: p.ingrediente_receita !== false,
          validado: !p.requer_validacao, // Auto-classificados já contam como confirmados
          requer_validacao: p.requer_validacao ?? (p.confianca_classificacao < 75),
          ingrediente_receita: p.ingrediente_receita,
        }));
        console.log('mapeados:', mapeados);
        setItems(mapeados);
      } catch (e) {
        console.error('Erro ao parsear produtos:', e);
        Alert.alert('Erro', 'Falha ao carregar produtos: ' + (e as any).message);
      }
    }
  }, [produtos_json]);

  const handleValidar = async (indice: number, eh_alimento: boolean) => {
    try {
      const produto = items[indice];

      // Atualizar estado local (otimista)
      const novoItems = [...items];
      novoItems[indice] = {
        ...novoItems[indice],
        eh_alimento,
        validado: true,
      };
      setItems(novoItems);

      // Enviar feedback para o backend (fire-and-forget)
      api
        .post('/product-classification/validate', {
          produto: produto.nome,
          categoria: eh_alimento ? 'alimento' : 'nao_alimento',
        })
        .catch((err) => {
          // Silenciosamente falha - a validação local já foi feita
          console.warn('Feedback de validação não foi enviado:', err);
        });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao validar produto');
    }
  };

  const handleFinalizarValidacao = async () => {
    // Contar itens marcados como "Não" vs assumidos como "Sim"
    const marcadosNao = items.filter((p) => p.validado && !p.eh_alimento).length;
    const assumisSim = items.filter((p) => !p.validado).length; // Não marcados = SIM por padrão

    // Atualizar estado antes de validar
    const itemsAtualizados = items.map(item => ({
      ...item,
      eh_alimento: item.validado ? item.eh_alimento : true, // Se não validado, assume SIM
    }));

    const alimentos = itemsAtualizados.filter((p) => p.eh_alimento).length;
    const nao_alimentos = itemsAtualizados.filter((p) => !p.eh_alimento).length;

    Alert.alert(
      '✓ Validação Concluída',
      `${alimentos} ingredientes\n${nao_alimentos} não-ingredientes`,
      [
        {
          text: 'Editar',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            // Salvar produtos validados no inventário
            try {
              for (const item of itemsAtualizados) {
                // Criar/atualizar produto
                const produtoRes = await api.post('/produtos', {
                  nome: item.nome,
                  ingrediente_receita: item.eh_alimento,
                  confianca_classificacao: Math.round(item.confianca),
                  unidade_padrao: 'un',
                });

                const produtoId = produtoRes.data.id;

                // Adicionar ao inventário
                await api.post('/inventario', {
                  produto_id: produtoId,
                  quantidade_disponivel: 1,
                  unidade: 'un',
                  metodo_atualizacao: 'ocr_nota',
                });
              }

              Alert.alert('✅ Sucesso', 'Produtos salvos no inventário!', [
                {
                  text: 'Ver Inventário',
                  onPress: () => router.push('/(app)/(tabs)'),
                },
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao salvar produtos');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const renderProdutoItem = ({ item, index }: any) => {
    // Se não requer validação (auto-classificado), mostrar versão simplificada
    if (!item.requer_validacao) {
      const icon = item.eh_alimento ? 'food-apple' : 'broom';
      const badge = item.eh_alimento ? '🍎 Alimento' : '🧹 Não-alimento';

      return (
        <View style={[styles.produtoCard, { backgroundColor: '#F5F5F5', borderLeftColor: '#4CAF50', borderLeftWidth: 5 }]}>
          <View style={styles.produtoInfo}>
            <Text style={styles.produtoNome}>{item.nome}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Text style={{ color: '#4CAF50', fontWeight: '600', marginRight: 8 }}>
                {badge}
              </Text>
              <Text style={{ color: '#999', fontSize: 12 }}>
                {item.confianca}% confiança
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        </View>
      );
    }

    // Caso contrário, mostrar card com botão "Não"
    let corFundo = '#fff';
    let corBorda = '#ddd';
    let pergunta = '';

    // Se é não-alimento, sempre vermelho
    if (item.categoria === 'Não-alimento') {
      corFundo = '#FFEBEE';
      corBorda = '#FF6B6B';
      pergunta = 'Marque "Não" se realmente não é ingrediente';
    }
    // Se é alimento mas não ingrediente, amarelo
    else if (item.ingrediente_receita === false) {
      corFundo = '#FFF9E6';
      corBorda = '#FFA500';
      pergunta = 'Não é um ingrediente de receita comum';
    }
    // Se é alimento ingrediente
    else if (item.ingrediente_receita === true) {
      if (item.confianca >= 85) {
        corFundo = '#E8F5E9';
        corBorda = '#4CAF50';
        pergunta = 'Tem certeza que é ingrediente?';
      } else if (item.confianca >= 70) {
        corFundo = '#FFF9E6';
        corBorda = '#FFA500';
        pergunta = 'Tem dúvida que é ingrediente?';
      } else {
        corFundo = '#FFEBEE';
        corBorda = '#FF6B6B';
        pergunta = 'Não é ingrediente?';
      }
    }
    // Indefinido
    else {
      if (item.confianca >= 85) {
        corFundo = '#E8F5E9';
        corBorda = '#4CAF50';
        pergunta = 'Tem certeza que é ingrediente?';
      } else if (item.confianca >= 70) {
        corFundo = '#FFF9E6';
        corBorda = '#FFA500';
        pergunta = 'Tem dúvida que é ingrediente?';
      } else {
        corFundo = '#FFEBEE';
        corBorda = '#FF6B6B';
        pergunta = 'Não é ingrediente?';
      }
    }

    return (
      <View style={[styles.produtoCard, { backgroundColor: corFundo, borderLeftColor: corBorda, borderLeftWidth: 5 }]}>
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome}>{item.nome}</Text>
          <Text style={styles.produtoCategoria}>{item.categoria}</Text>
          <Text style={styles.produtoMotivo}>{item.motivo}</Text>

          <View style={styles.confiancaContainer}>
            <Text style={{ color: corBorda, fontWeight: '600', marginBottom: 4 }}>
              Confiança: {item.confianca}%
            </Text>
            <Text style={{ color: '#666', fontStyle: 'italic', fontSize: 12 }}>
              {pergunta}
            </Text>
          </View>
        </View>

        <View style={styles.botoes}>
          <TouchableOpacity
            style={[
              styles.botao,
              styles.botaoNao,
              item.validado && !item.eh_alimento && styles.botaoSelecionado,
            ]}
            onPress={() => handleValidar(index, false)}
          >
            <MaterialCommunityIcons
              name={item.validado && !item.eh_alimento ? 'check-circle' : 'close-circle-outline'}
              size={20}
              color={item.validado && !item.eh_alimento ? '#fff' : '#999'}
            />
            <Text
              style={[
                styles.botaoTexto,
                item.validado && !item.eh_alimento && {
                  color: '#fff',
                  fontWeight: '700',
                },
              ]}
            >
              Não
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const validados = items.filter((p) => p.validado).length;
  const total = items.length;
  const percentual = total > 0 ? (validados / total) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Validar Produtos</Text>
          <Text style={styles.headerSubtitle}>
            {validados}/{total} validados
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentual}%`, backgroundColor: '#FF6B6B' },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(percentual)}%</Text>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <MaterialCommunityIcons
          name="information-outline"
          size={20}
          color="#FF6B6B"
        />
        <Text style={styles.infoText}>
          {(() => {
            const autoClassificados = items.filter((i) => !i.requer_validacao).length;
            const requerValidacao = items.filter((i) => i.requer_validacao).length;
            const marcados = items.filter((i) => i.validado).length;
            const total = items.length;

            if (autoClassificados > 0 && requerValidacao > 0) {
              return `${autoClassificados} classificado(s) automaticamente. Confirme os ${requerValidacao} abaixo se necessário.`;
            } else if (autoClassificados > 0) {
              return `✅ Todos os ${total} itens foram classificados automaticamente!`;
            }

            if (marcados === 0) {
              return `${requerValidacao} item(ns) para confirmar. Marque "Não" nos que não são alimentos.`;
            }
            return `${marcados} marcado(s) como "Não". ${total - marcados} serão salvos como "Sim"`;
          })()}
        </Text>
      </View>

      {/* Lista de Produtos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="inbox-multiple-outline"
            size={64}
            color="#ddd"
          />
          <Text style={styles.emptyText}>Nenhum produto para validar</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderProdutoItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}

      {/* Botão Finalizar */}
      {total > 0 && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.botaoFinalizar, validados < total && { opacity: 0.6 }]}
            onPress={handleFinalizarValidacao}
          >
            <MaterialCommunityIcons
              name="check-all"
              size={24}
              color="#fff"
            />
            <Text style={styles.botaoFinalizarTexto}>
              Finalizar Validação
            </Text>
          </TouchableOpacity>
          {validados < total && (
            <Text style={{ textAlign: 'center', color: '#999', fontSize: 11, marginTop: 8 }}>
              {total - validados} itens sem validação (serão considerados SIM)
            </Text>
          )}
        </View>
      )}

      {erro && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={18}
            color="#FF6B6B"
          />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3F3',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 100,
  },
  produtoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  produtoInfo: {
    marginBottom: 12,
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  produtoCategoria: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  produtoMotivo: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  confiancaContainer: {
    alignItems: 'flex-start',
  },
  botoes: {
    flexDirection: 'row',
    gap: 8,
  },
  botao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
  },
  botaoNao: {
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  botaoSim: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  botaoSelecionado: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  botaoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  botaoFinalizar: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  botaoFinalizarTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: '#FFE0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    flex: 1,
  },
});
