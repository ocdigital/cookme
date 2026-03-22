import { Drawer } from 'expo-router/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          marginLeft: -16,
          fontSize: 14,
          fontWeight: '600',
        },
        drawerActiveTintColor: '#FF6B6B',
        drawerInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      {/* Home Screen */}
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Início',
          title: 'CookMe',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Shopping List */}
      <Drawer.Screen
        name="shopping"
        options={{
          drawerLabel: 'Minha Lista',
          title: 'Minha Lista',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="shopping-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Recipes */}
      <Drawer.Screen
        name="recipes"
        options={{
          drawerLabel: 'Receitas',
          title: 'Receitas',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Purchases History */}
      <Drawer.Screen
        name="purchases"
        options={{
          drawerLabel: 'Histórico de Compras',
          title: 'Compras',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />

      {/* Favorites */}
      <Drawer.Screen
        name="favorites"
        options={{
          drawerLabel: 'Favoritos',
          title: 'Favoritos',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Perfil',
          title: 'Meu Perfil',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Settings */}
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Configurações',
          title: 'Configurações',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
