import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Image, Alert, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlanejamento } from '@/hooks/usePlanejamento';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenTutorial from '@/components/ScreenTutorial';
import { useScreenTutorial } from '@/hooks/useScreenTutorial';

// ─── tipos ───────────────────────────────────────────────────────────────────

interface ReceitaSimples {
  id: string;
  titulo?: string;
  nome?: string;
  imagem_url?: string;
  tempo_preparo?: string | number;
  dificuldade?: string;
  cobertura?: number;
  disponivel?: boolean;
}

// ─── constantes ──────────────────────────────────────────────────────────────

const SEMANAS = [1, 2, 3, 4];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TIPOS: Array<'almoco' | 'jantar'> = ['almoco', 'jantar'];
const TIPO_LABEL: Record<string, string> = { almoco: 'Almoço', jantar: 'Jantar' };

function nomeDaReceita(r: ReceitaSimples | null | undefined) {
  if (!r) return '';
  return r.titulo || r.nome || '';
}

// ─── componentes pequenos ──────────────────────────────────────────────────

function SemanaTab({ num, ativo, onPress }: { num: number; ativo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.semanaTab, ativo && styles.semanaTabAtivo]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.semanaTabTxt, ativo && styles.semanaTabTxtAtivo]}>
        Semana {num}
      </Text>
    </TouchableOpacity>
  );
}

function ReceitaChip({
  receita,
  feita,
  onPress,
  onLongPress,
}: {
  receita: ReceitaSimples | null;
  feita: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  if (!receita) {
    return (
      <TouchableOpacity style={styles.chipVazio} onPress={onPress} activeOpacity={0.7}>
        <MaterialCommunityIcons name="plus" size={16} color={C.ink[400]} />
        <Text style={styles.chipVazioTxt}>Definir</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={[styles.chip, feita && styles.chipFeita]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {receita.imagem_url ? (
        <Image source={{ uri: receita.imagem_url }} style={styles.chipImg} />
      ) : (
        <View style={[styles.chipImg, styles.chipImgFallback]}>
          <MaterialCommunityIcons name="chef-hat" size={14} color={C.ink[400]} />
        </View>
      )}
      <Text style={styles.chipNome} numberOfLines={2}>
        {nomeDaReceita(receita)}
      </Text>
      {feita && (
        <MaterialCommunityIcons name="check-circle" size={14} color={C.green[500]} />
      )}
    </TouchableOpacity>
  );
}

// ─── modal selecionar receita ─────────────────────────────────────────────

function ModalEscolherReceita({
  visivel,
  receitas,
  loadingReceitas,
  onEscolher,
  onLimpar,
  onFechar,
}: {
  visivel: boolean;
  receitas: ReceitaSimples[];
  loadingReceitas: boolean;
  onEscolher: (r: ReceitaSimples) => void;
  onLimpar: () => void;
  onFechar: () => void;
}) {
  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escolher receita</Text>
            <TouchableOpacity onPress={onFechar}>
              <MaterialCommunityIcons name="close" size={22} color={C.ink[500]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.limparBtn} onPress={onLimpar} activeOpacity={0.7}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={C.red[500]} />
            <Text style={styles.limparBtnTxt}>Remover receita</Text>
          </TouchableOpacity>

          {loadingReceitas ? (
            <ActivityIndicator color={C.green[500]} style={{ marginVertical: 32 }} />
          ) : (
            <FlatList
              data={receitas}
              keyExtractor={(r) => r.id}
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.receitaRow}
                  onPress={() => onEscolher(item)}
                  activeOpacity={0.7}
                >
                  {item.imagem_url ? (
                    <Image source={{ uri: item.imagem_url }} style={styles.receitaRowImg} />
                  ) : (
                    <View style={[styles.receitaRowImg, styles.receitaRowImgFallback]}>
                      <MaterialCommunityIcons name="chef-hat" size={18} color={C.ink[400]} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receitaRowNome}>{nomeDaReceita(item)}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                      {item.tempo_preparo ? (
                        <Text style={styles.receitaRowMeta}>
                          {item.tempo_preparo}{typeof item.tempo_preparo === 'number' ? 'min' : ''}
                        </Text>
                      ) : null}
                      {item.cobertura !== undefined && (
                        <Text style={[
                          styles.receitaRowMeta,
                          { color: item.disponivel ? C.green[600] : C.amber[600] },
                        ]}>
                          {item.cobertura}% cobertura
                        </Text>
                      )}
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.ink[150] }} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── modal detalhes da receita ────────────────────────────────────────────

function ModalDetalheReceita({
  item,
  onFechar,
  onMarcarFeita,
}: {
  item: { id: string; receita: ReceitaSimples | null; feita: boolean; tipo_refeicao: string } | null;
  onFechar: () => void;
  onMarcarFeita: (id: string) => void;
}) {
  if (!item) return null;
  const r = item.receita;

  return (
    <Modal visible={!!item} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{TIPO_LABEL[item.tipo_refeicao]}</Text>
            <TouchableOpacity onPress={onFechar}>
              <MaterialCommunityIcons name="close" size={22} color={C.ink[500]} />
            </TouchableOpacity>
          </View>
          {r ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {r.imagem_url ? (
                <Image source={{ uri: r.imagem_url }} style={styles.detalheImg} />
              ) : null}
              <Text style={styles.detalheNome}>{nomeDaReceita(r)}</Text>
              {!item.feita && (
                <TouchableOpacity
                  style={styles.feiBtn}
                  onPress={() => onMarcarFeita(item.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check-bold" size={18} color={C.ink[0]} />
                  <Text style={styles.feiBtnTxt}>Fiz essa receita hoje!</Text>
                </TouchableOpacity>
              )}
              {item.feita && (
                <View style={styles.feitaBadge}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={C.green[600]} />
                  <Text style={styles.feitaBadgeTxt}>Receita já feita</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <Text style={[T.body, { color: C.ink[400], padding: 16 }]}>Sem receita definida</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── screen principal ─────────────────────────────────────────────────────

export default function SemanaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, loading, carregarSemana, definirReceita, gerarAleatoria, marcarFeita } = usePlanejamento();
  const { showTutorial, dismissTutorial } = useScreenTutorial('semana');

  const [semanaAtiva, setSemanaAtiva] = useState(1);
  const [receitas, setReceitas] = useState<ReceitaSimples[]>([]);
  const [loadingReceitas, setLoadingReceitas] = useState(false);

  /* REGIONAL_FILTER_DISABLED
  // Filtro regional
  const [apenasRegional, setApenasRegional] = useState(false);
  const [estadoUsuario, setEstadoUsuario] = useState<string | null>(null);
  const [regiaoUsuario, setRegiaoUsuario] = useState<string | null>(null);
  */

  // Modal escolher receita
  const [modalEscolher, setModalEscolher] = useState<{
    semana: number; dia: number; tipo: 'almoco' | 'jantar'
  } | null>(null);

  // Modal detalhe
  const [modalDetalhe, setModalDetalhe] = useState<{
    id: string; receita: ReceitaSimples | null; feita: boolean; tipo_refeicao: string
  } | null>(null);

  /* REGIONAL_FILTER_DISABLED
  // Carrega preferências do usuário (estado/região)
  useEffect(() => {
    api.get('/usuarios/preferencias').then(res => {
      setEstadoUsuario(res.data?.estado || null);
      setRegiaoUsuario(res.data?.regiao_culinaria || null);
    }).catch(() => {});
  }, []);
  */

  useFocusEffect(
    useCallback(() => {
      carregarSemana(semanaAtiva);
    }, [semanaAtiva])
  );

  const trocarSemana = (n: number) => {
    setSemanaAtiva(n);
    carregarSemana(n);
  };

  const abrirModalEscolher = async (dia: number, tipo: 'almoco' | 'jantar') => {
    setModalEscolher({ semana: semanaAtiva, dia, tipo });
    if (receitas.length === 0) {
      setLoadingReceitas(true);
      try {
        const res = await api.get('/receitas/disponiveis');
        setReceitas(res.data?.receitas || res.data || []);
      } catch {}
      finally { setLoadingReceitas(false); }
    }
  };

  const escolherReceita = async (r: ReceitaSimples) => {
    if (!modalEscolher) return;
    const { semana, dia, tipo } = modalEscolher;
    setModalEscolher(null);
    await definirReceita(semana, dia, tipo, r.id);
    await carregarSemana(semana);
  };

  const limparSlot = async () => {
    if (!modalEscolher) return;
    const { semana, dia, tipo } = modalEscolher;
    setModalEscolher(null);
    await definirReceita(semana, dia, tipo, null);
    await carregarSemana(semana);
  };

  const abrirDetalhe = (dia: number, tipo: 'almoco' | 'jantar') => {
    const item = items.find(i => i.dia_semana === dia && i.tipo_refeicao === tipo);
    if (!item) return;
    setModalDetalhe({
      id: item.id,
      receita: item.receita as ReceitaSimples | null,
      feita: item.feita,
      tipo_refeicao: item.tipo_refeicao,
    });
  };

  const handleMarcarFeita = async (id: string) => {
    await marcarFeita(id);
    setModalDetalhe(null);
  };

  const handleGerarAleatoria = () => {
    // REGIONAL_FILTER_DISABLED: const msgRegional = apenasRegional && regiaoUsuario ? ` Usando receitas da região ${regiaoUsuario}.` : '';
    Alert.alert(
      'Gerar semana aleatória',
      `Isso vai substituir todos os dias da Semana ${semanaAtiva} com receitas baseadas nas suas preferências. Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Gerar',
          onPress: async () => {
            try {
              // gerarAleatoria já atualiza items no hook com receitas populadas
              // REGIONAL_FILTER_DISABLED: await gerarAleatoria(semanaAtiva, apenasRegional);
              await gerarAleatoria(semanaAtiva, false);
            } catch {
              Alert.alert('Erro', 'Não foi possível gerar o planejamento.');
            }
          },
        },
      ],
    );
  };

  const getItem = (dia: number, tipo: 'almoco' | 'jantar') =>
    items.find(i => i.dia_semana === dia && i.tipo_refeicao === tipo);

  const totalDias = items.filter(i => i.receita_id).length;
  const feitasHoje = items.filter(i => i.feita).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Receitas da Semana</Text>
          <Text style={styles.headerSub}>
            {totalDias > 0 ? `${totalDias} refeições planejadas` : 'Nenhuma refeição planejada'}
            {feitasHoje > 0 ? ` · ${feitasHoje} feitas` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.aleatorioBtn} onPress={handleGerarAleatoria} activeOpacity={0.8}>
          <MaterialCommunityIcons name="dice-5-outline" size={18} color={C.ink[0]} />
          <Text style={styles.aleatorioBtnTxt}>Aleatório</Text>
        </TouchableOpacity>
      </View>

      {/* REGIONAL_FILTER_DISABLED
      <TouchableOpacity
        style={styles.regionalRow}
        onPress={() => {
          if (!estadoUsuario) {
            Alert.alert(
              'Estado não definido',
              'Configure seu estado nas Configurações para usar o filtro regional.',
              [
                { text: 'Agora não', style: 'cancel' },
                { text: 'Configurar', onPress: () => router.push('/(app)/settings') },
              ],
            );
            return;
          }
          setApenasRegional(v => !v);
        }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={16}
          color={apenasRegional ? C.green[600] : C.ink[400]}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.regionalLabel, apenasRegional && styles.regionalLabelAtivo]}>
            Somente receitas da minha região
          </Text>
          {estadoUsuario ? (
            <Text style={styles.regionalSub}>
              {estadoUsuario} · {regiaoUsuario ? regiaoUsuario.charAt(0).toUpperCase() + regiaoUsuario.slice(1).replace('_', '-') : ''}
            </Text>
          ) : (
            <Text style={styles.regionalSubAviso}>Defina seu estado nas Configurações</Text>
          )}
        </View>
        <Switch
          value={apenasRegional}
          onValueChange={(v) => {
            if (!estadoUsuario && v) {
              Alert.alert(
                'Estado não definido',
                'Configure seu estado nas Configurações para usar o filtro regional.',
                [
                  { text: 'Agora não', style: 'cancel' },
                  { text: 'Configurar', onPress: () => router.push('/(app)/settings') },
                ],
              );
              return;
            }
            setApenasRegional(v);
          }}
          trackColor={{ false: C.ink[200], true: C.green[400] }}
          thumbColor={apenasRegional ? C.green[600] : C.ink[400]}
        />
      </TouchableOpacity>
      */}

      {/* Tabs de semana */}
      <View style={styles.semanasTabs}>
        {SEMANAS.map(n => (
          <SemanaTab key={n} num={n} ativo={semanaAtiva === n} onPress={() => trocarSemana(n)} />
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.green[500]} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grade}>
          {DIAS.map((dia, idx) => (
            <View key={idx} style={styles.diaRow}>
              {/* Nome do dia */}
              <View style={styles.diaLabel}>
                <Text style={styles.diaNome}>{dia}</Text>
              </View>

              {/* Slots de refeição */}
              <View style={styles.diaSlots}>
                {TIPOS.map((tipo) => {
                  const item = getItem(idx, tipo);
                  return (
                    <View key={tipo} style={styles.slot}>
                      <Text style={styles.slotLabel}>{TIPO_LABEL[tipo]}</Text>
                      <ReceitaChip
                        receita={item?.receita as ReceitaSimples | null ?? null}
                        feita={item?.feita ?? false}
                        onPress={() =>
                          item?.receita
                            ? abrirDetalhe(idx, tipo)
                            : abrirModalEscolher(idx, tipo)
                        }
                        onLongPress={() => abrirModalEscolher(idx, tipo)}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal escolher */}
      <ModalEscolherReceita
        visivel={!!modalEscolher}
        receitas={receitas}
        loadingReceitas={loadingReceitas}
        onEscolher={escolherReceita}
        onLimpar={limparSlot}
        onFechar={() => setModalEscolher(null)}
      />

      {/* Modal detalhe */}
      <ModalDetalheReceita
        item={modalDetalhe}
        onFechar={() => setModalDetalhe(null)}
        onMarcarFeita={handleMarcarFeita}
      />

      <ScreenTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        steps={[
          { icon: 'calendar-week', title: 'Planejamento semanal', description: 'Organize suas refeições da semana: café da manhã, almoço e jantar para cada dia.' },
          { icon: 'plus-circle-outline', title: 'Adicionar refeição', description: 'Toque no slot vazio de cada refeição para escolher uma receita ou gerar uma nova com IA.' },
          { icon: 'shuffle-variant', title: 'Sugestão aleatória', description: "Use o botão 'Aleatório' para preencher a semana inteira com receitas sugeridas automaticamente." },
        ]}
      />
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12,
  },
  headerTitle: { ...T.h2, color: C.ink[900] },
  headerSub: { ...T.small, color: C.ink[400], marginTop: 2 },
  aleatorioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.green[500], borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 9, ...shadows.sm,
  },
  aleatorioBtnTxt: { ...T.small, color: C.ink[0], fontWeight: '700' },

  /* REGIONAL_FILTER_DISABLED
  regionalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: C.ink[0], borderRadius: radius.sm,
    borderWidth: 1, borderColor: C.ink[150],
    paddingHorizontal: 14, paddingVertical: 10,
    ...shadows.sm,
  },
  regionalLabel: { ...T.small, color: C.ink[600], fontWeight: '600' },
  regionalLabelAtivo: { color: C.green[700] },
  regionalSub: { ...T.micro, color: C.ink[400], marginTop: 1 },
  regionalSubAviso: { ...T.micro, color: C.amber[600], marginTop: 1 },
  */

  semanasTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  semanaTab: {
    flex: 1, paddingVertical: 8, borderRadius: radius.sm,
    backgroundColor: C.ink[100], alignItems: 'center',
  },
  semanaTabAtivo: { backgroundColor: C.green[500] },
  semanaTabTxt: { ...T.small, color: C.ink[500], fontWeight: '700' },
  semanaTabTxtAtivo: { color: C.ink[0] },

  grade: { paddingHorizontal: 16, paddingBottom: 32, gap: 0 },

  diaRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: C.ink[150],
    paddingVertical: 10, gap: 10,
  },
  diaLabel: {
    width: 38, justifyContent: 'center', alignItems: 'center',
  },
  diaNome: { ...T.micro, color: C.ink[500], fontWeight: '700', textTransform: 'uppercase' },

  diaSlots: { flex: 1, flexDirection: 'row', gap: 8 },
  slot: { flex: 1, gap: 4 },
  slotLabel: { ...T.micro, color: C.ink[400] },

  chip: {
    backgroundColor: C.ink[0], borderRadius: radius.sm,
    borderWidth: 1, borderColor: C.ink[150],
    padding: 6, flexDirection: 'row', alignItems: 'center', gap: 6,
    ...shadows.sm,
  },
  chipFeita: { borderColor: C.green[400], backgroundColor: C.green[50] },
  chipImg: { width: 30, height: 30, borderRadius: 6 },
  chipImgFallback: { backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  chipNome: { ...T.micro, color: C.ink[700], flex: 1, lineHeight: 14 },

  chipVazio: {
    borderWidth: 1, borderColor: C.ink[200], borderStyle: 'dashed',
    borderRadius: radius.sm, padding: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    minHeight: 44,
  },
  chipVazioTxt: { ...T.micro, color: C.ink[400] },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, paddingBottom: 32,
    ...shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { ...T.h3, color: C.ink[900] },

  limparBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: C.red[50], borderRadius: radius.sm,
    marginBottom: 12,
  },
  limparBtnTxt: { ...T.small, color: C.red[500], fontWeight: '700' },

  receitaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  receitaRowImg: { width: 44, height: 44, borderRadius: 10 },
  receitaRowImgFallback: { backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  receitaRowNome: { ...T.body, color: C.ink[800], fontWeight: '600' },
  receitaRowMeta: { ...T.micro, color: C.ink[400] },

  // Detalhe
  detalheImg: { width: '100%', height: 160, borderRadius: radius.md, marginBottom: 12 },
  detalheNome: { ...T.h2, color: C.ink[900], marginBottom: 16 },

  feiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[500], borderRadius: radius.md,
    paddingVertical: 14, justifyContent: 'center', ...shadows.sm,
  },
  feiBtnTxt: { ...T.body, color: C.ink[0], fontWeight: '700' },

  feitaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.green[200],
    paddingVertical: 12, paddingHorizontal: 16,
  },
  feitaBadgeTxt: { ...T.body, color: C.green[700], fontWeight: '600' },
});
