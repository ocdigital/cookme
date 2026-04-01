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
        headerShown: true,
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
      {/* Início (Home with Tabs) */}
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Início',
          headerShown: false,
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
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

      {/* OCR Receipt Scanner */}
      <Drawer.Screen
        name="receita-ocr/index"
        options={{
          drawerLabel: 'Digitalizar Cupom',
          title: 'Cupom Fiscal',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="receipt" size={size} color={color} />
          ),
        }}
      />

      {/* QR Scanner */}
      <Drawer.Screen
        name="qr-scanner/index"
        options={{
          drawerLabel: 'Escanear Código',
          title: 'Código de Barras',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
          ),
        }}
      />

      {/* Purchase Comparison */}
      <Drawer.Screen
        name="comparacao/index"
        options={{
          drawerLabel: 'Comparação de Compras',
          title: 'Comparação',
          drawerIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="scale-balance" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
