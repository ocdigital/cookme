import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRecipeGenerator } from '@/hooks/useRecipeGenerator';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

function ReceitaImageComponent({ imageUrl }: { imageUrl?: string }) {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <View style={styles.imgPlaceholder}>
        <MaterialCommunityIcons name="image-outline" size={36} color={C.ink[300]} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.receitaImagem}
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  );
}

function ReceitaCard({ receita, idx }: { receita: any; idx: number }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <View style={styles.receitaCard}>
      {/* Imagem */}
      <View style={styles.imagemContainer}>
        <ReceitaImageComponent imageUrl={receita.imagem_url} />
        <View style={styles.imgOverlayTop}>
          <View style={[styles.tag, { backgroundColor: 'rgba(20,15,10,.6)' }]}>
            <Text style={styles.tagText}>{receita.dificuldade}</Text>
          </View>
        </View>
      </View>

      {/* Conteúdo */}
      <View style={styles.receitaContent}>
        <Text style={styles.receitaTitulo}>{receita.titulo}</Text>
        <Text style={styles.receitaDescricao} numberOfLines={expandido ? undefined : 2}>
          {receita.descricao}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={C.ink[500]} />
            <Text style={styles.metaText}>{receita.tempo_preparo}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={C.ink[500]} />
            <Text style={styles.metaText}>{receita.rendimento}</Text>
          </View>
        </View>

        {/* Ingredientes */}
        <Text style={styles.sectionLabel}>Ingredientes</Text>
        <View style={styles.ingredientesWrap}>
          {receita.ingredientes.map((ing: string, i: number) => (
            <View key={i} style={styles.ingredienteRow}>
              <View style={styles.ingredienteDot} />
              <Text style={styles.ingredienteText}>{ing}</Text>
            </View>
          ))}
        </View>

        {/* Modo de preparo (expansível) */}
        <TouchableOpacity onPress={() => setExpandido(!expandido)} style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>
            {expandido ? 'Ocultar preparo' : 'Ver modo de preparo'}
          </Text>
          <MaterialCommunityIcons
            name={expandido ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={C.green[600]}
          />
        </TouchableOpacity>

        {expandido && (
          <View style={styles.modoPreparoBox}>
            {receita.modo_preparo
              .split(/\n|(?<=\.) /)
              .filter((s: string) => s.trim().length > 0)
              .map((passo: string, i: number) => (
                <View key={i} style={styles.passoRow}>
                  <View style={styles.passoNum}>
                    <Text style={styles.passoNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.passoText}>{passo.trim()}</Text>
                </View>
              ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity style={styles.btnUsar}>
          <MaterialCommunityIcons name="chef-hat" size={18} color={C.ink[0]} />
          <Text style={styles.btnUsarText}>Executar receita · dar baixa no estoque</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReceitasGeradasScreen() {
  const router = useRouter();
  const { ingredientes_json } = useLocalSearchParams<{ ingredientes_json: string }>();
  const { receitas, loading, erro, gerarReceitas, limpar } = useRecipeGenerator();

  useEffect(() => {
    if (ingredientes_json) {
      const ingredientes = JSON.parse(ingredientes_json);
      gerarReceitas(ingredientes).catch(console.error);
    }
    return () => limpar();
  }, [ingredientes_json]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[800]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>IA Culinária</Text>
          <Text style={styles.headerTitle}>Receitas sugeridas</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIcon}>
              <MaterialCommunityIcons name="auto-fix" size={24} color={C.ink[900]} />
            </View>
            <Text style={styles.loadingTitle}>IA analisando despensa</Text>
            <Text style={styles.loadingSubtext}>Criando receitas personalizadas…</Text>
            <ActivityIndicator size="small" color={C.amber[500]} style={{ marginTop: 16 }} />
          </View>
        </View>
      ) : erro ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={52} color={C.red[500]} />
          <Text style={styles.erroTitle}>Não foi possível gerar receitas</Text>
          <Text style={styles.erroDetails}>{erro}</Text>
          <TouchableOpacity style={styles.btnVoltar} onPress={() => router.back()}>
            <Text style={styles.btnVoltarText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : receitas.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="chef-hat" size={52} color={C.ink[300]} />
          <Text style={styles.emptyText}>Nenhuma receita encontrada</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {receitas.map((receita, idx) => (
            <ReceitaCard key={idx} receita={receita} idx={idx} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.ink[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: C.ink[0],
    borderBottomWidth: 1,
    borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    ...T.micro,
    color: C.green[600],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  headerTitle: {
    ...T.h2,
    color: C.ink[900],
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  receitaCard: {
    backgroundColor: C.ink[0],
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.ink[150],
    ...shadows.md,
  },
  imagemContainer: {
    position: 'relative',
  },
  receitaImagem: {
    width: '100%',
    height: 200,
    backgroundColor: C.ink[100],
  },
  imgPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: C.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: {
    ...T.micro,
    color: '#fff',
    letterSpacing: 0,
  },
  receitaContent: {
    padding: 16,
  },
  receitaTitulo: {
    ...T.h2,
    color: C.ink[900],
    marginBottom: 6,
  },
  receitaDescricao: {
    ...T.body,
    color: C.ink[500],
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    ...T.small,
    color: C.ink[600],
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.ink[300],
  },
  sectionLabel: {
    ...T.micro,
    color: C.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ingredientesWrap: {
    gap: 6,
    marginBottom: 14,
  },
  ingredienteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ingredienteDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.green[400],
    marginTop: 7,
  },
  ingredienteText: {
    ...T.body,
    color: C.ink[700],
    flex: 1,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    marginBottom: 4,
  },
  expandBtnText: {
    ...T.small,
    color: C.green[600],
    fontWeight: '600',
  },
  modoPreparoBox: {
    gap: 10,
    marginBottom: 14,
  },
  passoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  passoNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.green[500],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  passoNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink[0],
  },
  passoText: {
    ...T.body,
    color: C.ink[700],
    flex: 1,
    lineHeight: 22,
    paddingTop: 3,
  },
  btnUsar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.green[500],
    paddingVertical: 15,
    borderRadius: radius.md,
    marginTop: 4,
    ...shadows.sm,
  },
  btnUsarText: {
    ...T.body,
    color: C.ink[0],
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingCard: {
    backgroundColor: C.amber[50],
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.amber[100],
    width: '100%',
  },
  loadingIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.amber[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  loadingTitle: {
    ...T.h3,
    color: C.amber[700],
    marginBottom: 4,
  },
  loadingSubtext: {
    ...T.small,
    color: C.amber[600],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  erroTitle: {
    ...T.h3,
    color: C.ink[800],
  },
  erroDetails: {
    ...T.small,
    color: C.ink[500],
    textAlign: 'center',
  },
  btnVoltar: {
    backgroundColor: C.red[500],
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    marginTop: 8,
  },
  btnVoltarText: {
    ...T.body,
    color: C.ink[0],
    fontWeight: '700',
  },
  emptyText: {
    ...T.body,
    color: C.ink[400],
  },
});
