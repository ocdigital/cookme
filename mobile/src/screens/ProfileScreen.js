import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar dados do perfil quando a tela monta
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getProfile();
      setProfileData(data);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar dados do perfil');
      // Fallback para dados do auth context
      setProfileData(user);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'user', label: 'Informações Pessoais', route: 'PersonalInfo' },
    { icon: 'map-pin', label: 'Endereços', route: 'Addresses' },
    { icon: 'shopping-cart', label: 'Carrinho', route: 'Cart' },
    { icon: 'heart', label: 'Favoritos', route: 'Favorites' },
    { icon: 'bell', label: 'Notificações', route: 'Notifications' },
    { icon: 'credit-card', label: 'Forma de Pagamento', route: 'Payment' },
    { icon: 'help-circle', label: 'Perguntas Frequentes', route: 'FAQs' },
    { icon: 'star', label: 'Avaliações', route: 'Reviews' },
    { icon: 'settings', label: 'Configurações', route: 'Settings' },
  ];

  // Usar dados do perfil se carregados, senão usar dados do auth context
  const displayData = profileData || user;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.errorClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {displayData?.avatar_url ? (
              <Image source={{ uri: displayData.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {displayData?.nome?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{displayData?.nome || 'Usuário'}</Text>
          <Text style={styles.userSubtitle}>{displayData?.email || 'Email não disponível'}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                if (item.route === 'PersonalInfo') {
                  navigation.navigate('Settings');
                } else if (item.route) {
                  navigation.navigate(item.route);
                }
              }}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemIcon}>
                <FeatherIcon name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              <FeatherIcon name="chevron-right" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <View style={[styles.menuItemIcon, styles.logoutIcon]}>
              <FeatherIcon name="log-out" size={20} color="#D32F2F" />
            </View>
            <Text style={styles.logoutLabel}>Sair da Conta</Text>
            <FeatherIcon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  menuSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  logoutItem: {
    marginTop: spacing.md,
  },
  logoutIcon: {
    backgroundColor: '#FFEBEE',
  },
  logoutLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#D32F2F',
  },
  spacer: {
    height: spacing.xl,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EF5350',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
    flex: 1,
  },
  errorClose: {
    fontSize: 18,
    color: '#C62828',
    marginLeft: spacing.md,
  },
});
