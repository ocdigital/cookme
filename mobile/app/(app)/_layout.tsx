import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useNavigationState } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useModoAlimentar } from '@/contexts/ModoAlimentarContext';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import api, { apiEvents } from '@/services/api';
import PaywallModal from '@/components/PaywallModal';

// ─── Itens do menu ────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { label: 'Início',          icon: 'home-outline',       route: '/(app)/(tabs)/' },
  { label: 'Despensa',        icon: 'fridge-outline',     route: '/(app)/(tabs)/despensa' },
  { label: 'Receitas',        icon: 'chef-hat',           route: '/(app)/(tabs)/receitas' },
  { label: 'Listas',          icon: 'cart-outline',       route: '/(app)/(tabs)/listas' },
  { label: 'Compras',         icon: 'receipt',            route: '/(app)/compras' },
  { label: 'Escanear Cupom',  icon: 'barcode-scan',       route: '/(app)/receita-ocr' },
] as const;

const BOTTOM_ITEMS = [
  { label: 'Perfil',          icon: 'account-outline',    route: '/(app)/(tabs)/perfil' },
  { label: 'Configurações',   icon: 'cog-outline',        route: '/(app)/settings' },
] as const;

// ─── Conteúdo customizado do drawer ──────────────────────────────────────────

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { corModo } = useModoAlimentar();
  const [gastoMes, setGastoMes] = useState<string | null>(null);
  // Rastreia mudanças de rota para recarregar o badge
  const navIndex = useNavigationState(s => s?.index);

  const carregarGasto = useCallback(() => {
    api.get('/compras/resumo-mes')
      .then(r => {
        const v: number = r.data.gasto_mes;
        setGastoMes(v > 0 ? `R$ ${v.toFixed(2).replace('.', ',')}` : null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { carregarGasto(); }, [carregarGasto, navIndex]);

  const iniciais = user?.nome
    ? user.nome.split(' ').slice(0, 2).map((p: string) => p[0].toUpperCase()).join('')
    : '?';

  const navigate = (route: string) => {
    props.navigation.closeDrawer();
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { backgroundColor: corModo }]}>
        <View style={styles.avatarWrap}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{iniciais}</Text>
            </View>
          )}
          <View style={[styles.avatarBadge, { borderColor: corModo }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>{user?.nome || 'Usuário'}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user?.email || ''}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Itens principais */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Menu</Text>
        {MENU_ITEMS.map((item) => {
          const isCompras = item.label === 'Compras';
          return (
            <TouchableOpacity
              key={item.route}
              style={styles.menuItem}
              onPress={() => navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={corModo} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {isCompras && gastoMes && (
                <View style={styles.gastosBadge}>
                  <Text style={styles.gastosBadgeTxt}>{gastoMes}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Conta</Text>

        {BOTTOM_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => navigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color={corModo} />
            </View>
            <Text style={[styles.menuLabel, { color: C.ink[600] }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>

      {/* Rodapé — logout */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/(auth)/login'); }} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={18} color={C.red[500]} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const [paywall, setPaywall] = useState<{ feature?: string; descricao?: string } | null>(null);

  useEffect(() => {
    const handler = (data: { feature?: string; descricao?: string }) => setPaywall(data);
    apiEvents.on('paywall', handler);
    return () => { apiEvents.off('paywall', handler); };
  }, []);

  return (
    <>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          swipeEnabled: true,
          drawerType: 'slide',
        }}
      >
        <Drawer.Screen name="(tabs)" />
        <Drawer.Screen name="receita-ocr/index" />
        <Drawer.Screen name="validacao/index" />
        <Drawer.Screen name="receitas-geradas/index" />
        <Drawer.Screen name="listas/[id]" />
        <Drawer.Screen name="listas/index" />
        <Drawer.Screen name="qr-scanner/index" />
        <Drawer.Screen name="comparacao/index" />
        <Drawer.Screen name="profile" />
        <Drawer.Screen name="settings" />
        <Drawer.Screen name="receita/[id]" />
        <Drawer.Screen name="nova-receita/index" />
        <Drawer.Screen name="compras/index" />
        <Drawer.Screen name="planos/index" />
      </Drawer>

      <PaywallModal
        visible={paywall !== null}
        onClose={() => setPaywall(null)}
        feature={paywall?.feature}
        descricao={paywall?.descricao}
      />
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.ink[0],
  },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: C.green[600],
  },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: C.ink[0] },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.green[400],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: C.ink[0] },
  avatarBadge: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.green[400], borderWidth: 2, borderColor: C.green[600],
  },
  userName: { ...T.h3, color: C.ink[0], fontSize: 15 },
  userEmail: { ...T.micro, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scrollContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },

  sectionLabel: {
    ...T.micro,
    color: C.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 8,
    marginTop: 8,
    marginBottom: 4,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100],
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...T.body, color: C.ink[800], fontWeight: '600', fontSize: 15 },

  gastosBadge: {
    backgroundColor: C.green[50], borderRadius: radius.pill,
    borderWidth: 1, borderColor: C.green[200],
    paddingHorizontal: 8, paddingVertical: 2,
  },
  gastosBadgeTxt: { ...T.micro, color: C.green[700] },

  divider: { height: 1, backgroundColor: C.ink[100], marginHorizontal: 20, marginVertical: 4 },

  // Rodapé
  footer: { paddingHorizontal: 12 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginTop: 4,
  },
  logoutText: { ...T.body, color: C.red[500], fontWeight: '600', fontSize: 15 },
});
