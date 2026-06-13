import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import api from '@/services/api';
import { useModoAlimentar } from '@/contexts/ModoAlimentarContext';
import { PerfilAprendizadoCard } from '@/components/PerfilAprendizadoCard';
import { useCookMeAprendizado } from '@/hooks/useCookMeAprendizado';

type ModoAlimentar = 'normal' | 'fitness' | 'vegetariano' | 'vegano';

const MODOS_ALIMENTAR: { value: ModoAlimentar; label: string; desc: string; icon: string; cor: string }[] = [
  { value: 'normal',      label: 'Padrão',       desc: 'Todas as receitas',                icon: 'food-variant',   cor: C.ink[500] },
  { value: 'fitness',     label: 'Fitness',      desc: 'Saudável e nutritivo',             icon: 'dumbbell',       cor: '#6366f1' },
  { value: 'vegetariano', label: 'Vegetariano',  desc: 'Sem carne, com ovos e laticínios', icon: 'leaf',           cor: C.green[600] },
  { value: 'vegano',      label: 'Vegano',       desc: 'Sem produtos de origem animal',    icon: 'sprout',         cor: '#16a34a' },
];

const REFEICOES_OPTS = [
  { value: 'almoco_jantar', label: 'Almoço e Jantar' },
  { value: 'almoco', label: 'Só Almoço' },
  { value: 'jantar', label: 'Só Jantar' },
];

function Section({ title, children, description }: { title: string; children: React.ReactNode; description?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && <Text style={styles.sectionDesc}>{description}</Text>}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, label, description, value, onToggle, onPress, last }: {
  icon: string; label: string; description?: string;
  value?: boolean; onToggle?: (v: boolean) => void; onPress?: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon as any} size={18} color={C.green[600]} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      {onToggle !== undefined ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: C.ink[200], true: C.green[400] }}
          thumbColor={value ? C.green[600] : C.ink[400]}
        />
      ) : onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
      ) : null}
    </TouchableOpacity>
  );
}

function ModalLista<T extends { value: string; label: string }>({
  visivel, titulo, itens, selecionado, onEscolher, onFechar,
}: {
  visivel: boolean; titulo: string; itens: T[];
  selecionado: string; onEscolher: (v: string) => void; onFechar: () => void;
}) {
  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{titulo}</Text>
            <TouchableOpacity onPress={onFechar}>
              <MaterialCommunityIcons name="close" size={22} color={C.ink[500]} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={itens}
            keyExtractor={i => i.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listaItem, item.value === selecionado && styles.listaItemAtivo]}
                onPress={() => { onEscolher(item.value); onFechar(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.listaItemTxt, item.value === selecionado && styles.listaItemTxtAtivo]}>
                  {item.label}
                </Text>
                {item.value === selecionado && (
                  <MaterialCommunityIcons name="check" size={18} color={C.green[600]} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.ink[150] }} />}
          />
        </View>
      </View>
    </Modal>
  );
}

function ModoAlimentarCard({ modo, selecionado, onPress }: {
  modo: typeof MODOS_ALIMENTAR[0]; selecionado: boolean; onPress: () => void;
}) {
  const ativo = selecionado;
  return (
    <TouchableOpacity
      style={[styles.modoCard, ativo && { borderColor: modo.cor, borderWidth: 2, backgroundColor: `${modo.cor}10` }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.modoIconBox, { backgroundColor: ativo ? `${modo.cor}20` : C.ink[100] }]}>
        <MaterialCommunityIcons name={modo.icon as any} size={22} color={ativo ? modo.cor : C.ink[400]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.modoLabel, ativo && { color: modo.cor }]}>{modo.label}</Text>
        <Text style={styles.modoDesc}>{modo.desc}</Text>
      </View>
      {ativo && <MaterialCommunityIcons name="check-circle" size={20} color={modo.cor} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { modoAlimentar, setModoAlimentar: setModoCtx } = useModoAlimentar();
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [refeicoes, setRefeicoes] = useState('almoco_jantar');
  const [modalRefeicoes, setModalRefeicoes] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get('/usuarios/preferencias').then(res => {
      const modo = res.data?.modo_alimentar;
      if (modo) setModoCtx(modo);
      setRefeicoes(res.data?.refeicoes_planejamento || 'almoco_jantar');
    }).catch(() => {});
  }, []);

  const salvarPref = async (updates: Record<string, string>) => {
    setSalvando(true);
    try {
      await api.patch('/usuarios/preferencias', updates);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as preferências.');
    } finally { setSalvando(false); }
  };

  const escolherModo = (modo: ModoAlimentar) => {
    setModoCtx(modo);
    salvarPref({ modo_alimentar: modo });
  };

  const escolherRefeicoes = (r: string) => {
    setRefeicoes(r);
    salvarPref({ refeicoes_planejamento: r });
  };

  const refLabelAtual = REFEICOES_OPTS.find(r => r.value === refeicoes)?.label || refeicoes;
  const router = useRouter();
  const { perfil, progressoGeral } = useCookMeAprendizado();

  return (
    <ScreenWrapper>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {router.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink[700]} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Preferências</Text>
          <Text style={styles.headerTitle}>Configurações</Text>
        </View>
      </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <PerfilAprendizadoCard perfil={perfil} progressoGeral={progressoGeral} />
      </View>

      <Section
        title="Modo Alimentar"
        description="Define quais receitas aparecem e a ordem de sugestões"
      >
        <View style={styles.modoGrid}>
          {MODOS_ALIMENTAR.map((modo) => (
            <ModoAlimentarCard
              key={modo.value}
              modo={modo}
              selecionado={modoAlimentar === modo.value}
              onPress={() => escolherModo(modo.value)}
            />
          ))}
        </View>
      </Section>

      <Section title="Notificações">
        <SettingRow
          icon="bell-outline" label="Notificações Push"
          description="Receba alertas importantes"
          value={notifications} onToggle={setNotifications} last
        />
      </Section>

      <Section title="Privacidade">
        <SettingRow
          icon="map-marker-outline" label="Localização"
          description="Usar localização"
          value={location} onToggle={setLocation}
        />
        <SettingRow icon="shield-outline" label="Dados Pessoais" description="Gerencie seus dados" onPress={() => {}} last />
      </Section>

      <Section title="Planejamento Semanal">
        <SettingRow
          icon="food-fork-drink"
          label="Refeições para planejar"
          description={refLabelAtual}
          onPress={() => setModalRefeicoes(true)}
          last
        />
      </Section>

      <Section title="Sobre">
        <SettingRow icon="information-outline" label="Versão do App" description="v1.0.0" />
        <SettingRow icon="file-document-outline" label="Termos de Serviço" onPress={() => {}} />
        <SettingRow icon="lock-outline" label="Política de Privacidade" onPress={() => {}} last />
      </Section>

      <ModalLista
        visivel={modalRefeicoes}
        titulo="Refeições para planejar"
        itens={REFEICOES_OPTS}
        selecionado={refeicoes}
        onEscolher={escolherRefeicoes}
        onFechar={() => setModalRefeicoes(false)}
      />
    </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },

  content: { padding: 20, paddingBottom: 40, gap: 12 },
  section: { gap: 0 },
  sectionTitle: {
    ...T.micro, color: C.ink[400],
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 4, marginLeft: 4,
  },
  sectionDesc: { ...T.small, color: C.ink[500], marginBottom: 8, marginLeft: 4 },
  sectionBody: {
    backgroundColor: C.ink[0],
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150],
    overflow: 'hidden',
    ...shadows.sm,
  },

  // Modo Alimentar grid
  modoGrid: { flexDirection: 'column' },
  modoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.ink[150],
    borderWidth: 1.5, borderColor: 'transparent',
  },
  modoIconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modoLabel: { ...T.body, color: C.ink[800], fontWeight: '700' },
  modoDesc: { ...T.small, color: C.ink[400], marginTop: 1 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.ink[150] },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { ...T.body, color: C.ink[800], fontWeight: '600' },
  rowDesc: { ...T.small, color: C.ink[400], marginTop: 1 },

  modalOverlay: {
    flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, paddingBottom: 32, maxHeight: '70%',
    ...shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { ...T.h3, color: C.ink[900] },
  listaItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  listaItemAtivo: {},
  listaItemTxt: { ...T.body, color: C.ink[700] },
  listaItemTxtAtivo: { color: C.green[600], fontWeight: '700' },
});
