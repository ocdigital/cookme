import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

export function DrawerContent(props) {
  const menuItems = [
    { icon: 'home', label: 'Início', route: 'Home' },
    { icon: 'grid', label: 'Categorias', route: 'Categorias' },
    { icon: 'search', label: 'Pesquisa', route: 'Pesquisa' },
    { icon: 'heart', label: 'Favoritos', route: 'Favorites' },
    { icon: 'history', label: 'Histórico', route: 'History' },
    { icon: 'settings', label: 'Configurações', route: 'Settings' },
  ];

  return (
    <DrawerContentScrollView {...props} scrollEnabled={false}>
      {/* Header do Drawer */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>CookMe</Text>
        <Text style={styles.drawerSubtitle}>Receitas & Inventário</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => props.navigation.navigate(item.route)}
            activeOpacity={0.6}
          >
            <FeatherIcon
              name={item.icon}
              size={20}
              color={colors.primary}
              style={styles.menuIcon}
            />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <FeatherIcon
              name="chevron-right"
              size={18}
              color={colors.text.muted}
              style={styles.menuChevron}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => props.navigation.navigate('Profile')}
        activeOpacity={0.6}
      >
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>👤</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Meu Perfil</Text>
          <Text style={styles.profileSubtext}>Gerenciar conta</Text>
        </View>
        <FeatherIcon
          name="chevron-right"
          size={18}
          color={colors.text.muted}
        />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.6}
      >
        <FeatherIcon
          name="log-out"
          size={18}
          color="#D32F2F"
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  drawerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  drawerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  menuChevron: {
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileSubtext: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  logoutIcon: {
    marginRight: spacing.md,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#D32F2F',
  },
});
