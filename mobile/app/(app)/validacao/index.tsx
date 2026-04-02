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
        const parsed = JSON.parse(produtos_json);
        const mapeados = parsed.map((p: any) => ({
          nome: p.nome,
          categoria: p.categoria,
          confianca: p.confianca_classificacao,
          motivo: p.motivo,
          eh_alimento: p.ingrediente_receita,
          validado: false,
        }));
        setItems(mapeados);
      } catch (e) {
        Alert.alert('Erro', 'Falha ao carregar produtos');
      }
    }
  }, [produtos_json]);

  const handleValidar = async (indice: number, eh_alimento: boolean) => {
    try {
      const produto = items[indice];

      // Atualizar estado local
      const novoItems = [...items];
      novoItems[indice] = {
        ...novoItems[indice],
        eh_alimento,
        validado: true,
      };
      setItems(novoItems);

      // TODO: Chamar API quando backend implementar endpoint de validação
      // await validarProduto(produto.nome, eh_alimento, produto.motivo);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao validar produto');
    }
  };

  const handleFinalizarValidacao = async () => {
    const alimentos = items.filter((p) => p.eh_alimento).length;
    const nao_alimentos = items.filter((p) => !p.eh_alimento).length;

    Alert.alert(
      '✓ Validação Concluída',
      `${alimentos} alimentos\n${nao_alimentos} não-alimentos`,
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
              for (const item of items) {
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
    const corConfianca =
      item.confianca >= 85
        ? '#4CAF50'
        : item.confianca >= 70
          ? '#FFA500'
          : '#FF6B6B';

    return (
      <View style={styles.produtoCard}>
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome}>{item.nome}</Text>
          <Text style={styles.produtoCategoria}>{item.categoria}</Text>
          <Text style={styles.produtoMotivo}>{item.motivo}</Text>

          <View style={styles.confiancaContainer}>
            <Text style={{ color: corConfianca, fontWeight: '600' }}>
              Confiança: {item.confianca}%
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
            disabled={item.validado && item.eh_alimento}
          >
            <MaterialCommunityIcons
              name={
                item.validado && !item.eh_alimento
                  ? 'check-circle'
                  : 'close-circle-outline'
              }
              size={20}
              color={
                item.validado && !item.eh_alimento ? '#fff' : '#999'
              }
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

          <TouchableOpacity
            style={[
              styles.botao,
              styles.botaoSim,
              item.validado && item.eh_alimento && styles.botaoSelecionado,
            ]}
            onPress={() => handleValidar(index, true)}
            disabled={item.validado && !item.eh_alimento}
          >
            <MaterialCommunityIcons
              name={
                item.validado && item.eh_alimento
                  ? 'check-circle'
                  : 'check-circle-outline'
              }
              size={20}
              color={
                item.validado && item.eh_alimento ? '#fff' : '#4CAF50'
              }
            />
            <Text
              style={[
                styles.botaoTexto,
                item.validado && item.eh_alimento && {
                  color: '#fff',
                  fontWeight: '700',
                },
              ]}
            >
              Sim
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
          Confira se cada produto pode ser usado em receitas
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
      {validados === total && total > 0 && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.botaoFinalizar}
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
