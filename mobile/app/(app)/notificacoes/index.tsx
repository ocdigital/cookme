import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

interface NotifUsuario {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dados?: Record<string, any>;
  lido: boolean;
  criado_em: string;
}

const TIPO_ICONE: Record<string, { icon: string; cor: string; bg: string }> = {
  foto_pendente:  { icon: 'clock-outline',        cor: C.amber[700], bg: C.amber[50] },
  foto_aprovada:  { icon: 'check-circle-outline',  cor: C.green[600], bg: C.green[50] },
  foto_rejeitada: { icon: 'close-circle-outline',  cor: '#E03A2E',    bg: '#FFF2F0' },
  receita_aprovada: { icon: 'chef-hat',            cor: C.green[600], bg: C.green[50] },
};

function tempoRelativo(data: string) {
  const diff = Date.now() - new Date(data).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotifUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const carregar = async () => {
    try {
      const res = await api.get('/notificacoes-usuario');
      setNotifs(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const marcarLida = async (id: string) => {
    try {
      await api.patch(`/notificacoes-usuario/${id}/lida`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lido: true } : n));
    } catch {}
  };

  const marcarTodasLidas = async () => {
    try {
      await api.patch('/notificacoes-usuario/todas-lidas');
      setNotifs(prev => prev.map(n => ({ ...n, lido: true })));
    } catch {}
  };

  const naoLidas = notifs.filter(n => !n.lido).length;

  const renderItem = ({ item }: { item: NotifUsuario }) => {
    const meta = TIPO_ICONE[item.tipo] ?? { icon: 'bell-outline', cor: C.ink[500], bg: C.ink[100] };
    const receitaId = item.dados?.receita_id;

    return (
      <TouchableOpacity
        style={[styles.card, !item.lido && styles.cardNaoLido]}
        activeOpacity={0.75}
        onPress={() => {
          if (!item.lido) marcarLida(item.id);
          if (receitaId) router.push({ pathname: '/(app)/receita/[id]', params: { id: receitaId } } as any);
        }}
      >
        <View style={[styles.iconeWrap, { backgroundColor: meta.bg }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.cor} />
        </View>
        <View style={styles.corpo}>
          <Text style={styles.titulo} numberOfLines={1}>{item.titulo}</Text>
          <Text style={styles.mensagem} numberOfLines={3}>{item.mensagem}</Text>
          <Text style={styles.tempo}>{tempoRelativo(item.criado_em)}</Text>
        </View>
        {!item.lido && <View style={styles.ponto} />}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Central de avisos</Text>
          <Text style={styles.headerTitle}>Notificações</Text>
        </View>
        {naoLidas > 0 && (
          <TouchableOpacity onPress={marcarTodasLidas} activeOpacity={0.7}>
            <Text style={styles.marcarTodas}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.green[500]} />
        </View>
      ) : notifs.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="bell-sleep-outline" size={48} color={C.ink[300]} />
          <Text style={styles.emptyTxt}>Nenhuma notificação ainda</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },
  marcarTodas: { ...T.small, color: C.green[600], fontWeight: '700', textAlign: 'right' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTxt: { ...T.body, color: C.ink[400] },

  lista: { padding: 16, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    padding: 14, borderWidth: 1, borderColor: C.ink[150],
    ...shadows.sm,
  },
  cardNaoLido: {
    borderColor: C.green[200], backgroundColor: C.green[50],
  },
  iconeWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  corpo: { flex: 1, gap: 3 },
  titulo: { ...T.h3, fontSize: 14, color: C.ink[900] },
  mensagem: { ...T.small, color: C.ink[600], lineHeight: 18 },
  tempo: { ...T.micro, color: C.ink[400], marginTop: 2 },
  ponto: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.green[500], marginTop: 4, flexShrink: 0,
  },
});
