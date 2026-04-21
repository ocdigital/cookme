import { Drawer } from 'expo-router/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerStyle: {
          backgroundColor: C.ink[50],
          width: 280,
        },
        drawerLabelStyle: {
          marginLeft: -16,
          fontSize: 14,
          fontWeight: '600',
        },
        drawerActiveTintColor: C.green[600],
        drawerInactiveTintColor: C.ink[500],
        drawerActiveBackgroundColor: C.green[50],
        headerShown: true,
        headerStyle: { backgroundColor: C.ink[0] },
        headerTintColor: C.ink[800],
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: C.ink[900] },
        headerShadowVisible: false,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Início',
          headerShown: false,
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />
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
