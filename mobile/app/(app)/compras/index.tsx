import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import api from '@/services/api';

interface CompraItem {
  id: string;
  produto?: { id: string; nome: string; codigo_barras?: string; marca?: { nome: string } };
  quantidade: number;
  unidade: string;
  preco_unitario: number;
}

interface Compra {
  id: string;
  local_compra?: string;
  data_compra: string;
  valor_total: number;
  metodo_cadastro?: string;
  itens?: CompraItem[];
  criado_em: string;
}

interface ResumoMes {
  gasto_mes: number;
  total_compras_mes: number;
  total_itens_mes: number;
  mes_label: string;
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const fmtMoney = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
const valorCompra = (compra: Compra): number => {
  const vt = Number(compra.valor_total);
  if (vt > 0) return vt;
  return (compra.itens ?? []).reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
};
const fmtDate = (d: string) => {
  if (!d) return '—';
  // "2026-07-02" sem hora → parse como local para evitar UTC shift no Android
  const normalized = d.includes('T') ? d : d.replace(/-/g, '/');
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const metodoIcon = (m?: string): string => ({
  cupom_sat: 'qrcode-scan',
  qrcode: 'qrcode-scan',
  cupom_nfce: 'receipt',
  ocr_nota: 'file-image-outline',
  manual: 'pencil-outline',
}[m ?? ''] ?? 'receipt');

export default function ComprasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hoje = new Date();
  const [mesSel, setMesSel] = useState(hoje.getMonth() + 1); // 1-12
  const [anoSel, setAnoSel] = useState(hoje.getFullYear());

  const [compras, setCompras] = useState<Compra[]>([]);
  const [resumo, setResumo] = useState<ResumoMes | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [expandedItens, setExpandedItens] = useState<Record<string, CompraItem[]>>({});

  const carregar = useCallback(async (isRefresh = false, mes = mesSel, ano = anoSel) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [comprasRes, resumoRes] = await Promise.all([
        api.get('/compras', { params: { limit: 100, mes, ano } }),
        api.get('/compras/resumo-mes', { params: { mes, ano } }),
      ]);
      setCompras(comprasRes.data || []);
      setResumo(resumoRes.data);
      setExpandedId(null);
      setExpandedItens({});
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mesSel, anoSel]);

  // Recarrega ao entrar na tela E ao trocar mês/ano
  useFocusEffect(useCallback(() => { carregar(false, mesSel, anoSel); }, [mesSel, anoSel]));

  const navMes = (dir: -1 | 1) => {
    let novoMes = mesSel + dir;
    let novoAno = anoSel;
    if (novoMes < 1) { novoMes = 12; novoAno--; }
    if (novoMes > 12) { novoMes = 1; novoAno++; }
    // não permite futuro além do mês atual
    const dataRef = new Date(novoAno, novoMes - 1, 1);
    const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    if (dataRef > dataHoje) return;
    setMesSel(novoMes);
    setAnoSel(novoAno);
  };

  const isMesAtual = mesSel === hoje.getMonth() + 1 && anoSel === hoje.getFullYear();

  const toggleExpand = async (compra: Compra) => {
    if (expandedId === compra.id) { setExpandedId(null); return; }
    setExpandedId(compra.id);
    if (expandedItens[compra.id]) return;
    if (compra.itens && compra.itens.length > 0) {
      setExpandedItens(prev => ({ ...prev, [compra.id]: compra.itens! }));
      return;
    }
    setLoadingDetail(compra.id);
    try {
      const res = await api.get(`/compras/${compra.id}`);
      setExpandedItens(prev => ({ ...prev, [compra.id]: res.data.itens || [] }));
    } catch {
      setExpandedItens(prev => ({ ...prev, [compra.id]: [] }));
    } finally {
      setLoadingDetail(null);
    }
  };

  const renderItem = ({ item: compra }: { item: Compra }) => {
    const isExpanded = expandedId === compra.id;
    const itens = expandedItens[compra.id] ?? [];
    const isLoadingDetail = loadingDetail === compra.id;
    const itemCount = compra.itens?.length ?? 0;

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardRow} onPress={() => toggleExpand(compra)} activeOpacity={0.7}>
          <View style={styles.cardIconWrap}>
            <MaterialCommunityIcons name={metodoIcon(compra.metodo_cadastro) as any} size={18} color={C.green[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLocal} numberOfLines={1}>
              {compra.local_compra || 'Local não informado'}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaTxt}>{fmtDate(compra.data_compra || compra.criado_em)}</Text>
              <Text style={styles.cardMetaDot}>·</Text>
              <Text style={[styles.cardMetaTxt, { color: C.green[600], fontWeight: '700' }]}>
                {fmtMoney(valorCompra(compra))}
              </Text>
              {itemCount > 0 && (
                <>
                  <Text style={styles.cardMetaDot}>·</Text>
                  <Text style={styles.cardMetaTxt}>{itemCount} itens</Text>
                </>
              )}
            </View>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={C.ink[400]}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.itemsContainer}>
            {isLoadingDetail ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator color={C.green[500]} size="small" />
              </View>
            ) : itens.length === 0 ? (
              <Text style={styles.emptyItens}>Nenhum item encontrado</Text>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.thTxt, { flex: 3 }]}>Produto</Text>
                  <Text style={[styles.thTxt, { flex: 1, textAlign: 'right' }]}>Qtd</Text>
                  <Text style={[styles.thTxt, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                </View>
                {itens.map((item, idx) => (
                  <View key={item.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <View style={{ flex: 3 }}>
                      <Text style={styles.itemNome} numberOfLines={2}>
                        {item.produto?.nome ?? <Text style={styles.itemSemProduto}>sem vínculo</Text>}
                      </Text>
                      {item.produto?.marca?.nome && (
                        <Text style={styles.itemMarca}>{item.produto.marca.nome}</Text>
                      )}
                    </View>
                    <Text style={[styles.itemQtd, { flex: 1 }]}>
                      {Number(item.quantidade).toLocaleString('pt-BR')} {item.unidade}
                    </Text>
                    <Text style={[styles.itemTotal, { flex: 1.5 }]}>
                      {fmtMoney(item.preco_unitario * item.quantidade)}
                    </Text>
                  </View>
                ))}
                <View style={styles.tableFooter}>
                  <Text style={styles.footerLabel}>Total ({itens.length} itens)</Text>
                  <Text style={styles.footerValor}>
                    {fmtMoney(itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0))}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Histórico</Text>
          <Text style={styles.headerTitle}>Minhas Compras</Text>
        </View>
      </View>

      {/* Seletor de mês */}
      <View style={styles.mesSeletor}>
        <TouchableOpacity style={styles.mesBtnNav} onPress={() => navMes(-1)}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={C.green[600]} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.mesNome}>{MESES[mesSel - 1]}</Text>
          <Text style={styles.mesAno}>{anoSel}</Text>
        </View>
        <TouchableOpacity
          style={[styles.mesBtnNav, isMesAtual && styles.mesBtnDisabled]}
          onPress={() => navMes(1)}
          disabled={isMesAtual}
        >
          <MaterialCommunityIcons name="chevron-right" size={22} color={isMesAtual ? C.ink[300] : C.green[600]} />
        </TouchableOpacity>
      </View>

      {/* Resumo do mês */}
      {resumo && (
        <View style={styles.resumoCard}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNum}>{fmtMoney(resumo.gasto_mes)}</Text>
            <Text style={styles.resumoLabel}>gasto no mês</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNum}>{resumo.total_compras_mes}</Text>
            <Text style={styles.resumoLabel}>compras</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNum}>{resumo.total_itens_mes}</Text>
            <Text style={styles.resumoLabel}>itens</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.green[500]} size="large" />
        </View>
      ) : compras.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="receipt-outline" size={48} color={C.ink[300]} />
          <Text style={styles.emptyTxt}>Nenhuma compra em {MESES[mesSel - 1]}</Text>
          <TouchableOpacity onPress={() => navMes(-1)} style={styles.emptyNavBtn}>
            <MaterialCommunityIcons name="chevron-left" size={16} color={C.green[600]} />
            <Text style={styles.emptyNavTxt}>Ver mês anterior</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={compras}
          renderItem={renderItem}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => carregar(true, mesSel, anoSel)}
              tintColor={C.green[500]}
            />
          }
        />
      )}
    </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },

  mesSeletor: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
    paddingHorizontal: 12, paddingVertical: 12,
  },
  mesBtnNav: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200],
    alignItems: 'center', justifyContent: 'center',
  },
  mesBtnDisabled: { backgroundColor: C.ink[100], borderColor: C.ink[200] },
  mesNome: { ...T.h3, color: C.ink[900] },
  mesAno: { ...T.small, color: C.ink[400] },

  resumoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.green[50], borderBottomWidth: 1, borderBottomColor: C.green[200],
    paddingVertical: 14, paddingHorizontal: 20,
  },
  resumoItem: { flex: 1, alignItems: 'center' },
  resumoNum: { ...T.h3, color: C.green[600] },
  resumoLabel: { ...T.micro, color: C.ink[500], marginTop: 2 },
  resumoDivisor: { width: 1, height: 32, backgroundColor: C.green[200] },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  emptyTxt: { ...T.body, color: C.ink[500], fontWeight: '700', textAlign: 'center' },
  emptyNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  emptyNavTxt: { ...T.small, color: C.green[600], fontWeight: '600' },

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], overflow: 'hidden', ...shadows.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center',
  },
  cardLocal: { ...T.body, color: C.ink[800], fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardMetaTxt: { ...T.small, color: C.ink[400] },
  cardMetaDot: { ...T.small, color: C.ink[300] },

  itemsContainer: { borderTopWidth: 1, borderTopColor: C.ink[100] },
  detailLoading: { padding: 20, alignItems: 'center' },
  emptyItens: { ...T.small, color: C.ink[400], textAlign: 'center', padding: 16 },

  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.ink[50], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  thTxt: { ...T.micro, color: C.ink[500] },

  tableRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  tableRowAlt: { backgroundColor: C.ink[50] },
  itemNome: { ...T.small, color: C.ink[800], fontWeight: '600', lineHeight: 16 },
  itemMarca: { ...T.micro, color: C.ink[400], marginTop: 1 },
  itemSemProduto: { color: C.red[500], fontStyle: 'italic' },
  itemQtd: { ...T.small, color: C.ink[500], textAlign: 'right' },
  itemTotal: { ...T.small, color: C.green[600], fontWeight: '700', textAlign: 'right' },

  tableFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 2, borderTopColor: C.ink[150],
    backgroundColor: C.green[50],
  },
  footerLabel: { ...T.small, color: C.ink[600], fontWeight: '700' },
  footerValor: { ...T.body, color: C.green[600], fontWeight: '700' },
});
