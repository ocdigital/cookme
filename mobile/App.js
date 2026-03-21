import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, View } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { CustomTabBar } from './src/components/CustomTabBar';
import { colors } from './src/theme/colors';

// Global error handler
if (!global.onError) {
  global.onError = (error) => {
    console.error('GLOBAL ERROR:', error);
  };
}

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreenRecipes from './src/screens/HomeScreenRecipes';
import InventoryScreen from './src/screens/InventoryScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import ReceiptPhotoScreen from './src/screens/ReceiptPhotoScreen';
import ReceiptMultiPhotoScreen from './src/screens/ReceiptMultiPhotoScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import CaptchaScreen from './src/screens/CaptchaScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import PurchaseDetailsScreen from './src/screens/PurchaseDetailsScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import RecipesListScreen from './src/screens/RecipesListScreen';
import RecipeDetailsScreen from './src/screens/RecipeDetailsScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.error('ERROR BOUNDARY CAUGHT:', error);
    console.error('Stack:', error.stack);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error details:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Erro na Aplicação</Text>
          <Text style={{ fontSize: 14, color: 'red', marginBottom: 10 }}>
            {this.state.error?.message}
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {this.state.error?.stack}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Função para criar o BottomTabNavigator com as screens principais
function MainAppTabs({ navigation }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ navigation: tabNavigation }) => ({
        headerStyle: {
          backgroundColor: colors.background.main,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: colors.text.primary,
        },
        headerLeft: () => null,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => tabNavigation.navigate('Profile')}
            style={{ marginRight: 16, padding: 5 }}
            activeOpacity={0.6}
          >
            <FeatherIcon
              name="user"
              size={20}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenRecipes}
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
        }}
      />
      <Tab.Screen
        name="Categorias"
        component={RecipesListScreen}
        options={{
          title: 'Categorias',
          tabBarLabel: 'Categorias',
        }}
      />
      <Tab.Screen
        name="Pesquisa"
        component={InventoryScreen}
        options={{
          title: 'Pesquisa',
          tabBarLabel: 'Pesquisa',
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favoritas',
          tabBarLabel: 'Favoritos',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
          <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Criar Conta' }}
          />
          <Stack.Screen
            name="MainApp"
            component={MainAppTabs}
            options={{ headerShown: false }}
          />
          {/* Detail Screens (que aparecem por cima do drawer) */}
          <Stack.Screen
            name="Processing"
            component={ProcessingScreen}
            options={{
              title: 'Processando Cupom',
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="Captcha"
            component={CaptchaScreen}
            options={{
              title: 'Resolver CAPTCHA',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{
              title: 'Resultado',
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="PurchaseDetails"
            component={PurchaseDetailsScreen}
            options={{ title: 'Detalhes da Compra' }}
          />
          <Stack.Screen
            name="RecipeDetails"
            component={RecipeDetailsScreen}
            options={{ title: 'Detalhes da Receita' }}
          />
          <Stack.Screen
            name="Products"
            component={ProductsScreen}
            options={{ title: 'Produtos' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Meu Perfil' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Configurações' }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{ title: 'Scanner de QR' }}
          />
          <Stack.Screen
            name="ReceiptPhoto"
            component={ReceiptPhotoScreen}
            options={{ title: 'Foto do Cupom' }}
          />
          <Stack.Screen
            name="ReceiptMultiPhoto"
            component={ReceiptMultiPhotoScreen}
            options={{ title: 'Capturar Cupom' }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'Histórico' }}
          />
        </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ErrorBoundary>
  );
}
