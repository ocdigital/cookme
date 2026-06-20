import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const router = useRouter();

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [salvando, setSalvando] = useState(false);
  const [uploadandoAvatar, setUploadandoAvatar] = useState(false);
  const [modalAvatar, setModalAvatar] = useState(false);
  const [limpando, setLimpando] = useState(false);

  const [resumoMes, setResumoMes] = useState<{
    gasto_mes: number; total_compras_mes: number; mes_label: string;
  } | null>(null);

  useFocusEffect(useCallback(() => {
    api.get('/compras/resumo-mes')
      .then(r => setResumoMes(r.data))
      .catch(() => {});
  }, []));

  const inicialNome = (user?.nome || user?.email || 'U')[0].toUpperCase();

  const salvarPerfil = async () => {
    if (!nome.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor informe seu nome.');
      return;
    }
    try {
      setSalvando(true);
      const res = await api.patch('/usuarios/me', {
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
      });
      updateUser(res.data);
      setEditando(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  const cancelarEdicao = () => {
    setNome(user?.nome || '');
    setTelefone(user?.telefone || '');
    setEditando(false);
  };

  const uploadAvatar = async (uri: string, mimeType: string) => {
    try {
      setUploadandoAvatar(true);
      const formData = new FormData();
      const ext = uri.split('.').pop() || 'jpg';
      formData.append('file', { uri, name: `avatar.${ext}`, type: mimeType } as any);
      const res = await api.post('/usuarios/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar_url: res.data.avatar_url });
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto.');
    } finally {
      setUploadandoAvatar(false);
    }
  };

  const abrirCamera = async () => {
    setModalAvatar(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri, result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const abrirGaleria = async () => {
    setModalAvatar(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri, result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const handleLimparCache = () => {
    Alert.alert(
      'Limpar cache',
      'Remove todos os ingredientes da despensa e as receitas geradas. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar', style: 'destructive',
          onPress: async () => {
            try {
              setLimpando(true);
              await api.delete('/inventario/todos');
              Alert.alert('Pronto!', 'Despensa e receitas geradas foram limpas com sucesso.');
            } catch {
              Alert.alert('Erro', 'Não foi possível limpar o cache.');
            } finally {
              setLimpando(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          {router.canGoBack() ? (
            <TouchableOpacity style={styles.menuBtn} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink[700]} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
              <MaterialCommunityIcons name="menu" size={22} color={C.ink[700]} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>Minha conta</Text>
            <Text style={styles.headerTitle}>Perfil</Text>
          </View>
          {!editando ? (
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditando(true)}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={C.green[600]} />
              <Text style={styles.editBtnTxt}>Editar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelarEdicao}>
              <Text style={styles.cancelBtnTxt}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={() => setModalAvatar(true)} activeOpacity={0.85}>
              {uploadandoAvatar ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={C.ink[0]} />
                </View>
              ) : user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInicial}>{inicialNome}</Text>
                </View>
              )}
              <View style={styles.avatarCameraBtn}>
                <MaterialCommunityIcons name="camera" size={14} color={C.ink[0]} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarDica}>Toque para alterar a foto</Text>
          </View>

          {/* Gastos do mês */}
          {resumoMes && !editando && (
            <TouchableOpacity
              style={styles.gastosCard}
              onPress={() => router.push('/(app)/compras' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.gastosIconWrap}>
                <MaterialCommunityIcons name="cart-outline" size={20} color={C.green[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gastosLabel}>Gasto em {resumoMes.mes_label}</Text>
                <Text style={styles.gastosValor}>
                  R$ {Number(resumoMes.gasto_mes).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.gastosRight}>
                <Text style={styles.gastosComprasNum}>{resumoMes.total_compras_mes}</Text>
                <Text style={styles.gastosComprasLabel}>compras</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.green[400]} />
            </TouchableOpacity>
          )}

          {/* Dados do perfil */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Informações pessoais</Text>

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Nome</Text>
              {editando ? (
                <TextInput
                  style={styles.campoInput}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Seu nome"
                  placeholderTextColor={C.ink[400]}
                  autoCapitalize="words"
                />
              ) : (
                <Text style={styles.campoValor}>{user?.nome || '—'}</Text>
              )}
            </View>

            <View style={[styles.campo, styles.campoBorder]}>
              <Text style={styles.campoLabel}>Email</Text>
              <Text style={[styles.campoValor, { color: C.ink[400] }]}>{user?.email || '—'}</Text>
            </View>

            <View style={[styles.campo, styles.campoBorder]}>
              <Text style={styles.campoLabel}>Telefone</Text>
              {editando ? (
                <TextInput
                  style={styles.campoInput}
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={C.ink[400]}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.campoValor}>{user?.telefone || '—'}</Text>
              )}
            </View>

            <View style={[styles.campo, styles.campoBorder]}>
              <Text style={styles.campoLabel}>Conta</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeTxt}>{(user as any)?.role?.toUpperCase() || 'USER'}</Text>
              </View>
            </View>
          </View>

          {/* Botão salvar */}
          {editando && (
            <TouchableOpacity
              style={[styles.btnSalvar, salvando && { opacity: 0.6 }]}
              onPress={salvarPerfil}
              disabled={salvando}
              activeOpacity={0.85}
            >
              {salvando ? (
                <ActivityIndicator color={C.ink[0]} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color={C.ink[0]} />
                  <Text style={styles.btnSalvarTxt}>Salvar alterações</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Menu */}
          {!editando && (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Configurações</Text>
              {[
                { icon: 'star-circle-outline', label: 'Planos e assinatura', onPress: () => router.push('/(app)/planos' as any) },
                { icon: 'bell-outline', label: 'Notificações', onPress: () => router.push('/(app)/notificacoes' as any) },
                { icon: 'heart-outline', label: 'Receitas favoritas', onPress: () => router.push('/(app)/favoritas' as any) },
                { icon: 'history', label: 'Receitas feitas', onPress: () => router.push('/(app)/receitas-feitas' as any) },
                { icon: 'chef-hat', label: 'Minhas receitas', onPress: () => router.push('/(app)/minhas-receitas' as any) },
                { icon: 'shield-lock-outline', label: 'Privacidade', onPress: () => router.push('/(app)/privacidade' as any) },
                { icon: 'file-document-outline', label: 'Termos de Uso', onPress: () => router.push('/(app)/termos' as any) },
                { icon: 'trash-can-outline', label: 'Limpar cache', onPress: handleLimparCache, danger: true },
              ].map((item, i, arr) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < arr.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  disabled={limpando && (item as any).danger}
                >
                  <View style={[(item as any).danger ? styles.menuIconWrapDanger : styles.menuIconWrap]}>
                    {limpando && (item as any).danger ? (
                      <ActivityIndicator size="small" color={C.red[500]} />
                    ) : (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={18}
                        color={(item as any).danger ? C.red[500] : C.green[600]}
                      />
                    )}
                  </View>
                  <Text style={[(item as any).danger ? styles.menuTextDanger : styles.menuText]}>
                    {item.label}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[400]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Logout */}
          {!editando && (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <MaterialCommunityIcons name="logout" size={18} color={C.red[500]} />
              <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Modal escolha de foto */}
        <Modal visible={modalAvatar} transparent animationType="slide" onRequestClose={() => setModalAvatar(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalAvatar(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitulo}>Alterar foto de perfil</Text>
              <View style={styles.modalOpcoes}>
                <TouchableOpacity style={styles.modalOpcaoBtn} onPress={abrirCamera} activeOpacity={0.8}>
                  <View style={[styles.modalOpcaoIcone, { backgroundColor: C.green[50] }]}>
                    <MaterialCommunityIcons name="camera-outline" size={28} color={C.green[600]} />
                  </View>
                  <Text style={styles.modalOpcaoTxt}>Tirar foto</Text>
                </TouchableOpacity>
                <View style={styles.modalDivisor} />
                <TouchableOpacity style={styles.modalOpcaoBtn} onPress={abrirGaleria} activeOpacity={0.8}>
                  <View style={[styles.modalOpcaoIcone, { backgroundColor: C.ink[50] }]}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={28} color={C.ink[600]} />
                  </View>
                  <Text style={styles.modalOpcaoTxt}>Galeria</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  menuBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.green[50], paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.green[200],
  },
  editBtnTxt: { fontSize: 13, fontWeight: '700', color: C.green[600] },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  cancelBtnTxt: { fontSize: 13, fontWeight: '600', color: C.ink[500] },

  content: { padding: 20, paddingBottom: 40, gap: 16 },

  // Avatar
  avatarSection: { alignItems: 'center', gap: 8 },
  avatarWrap: { width: 96, height: 96, borderRadius: 48, position: 'relative' },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
  },
  avatarLoading: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.green[400], alignItems: 'center', justifyContent: 'center',
  },
  avatarInicial: { fontSize: 38, fontWeight: '700', color: C.ink[0] },
  avatarCameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.ink[50],
  },
  avatarDica: { ...T.micro, color: C.ink[400] },

  // Card
  card: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], overflow: 'hidden', ...shadows.sm,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  cardTitulo: { ...T.small, fontWeight: '700', color: C.ink[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  campo: { paddingVertical: 12 },
  campoBorder: { borderTopWidth: 1, borderTopColor: C.ink[100] },
  campoLabel: { ...T.micro, color: C.ink[400], fontWeight: '600', marginBottom: 4 },
  campoValor: { ...T.body, color: C.ink[800] },
  campoInput: {
    ...T.body, color: C.ink[900],
    borderWidth: 1, borderColor: C.green[200], borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.green[50],
  },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: C.green[50],
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.green[200],
  },
  roleBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.green[700] },

  // Salvar
  btnSalvar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.green[500], borderRadius: radius.md,
    paddingVertical: 14, ...shadows.sm,
  },
  btnSalvarTxt: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // Menu
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.ink[100] },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center',
  },
  menuIconWrapDanger: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.red[50], alignItems: 'center', justifyContent: 'center',
  },
  menuText: { flex: 1, ...T.body, color: C.ink[800], fontWeight: '600' },
  menuTextDanger: { flex: 1, ...T.body, color: C.red[500], fontWeight: '600' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.red[50], borderRadius: radius.md,
    paddingVertical: 14, gap: 8,
    borderWidth: 1, borderColor: C.red[200],
  },
  logoutText: { ...T.body, color: C.red[500], fontWeight: '700' },

  // Gastos do mês
  gastosCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.green[50], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.green[200], padding: 14, ...shadows.sm,
  },
  gastosIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.ink[0], alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.green[200],
  },
  gastosLabel: { ...T.micro, color: C.green[700], marginBottom: 2 },
  gastosValor: { ...T.h3, color: C.green[600] },
  gastosRight: { alignItems: 'center', marginRight: 4 },
  gastosComprasNum: { ...T.h3, color: C.ink[700] },
  gastosComprasLabel: { ...T.micro, color: C.ink[400] },

  // Modal avatar
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.ink[0], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 24, paddingBottom: 36, gap: 16,
    ...shadows.modal,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.ink[200], alignSelf: 'center', marginBottom: 4,
  },
  modalTitulo: { ...T.h3, color: C.ink[900] },
  modalOpcoes: {
    flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, borderColor: C.ink[150], overflow: 'hidden',
  },
  modalOpcaoBtn: { flex: 1, alignItems: 'center', paddingVertical: 20, gap: 8 },
  modalOpcaoIcone: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalOpcaoTxt: { ...T.small, color: C.ink[700], fontWeight: '600' },
  modalDivisor: { width: 1, backgroundColor: C.ink[150] },
});
