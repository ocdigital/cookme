import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function DrawerMenu({ navigation, closeDrawer }) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      id: 'home',
      label: 'Início',
      icon: '🏠',
      screen: 'Home',
      description: 'Página inicial',
    },
    {
      id: 'recipes',
      label: 'Receitas',
      icon: '🍳',
      screen: 'RecipesList',
      description: 'Todas as receitas',
    },
    {
      id: 'inventory',
      label: 'Meu Inventário',
      icon: '📦',
      screen: 'Inventory',
      description: 'Produtos cadastrados',
    },
    {
      id: 'scanner',
      label: 'Escanear Cupom',
      icon: '🔍',
      screen: 'QRScanner',
      description: 'Ler código de barras',
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: '📋',
      screen: 'History',
      description: 'Histórico de cupons',
    },
    {
      id: 'favorites',
      label: 'Favoritas',
      icon: '❤️',
      screen: 'Favorites',
      description: 'Suas receitas favoritas',
    },
  ];

  const handleNavigate = (screenName) => {
    closeDrawer();
    navigation.navigate(screenName);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Aplicação',
      'Tem certeza que deseja fazer logout?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao fazer logout');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header do Drawer */}
      <View style={styles.drawerHeader}>
        <View style={styles.userAvatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.nome || 'Usuário'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || 'email@exemplo.com'}
            </Text>
          </View>
        </View>
      </View>

      {/* Divisor */}
      <View style={styles.divider} />

      {/* Menu Items */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>MENU PRINCIPAL</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.6}
            >
              <Text style={styles.menuItemIcon}>{item.icon}</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Seção de Configurações */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>CONFIGURAÇÕES</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeDrawer();
              navigation.navigate('Home'); // Você pode adicionar uma ProfileScreen depois
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.menuItemIcon}>⚙️</Text>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Configurações</Text>
              <Text style={styles.menuItemDescription}>Preferências da conta</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeDrawer();
              // Aqui você pode adicionar uma AboutScreen depois
              Alert.alert('Sobre', 'CookMe v1.0.0\n\nAjude você a cozinhar com o que tem em casa');
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.menuItemIcon}>ℹ️</Text>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Sobre</Text>
              <Text style={styles.menuItemDescription}>Informações do app</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer com Logout */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonIcon}>🚪</Text>
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  drawerHeader: {
    backgroundColor: '#FF8C42',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 16,
  },
  userAvatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarIcon: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8D5C4',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 8,
  },
  menuSection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 10,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 10,
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s',
  },
  menuItemHovered: {
    backgroundColor: '#FFF3E0',
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C1810',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#999',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#FF8C42',
    fontWeight: '300',
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8D5C4',
    backgroundColor: '#FFFBF0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonIcon: {
    fontSize: 18,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
