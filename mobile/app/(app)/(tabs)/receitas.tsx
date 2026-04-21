import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, ScrollView, Image, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { useRecipeGenerator } from '@/hooks/useRecipeGenerator';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

export default function ReceitasScreen() {
  const router = useRouter();
  const [ingredientes, setIngredientes] = useState<string[]>([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(true);
  const { receitas, loading: gerando, erro, gerarReceitas } = useRecipeGenerator();

  useFocusEffect(
    React.useCallback(() => {
      carregarIngredientes();
    }, [])
  );

  const carregarIngredientes = async () => {
    try {
      setLoadingIngredientes(true);
      const response = await api.get('/inventario');
      const produtos = response.data?.produtos || response.data?.data || [];
      const nomes = produtos
        .filter((p: any) => p.ingrediente_receita !== false)
        .map((p: any) => p.nome);
      setIngredientes(nomes);
    } catch {}
    finally { setLoadingIngredientes(false); }
  };

  const handleGerar = () => {
    if (ingredientes.length === 0) {
      Alert.alert('Despensa vazia', 'Adicione ingredientes escaneando uma nota fiscal primeiro.');
      return;
    }
    gerarReceitas(ingredientes);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>IA Culinária</Text>
          <Text style={styles.headerTitle}>Receitas</Text>
        </View>
        {ingredientes.length > 0 && (
          <TouchableOpacity style={styles.btnGerar} onPress={handleGerar} disabled={gerando}>
            {gerando
              ? <ActivityIndicator size="small" color={C.ink[0]} />
              : <>
                  <MaterialCommunityIcons name="auto-fix" size={16} color={C.ink[0]} />
                  <Text style={styles.btnGerarText}>Gerar</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ingredientes disponíveis */}
        <View style={styles.ingredientesCard}>
          <View style={styles.ingredientesHeader}>
            <MaterialCommunityIcons name="fridge-outline" size={18} color={C.green[600]} />
            <Text style={styles.ingredientesTitle}>
              {loadingIngredientes ? 'Carregando...' : `${ingredientes.length} ingredientes na despensa`}
            </Text>
          </View>
          {ingredientes.length > 0 && (
            <View style={styles.chipRow}>
              {ingredientes.slice(0, 8).map((nome, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{nome}</Text>
                </View>
              ))}
              {ingredientes.length > 8 && (
                <View style={[styles.chip, styles.chipMais]}>
                  <Text style={[styles.chipText, { color: C.ink[500] }]}>+{ingredientes.length - 8}</Text>
                </View>
              )}
            </View>
          )}
          {!loadingIngredientes && ingredientes.length === 0 && (
            <View style={styles.semIngredientes}>
              <Text style={styles.semIngredientesText}>Nenhum ingrediente na despensa</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/receita-ocr')}>
                <Text style={styles.linkEscanear}>Escanear nota fiscal →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Estado de geração */}
        {gerando && (
          <View style={styles.gerandoCard}>
            <ActivityIndicator color={C.amber[600]} />
            <View>
              <Text style={styles.gerandoTitle}>Criando receitas com IA...</Text>
              <Text style={styles.gerandoSub}>Analisando seus ingredientes</Text>
            </View>
          </View>
        )}

        {erro && (
          <View style={styles.erroCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={C.red[500]} />
            <Text style={styles.erroText}>{erro}</Text>
          </View>
        )}

        {/* Lista de receitas */}
        {receitas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{receitas.length} receitas sugeridas</Text>
            {receitas.map((receita, i) => (
              <ReceitaCard key={i} receita={receita} />
            ))}
          </>
        )}

        {/* Empty state */}
        {!gerando && receitas.length === 0 && !erro && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="chef-hat" size={48} color={C.green[500]} />
            </View>
            <Text style={styles.emptyTitle}>Gere suas receitas</Text>
            <Text style={styles.emptySub}>A IA vai sugerir receitas com base nos ingredientes da sua despensa</Text>
            {ingredientes.length > 0 && (
              <TouchableOpacity style={styles.emptyBtn} onPress={handleGerar}>
                <MaterialCommunityIcons name="auto-fix" size={18} color={C.ink[0]} />
                <Text style={styles.emptyBtnText}>Gerar agora</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReceitaCard({ receita }: { receita: any }) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.receitaCard}>
      {receita.image_url && !imageError ? (
        <Image source={{ uri: receita.image_url }} style={styles.receitaImg} onError={() => setImageError(true)} />
      ) : (
        <View style={styles.receitaImgPlaceholder}>
          <MaterialCommunityIcons name="image-outline" size={32} color={C.ink[300]} />
        </View>
      )}
      <View style={styles.receitaBody}>
        <Text style={styles.receitaNome}>{receita.nome || receita.name}</Text>
        {receita.descricao && <Text style={styles.receitaDesc} numberOfLines={expanded ? undefined : 2}>{receita.descricao}</Text>}
        <View style={styles.receitaMeta}>
          {receita.tempo_preparo && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={C.ink[400]} />
              <Text style={styles.metaText}>{receita.tempo_preparo}</Text>
            </View>
          )}
          {receita.porcoes && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-group-outline" size={13} color={C.ink[400]} />
              <Text style={styles.metaText}>{receita.porcoes} porções</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.expandBtnText}>{expanded ? 'Ver menos' : 'Ver preparo'}</Text>
          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.green[600]} />
        </TouchableOpacity>
        {expanded && receita.modo_preparo && (
          <View style={styles.preparo}>
            {receita.modo_preparo.split('\n').filter(Boolean).map((passo: string, i: number) => (
              <View key={i} style={styles.passo}>
                <View style={styles.passoNum}><Text style={styles.passoNumText}>{i + 1}</Text></View>
                <Text style={styles.passoText}>{passo.replace(/^\d+\.\s*/, '')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },
  btnGerar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.green[500], paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: radius.md, ...shadows.sm,
  },
  btnGerarText: { ...T.small, color: C.ink[0], fontWeight: '700' },

  content: { padding: 20, paddingBottom: 32, gap: 16 },

  ingredientesCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], padding: 16, ...shadows.sm, gap: 12,
  },
  ingredientesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ingredientesTitle: { ...T.h3, color: C.ink[800] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: C.green[50], borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.green[100] },
  chipMais: { backgroundColor: C.ink[100], borderColor: C.ink[200] },
  chipText: { ...T.small, color: C.green[700], fontWeight: '600' },
  semIngredientes: { alignItems: 'center', gap: 6 },
  semIngredientesText: { ...T.body, color: C.ink[400] },
  linkEscanear: { ...T.body, color: C.green[600], fontWeight: '700' },

  gerandoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.amber[50], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.amber[200], padding: 16,
  },
  gerandoTitle: { ...T.h3, color: C.amber[800] },
  gerandoSub: { ...T.small, color: C.amber[700], marginTop: 2 },

  erroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF2F0', borderRadius: radius.md,
    borderWidth: 1, borderColor: C.red[500], padding: 14,
  },
  erroText: { ...T.body, color: C.red[500], flex: 1 },

  sectionTitle: { ...T.micro, color: C.ink[400], textTransform: 'uppercase', letterSpacing: 0.5 },

  receitaCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], overflow: 'hidden', ...shadows.sm,
  },
  receitaImg: { width: '100%', height: 160 },
  receitaImgPlaceholder: { width: '100%', height: 120, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  receitaBody: { padding: 16, gap: 8 },
  receitaNome: { ...T.h3, color: C.ink[900] },
  receitaDesc: { ...T.body, color: C.ink[500] },
  receitaMeta: { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...T.small, color: C.ink[400] },
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderTopWidth: 1, borderTopColor: C.ink[150], paddingTop: 10, marginTop: 4,
  },
  expandBtnText: { ...T.small, color: C.green[600], fontWeight: '700', flex: 1 },
  preparo: { gap: 10, marginTop: 4 },
  passo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  passoNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  passoNumText: { fontSize: 12, fontWeight: '700', color: C.ink[0] },
  passoText: { ...T.body, color: C.ink[700], flex: 1 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { ...T.h2, color: C.ink[900] },
  emptySub: { ...T.body, color: C.ink[500], textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[500], paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: radius.md, marginTop: 4, ...shadows.md,
  },
  emptyBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
