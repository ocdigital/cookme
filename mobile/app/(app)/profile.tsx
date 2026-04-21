import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

const MENU_ITEMS = [
  { icon: 'bell-outline', label: 'Notificações' },
  { icon: 'heart-outline', label: 'Favoritos' },
  { icon: 'history', label: 'Histórico de Compras' },
  { icon: 'lock-outline', label: 'Privacidade' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Avatar card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarInitial}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Usuário'}</Text>
        <Text style={styles.email}>{user?.email || 'user@email.com'}</Text>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
          >
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color={C.green[600]} />
            </View>
            <Text style={styles.menuText}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.ink[300]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <MaterialCommunityIcons name="logout" size={18} color={C.red[500]} />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  profileCard: {
    backgroundColor: C.ink[0],
    borderRadius: radius.xl,
    paddingVertical: 28, paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1, borderColor: C.ink[150],
    ...shadows.sm,
    gap: 6,
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.green[500],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: C.ink[0] },
  name: { ...T.h2, color: C.ink[900] },
  email: { ...T.body, color: C.ink[500] },
  section: {
    backgroundColor: C.ink[0],
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150],
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.ink[150] },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center',
  },
  menuText: { flex: 1, ...T.body, color: C.ink[800], fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.red[50],
    borderRadius: radius.md, paddingVertical: 15, gap: 8,
    borderWidth: 1, borderColor: C.red[500],
  },
  logoutText: { ...T.body, color: C.red[500], fontWeight: '700' },
});
