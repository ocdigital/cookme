import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import recipesService, { Receita } from '@/services/recipes.service';
import { useRecipeExecution } from '@/hooks/useRecipeExecution';

export default function RecipDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    status,
    loading: executionLoading,
    erro: executionErro,
    progresso,
    ingredientes_necessarios,
    ingredientes_consumidos,
    iniciarExecucao,
    consumirIngrediente,
    finalizarExecucao,
    reset,
  } = useRecipeExecution();

  const [receita, setReceita] = useState<Receita | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadReceita(id);
    }
  }, [id]);

  const loadReceita = async (receitaId: string) => {
    try {
      setErro(null);
      const data = await recipesService.obterReceita(receitaId);
      setReceita(data);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao carregar receita';
      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarExecucao = async () => {
    if (!id) return;

    try {
      await iniciarExecucao(id);
      setShowExecutionModal(true);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível iniciar a execução');
    }
  };

  const handleMarcarIngrediente = async (ingredienteId: string, quantidade: number) => {
    try {
      await consumirIngrediente(ingredienteId, quantidade);
      Alert.alert('✓', 'Ingrediente consumido com sucesso');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível consumir o ingrediente');
    }
  };

  const handleFinalizarExecucao = async () => {
    try {
      await finalizarExecucao();
      Alert.alert('✓ Receita Concluída!', 'Parabéns pela execução!', [
        {
          text: 'OK',
          onPress: () => {
            reset();
            setShowExecutionModal(false);
            router.back();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível finalizar');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return '#4CAF50';
      case 'media':
        return '#FFA500';
      case 'dificil':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'Fácil';
      case 'media':
        return 'Média';
      case 'dificil':
        return 'Difícil';
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    );
  }

  if (erro || !receita) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color="#FF6B6B"
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.errorText}>{erro || 'Receita não encontrada'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerMinimal}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {receita.nome}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Badges de dificuldade, tempo, porções */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="chef-hat"
              size={16}
              color={getDifficultyColor(receita.dificuldade)}
            />
            <Text style={[styles.badgeText, { color: getDifficultyColor(receita.dificuldade) }]}>
              {getDifficultyLabel(receita.dificuldade)}
            </Text>
          </View>

          {receita.tempo_preparo && (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
              <Text style={styles.badgeText}>{receita.tempo_preparo}min</Text>
            </View>
          )}

          {receita.rendimento_porcoes && (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="bowl" size={16} color="#666" />
              <Text style={styles.badgeText}>{receita.rendimento_porcoes} porções</Text>
            </View>
          )}
        </View>

        {/* Descrição */}
        {receita.descricao && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <Text style={styles.descricao}>{receita.descricao}</Text>
          </View>
        )}

        {/* Ingredientes */}
        {receita.ingredientes && receita.ingredientes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            {receita.ingredientes.map((ing) => (
              <View key={ing.id} style={styles.ingrediente}>
                <MaterialCommunityIcons name="leaf" size={16} color="#4CAF50" />
                <Text style={styles.ingredienteTexto}>
                  {ing.quantidade} {ing.unidade} de {ing.nome}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Modo de preparo */}
        {receita.modo_preparo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modo de Preparo</Text>
            <Text style={styles.modoPreparoBio}>{receita.modo_preparo}</Text>
          </View>
        )}

        {/* Nutrição */}
        {receita.informacoes_nutricionais && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Nutricionais</Text>
            <View style={styles.nutricaoGrid}>
              {receita.informacoes_nutricionais.calorias && (
                <View style={styles.nutricaoItem}>
                  <Text style={styles.nutricaoValue}>
                    {receita.informacoes_nutricionais.calorias}
                  </Text>
                  <Text style={styles.nutricaoLabel}>Calorias</Text>
                </View>
              )}
              {receita.informacoes_nutricionais.proteinas && (
                <View style={styles.nutricaoItem}>
                  <Text style={styles.nutricaoValue}>
                    {receita.informacoes_nutricionais.proteinas}g
                  </Text>
                  <Text style={styles.nutricaoLabel}>Proteína</Text>
                </View>
              )}
              {receita.informacoes_nutricionais.carboidratos && (
                <View style={styles.nutricaoItem}>
                  <Text style={styles.nutricaoValue}>
                    {receita.informacoes_nutricionais.carboidratos}g
                  </Text>
                  <Text style={styles.nutricaoLabel}>Carboidrato</Text>
                </View>
              )}
              {receita.informacoes_nutricionais.gorduras && (
                <View style={styles.nutricaoItem}>
                  <Text style={styles.nutricaoValue}>
                    {receita.informacoes_nutricionais.gorduras}g
                  </Text>
                  <Text style={styles.nutricaoLabel}>Gordura</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Avaliações */}
        <View style={styles.section}>
          <View style={styles.avaliacaoRow}>
            <View>
              <Text style={styles.sectionTitle}>Avaliação</Text>
              <Text style={styles.avaliacaoValor}>{receita.avaliacao_media.toFixed(1)}</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Execuções</Text>
              <Text style={styles.avaliacaoValor}>{receita.vezes_executada}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botão de execução */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.botaoExecutar}
          onPress={handleIniciarExecucao}
        >
          <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
          <Text style={styles.botaoTexto}>Executar Receita</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de execução */}
      <Modal
        visible={showExecutionModal}
        animationType="slide"
        onRequestClose={() => {
          if (status !== 'em_andamento') {
            setShowExecutionModal(false);
          }
        }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.headerMinimal}>
            <TouchableOpacity
              onPress={() => {
                if (status !== 'em_andamento') {
                  setShowExecutionModal(false);
                }
              }}
            >
              <MaterialCommunityIcons
                name={status === 'em_andamento' ? 'chevron-down' : 'close'}
                size={24}
                color="#333"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Executando Receita</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progresso}%`, backgroundColor: '#FF6B6B' },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progresso}%</Text>
          </View>

          {/* Erro na execução */}
          {executionErro && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color="#FF6B6B"
              />
              <Text style={styles.errorText}>{executionErro}</Text>
            </View>
          )}

          {/* Lista de ingredientes */}
          <FlatList
            data={ingredientes_necessarios}
            renderItem={({ item }) => {
              const consumido = ingredientes_consumidos.get(item.id) || 0;
              const isDone = consumido >= item.quantidade;

              return (
                <View
                  style={[
                    styles.ingredienteExecucao,
                    isDone && styles.ingredienteExecucaoDone,
                  ]}
                >
                  <View style={styles.ingredienteExecucaoInfo}>
                    <MaterialCommunityIcons
                      name={isDone ? 'check-circle' : 'circle-outline'}
                      size={24}
                      color={isDone ? '#4CAF50' : '#ddd'}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.ingredienteExecucaoNome,
                          isDone && styles.ingredienteExecucaoDoneText,
                        ]}
                      >
                        {item.nome}
                      </Text>
                      <Text style={styles.ingredienteExecucaoQtd}>
                        {consumido}/{item.quantidade} {item.unidade}
                      </Text>
                    </View>
                  </View>

                  {!isDone && (
                    <TouchableOpacity
                      style={styles.botaoConsumirMini}
                      onPress={() =>
                        handleMarcarIngrediente(item.id, item.quantidade)
                      }
                      disabled={executionLoading}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />

          {/* Botão de finalizar */}
          {progresso === 100 && (
            <View style={styles.footerExecucao}>
              <TouchableOpacity
                style={styles.botaoFinalizar}
                onPress={handleFinalizarExecucao}
                disabled={executionLoading}
              >
                <MaterialCommunityIcons
                  name="check-all"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.botaoTexto}>Finalizar Receita</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMinimal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  descricao: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ingrediente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
  },
  ingredienteTexto: {
    fontSize: 13,
    color: '#666',
  },
  modoPreparoBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  nutricaoGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  nutricaoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF3F3',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  nutricaoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  nutricaoLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  avaliacaoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  avaliacaoValor: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: 6,
  },
  footer: {
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
  footerExecucao: {
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
  botaoExecutar: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  botaoFinalizar: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
  errorBanner: {
    backgroundColor: '#FFE0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ingredienteExecucao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  ingredienteExecucaoDone: {
    backgroundColor: '#F5FFF5',
    borderColor: '#D0E8D0',
  },
  ingredienteExecucaoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ingredienteExecucaoNome: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  ingredienteExecucaoDoneText: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ingredienteExecucaoQtd: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  botaoConsumirMini: {
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
