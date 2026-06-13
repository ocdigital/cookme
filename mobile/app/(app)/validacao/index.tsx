import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

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

function AIConfidenceBadge({ confidence }: { confidence: number }) {
  const high = confidence >= 75;
  return (
    <View style={[styles.badge, { backgroundColor: high ? C.green[50] : C.amber[50] }]}>
      <MaterialCommunityIcons
        name={high ? 'check' : 'alert'}
        size={11}
        color={high ? C.green[700] : C.amber[700]}
      />
      <Text style={[styles.badgeText, { color: high ? C.green[700] : C.amber[700] }]}>
        {Math.round(confidence)}%
      </Text>
    </View>
  );
}

function OCRItem({ item, onToggle }: { item: ProdutoItem; onToggle: () => void }) {
  const high = item.confianca >= 75;
  const borderColor = item.validado
    ? C.green[200]
    : high ? C.ink[150] : C.amber[200];

  return (
    <View style={[styles.itemCard, { borderColor, opacity: item.validado && high ? 0.7 : 1 }]}>
      <View style={[styles.itemIcon, { backgroundColor: item.eh_alimento ? C.green[50] : C.ink[100] }]}>
        <MaterialCommunityIcons
          name={item.eh_alimento ? 'food-apple-outline' : 'package-variant'}
          size={20}
          color={item.eh_alimento ? C.green[600] : C.ink[400]}
        />
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <View style={styles.itemMeta}>
          <View style={[styles.itemTag, { backgroundColor: item.eh_alimento ? C.green[50] : C.ink[100] }]}>
            <Text style={[styles.itemTagText, { color: item.eh_alimento ? C.green[700] : C.ink[600] }]}>
              {item.eh_alimento ? 'Alimento' : 'Não-alimento'}
            </Text>
          </View>
          <Text style={styles.itemCat}>{item.categoria}</Text>
        </View>
      </View>

      <View style={styles.itemActions}>
        <AIConfidenceBadge confidence={item.confianca} />
        {high ? (
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons name="check" size={16} color={C.ink[0]} />
          </View>
        ) : (
          <TouchableOpacity onPress={onToggle} style={[
            styles.btnCorrigir,
            item.validado && !item.eh_alimento && { backgroundColor: C.red[50], borderColor: C.red[500] },
          ]}>
            <Text style={[
              styles.btnCorrigirText,
              item.validado && !item.eh_alimento && { color: C.red[500] },
            ]}>
              Não é alimento
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ValidacaoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { produtos_json } = useLocalSearchParams<{ produtos_json: string }>();
  const [items, setItems] = useState<ProdutoItem[]>([]);

  useEffect(() => {
    if (produtos_json) {
      try {
        const parsed = JSON.parse(produtos_json);
        const mapeados = parsed.map((p: any) => ({
          nome: p.nome,
          categoria: p.categoria,
          confianca: p.confianca_classificacao || 0,
          motivo: p.motivo || '',
          eh_alimento: p.ingrediente_receita !== false,
          validado: false,
          requer_validacao: true,
          ingrediente_receita: p.ingrediente_receita,
        }));
        setItems(mapeados);
      } catch (e) {
        Alert.alert('Erro', 'Falha ao carregar produtos');
      }
    }
  }, [produtos_json]);

  const handleToggle = (indice: number) => {
    const produto = items[indice];
    const novoEhAlimento = !produto.eh_alimento;
    const novoItems = [...items];
    novoItems[indice] = { ...novoItems[indice], eh_alimento: novoEhAlimento, validado: true };
    setItems(novoItems);

    api.post('/product-classification/validate', {
      produto: produto.nome,
      categoria: novoEhAlimento ? 'alimento' : 'nao_alimento',
    }).catch(() => {});
  };

  const handleConfirmar = async () => {
    const itemsFinais = items.map(item => ({
      ...item,
      // High-confidence: keep AI classification. Low-confidence not validated: default to food.
      eh_alimento: item.validado
        ? item.eh_alimento
        : item.confianca >= 75 ? item.eh_alimento : true,
    }));

    const alimentos = itemsFinais.filter(p => p.eh_alimento).length;
    const naoAlimentos = itemsFinais.filter(p => !p.eh_alimento).length;

    Alert.alert(
      'Confirmar validação',
      `${alimentos} ingredientes\n${naoAlimentos} não-ingredientes`,
      [
        { text: 'Editar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              for (const item of itemsFinais) {
                if (!item.eh_alimento) continue;
                await api.post('/inventario/adicionar-manual', {
                  nome: item.nome,
                  quantidade: 1,
                  unidade: 'un',
                });
              }
              Alert.alert('Sucesso', 'Produtos salvos no inventário!', [
                { text: 'Ver Inventário', onPress: () => router.push('/(app)/(tabs)/despensa') },
              ]);
            } catch {
              Alert.alert('Erro', 'Falha ao salvar produtos');
            }
          },
        },
      ]
    );
  };

  const total = items.length;
  const autoClassificados = items.filter(i => i.confianca >= 75).length;
  const precisamRevisao = items.filter(i => i.confianca < 75);
  const jaClassificados = items.filter(i => i.confianca >= 75);
  const pct = total > 0 ? Math.round((autoClassificados / total) * 100) : 0;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[800]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Escaneado agora</Text>
          <Text style={styles.headerTitle}>Revisar produtos</Text>
        </View>
      </View>

      {/* Card de progresso */}
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressLabel}>IA classificou automaticamente</Text>
            <Text style={styles.progressCount}>
              <Text style={{ color: C.green[600] }}>{autoClassificados}</Text>
              <Text style={{ color: C.ink[400] }}> / {total}</Text>
            </Text>
          </View>
          <View style={styles.iaBadge}>
            <MaterialCommunityIcons name="auto-fix" size={11} color={C.green[700]} />
            <Text style={styles.iaBadgeText}>IA · {pct}%</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        {precisamRevisao.length > 0 && (
          <Text style={styles.progressInfo}>
            Confirme os{' '}
            <Text style={{ color: C.amber[700], fontWeight: '700' }}>{precisamRevisao.length} itens</Text>
            {' '}com confiança abaixo de 75%.
          </Text>
        )}
      </View>

      <FlatList
        data={[...precisamRevisao, ...jaClassificados]}
        keyExtractor={(item, i) => `${item.nome}-${i}`}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={() => precisamRevisao.length > 0 ? (
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="alert" size={12} color={C.amber[700]} />
            <Text style={[styles.sectionLabel, { color: C.amber[700] }]}>Precisam de revisão</Text>
          </View>
        ) : null}
        renderItem={({ item, index }) => {
          const isFirstClassificado = index === precisamRevisao.length;
          return (
            <>
              {isFirstClassificado && (
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <MaterialCommunityIcons name="check" size={12} color={C.green[600]} />
                  <Text style={[styles.sectionLabel, { color: C.green[600] }]}>Classificados pela IA</Text>
                </View>
              )}
              <OCRItem
                item={item}
                onToggle={() => {
                  const idxReal = items.findIndex(i => i.nome === item.nome);
                  if (idxReal >= 0) handleToggle(idxReal);
                }}
              />
            </>
          );
        }}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnCancelar} onPress={() => router.back()}>
          <Text style={styles.btnCancelarText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnConfirmar} onPress={handleConfirmar}>
          <MaterialCommunityIcons name="check" size={20} color={C.ink[0]} />
          <Text style={styles.btnConfirmarText}>Confirmar tudo</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
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
  headerTitle: { ...T.h2, color: C.ink[900] },
  progressCard: {
    margin: 20,
    marginBottom: 0,
    padding: 16,
    backgroundColor: C.ink[0],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.ink[150],
    ...shadows.sm,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressLabel: { ...T.small, color: C.ink[500], marginBottom: 2 },
  progressCount: { ...T.h2, color: C.ink[900] },
  iaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.green[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  iaBadgeText: { fontSize: 11, fontWeight: '700', color: C.green[700] },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.ink[150],
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: C.green[500], borderRadius: 3 },
  progressInfo: { ...T.small, color: C.ink[500], lineHeight: 18 },
  listContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  sectionLabel: { ...T.micro, letterSpacing: 0.3 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: C.ink[0],
    borderRadius: radius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemNome: { ...T.h3, fontSize: 14, color: C.ink[900], marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  itemTagText: { fontSize: 10, fontWeight: '700' },
  itemCat: { ...T.small, color: C.ink[500], fontSize: 11 },
  itemActions: { alignItems: 'flex-end', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.green[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCorrigir: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: C.ink[0],
    borderWidth: 1,
    borderColor: C.amber[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCorrigirText: { fontSize: 11, fontWeight: '700', color: C.amber[700] },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 20,
    backgroundColor: C.ink[0],
    borderTopWidth: 1,
    borderTopColor: C.ink[150],
  },
  btnCancelar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: C.ink[0],
    borderWidth: 1,
    borderColor: C.ink[200],
  },
  btnCancelarText: { ...T.body, color: C.ink[700], fontWeight: '600' },
  btnConfirmar: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: C.green[500],
    ...shadows.sm,
  },
  btnConfirmarText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
