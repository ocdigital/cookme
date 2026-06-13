import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

export default function PrivacidadeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    carregarPreferencias();
  }, []);

  const carregarPreferencias = async () => {
    try {
      const res = await api.get('/usuarios/preferencias');
      setNotificacoesAtivas(res.data?.alertas_habilitados ?? true);
    } catch {
      // silencioso
    }
  };

  const toggleNotificacoes = async (valor: boolean) => {
    setNotificacoesAtivas(valor);
    setLoadingNotif(true);
    try {
      await api.patch('/usuarios/preferencias', { alertas_habilitados: valor });
    } catch {
      setNotificacoesAtivas(!valor);
      Alert.alert('Erro', 'Não foi possível atualizar a preferência.');
    } finally {
      setLoadingNotif(false);
    }
  };

  const confirmarExclusao = () => {
    Alert.alert(
      'Excluir conta',
      'Esta ação é irreversível. Todos os seus dados, histórico e favoritos serão deletados permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir minha conta',
          style: 'destructive',
          onPress: excluirConta,
        },
      ],
    );
  };

  const excluirConta = async () => {
    try {
      setDeletando(true);
      await api.delete('/usuarios/me');
      await logout();
      router.replace('/(auth)/login');
    } catch {
      setDeletando(false);
      Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>Dados e segurança</Text>
          <Text style={styles.headerTitle}>Privacidade</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Notificações */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Notificações</Text>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="bell-outline" size={18} color={C.green[600]} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Alertas e avisos</Text>
              <Text style={styles.rowDesc}>Receitas vencendo, inventário baixo e dicas</Text>
            </View>
            {loadingNotif ? (
              <ActivityIndicator size="small" color={C.green[500]} />
            ) : (
              <Switch
                value={notificacoesAtivas}
                onValueChange={toggleNotificacoes}
                trackColor={{ false: C.ink[200], true: C.green[400] }}
                thumbColor={notificacoesAtivas ? C.green[600] : C.ink[400]}
              />
            )}
          </View>
        </View>

        {/* Seus dados */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Seus dados</Text>

          {[
            {
              icon: 'database-outline',
              label: 'O que coletamos',
              desc: 'Nome, email, inventário pessoal e histórico de receitas feitas.',
            },
            {
              icon: 'lock-outline',
              label: 'Como protegemos',
              desc: 'Seus dados são criptografados em trânsito (HTTPS) e armazenados com segurança.',
            },
            {
              icon: 'share-variant-outline',
              label: 'Compartilhamento',
              desc: 'Avaliações e receitas enviadas são públicas. Inventário e histórico são privados.',
            },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && styles.rowBorder]}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={C.ink[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Zona de perigo */}
        <View style={[styles.card, styles.cardPerigo]}>
          <Text style={[styles.cardTitulo, { color: C.red[500] }]}>Zona de perigo</Text>

          <TouchableOpacity
            style={styles.deletarBtn}
            onPress={confirmarExclusao}
            disabled={deletando}
            activeOpacity={0.8}
          >
            {deletando ? (
              <ActivityIndicator color={C.red[500]} size="small" />
            ) : (
              <MaterialCommunityIcons name="delete-forever-outline" size={18} color={C.red[500]} />
            )}
            <Text style={styles.deletarTxt}>Excluir minha conta</Text>
          </TouchableOpacity>
          <Text style={styles.deletarAviso}>
            Esta ação é permanente e não pode ser desfeita.
          </Text>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 14, paddingTop: 12,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },

  content: { padding: 20, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  cardPerigo: { borderColor: C.red[200], backgroundColor: C.red[50] },
  cardTitulo: { ...T.small, fontWeight: '700', color: C.ink[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  // Switch row
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowLabel: { ...T.body, fontWeight: '600', color: C.ink[800] },
  rowDesc: { ...T.micro, color: C.ink[400], marginTop: 2 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.ink[100] },

  // Info rows
  infoRow: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.ink[50], alignItems: 'center', justifyContent: 'center' },
  infoLabel: { ...T.small, fontWeight: '700', color: C.ink[800] },
  infoDesc: { ...T.micro, color: C.ink[500], marginTop: 2, lineHeight: 16 },

  // Excluir
  deletarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: C.red[200], borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: C.ink[0], marginBottom: 8,
  },
  deletarTxt: { ...T.body, color: C.red[500], fontWeight: '700' },
  deletarAviso: { ...T.micro, color: C.red[500], textAlign: 'center', marginBottom: 4 },
});
