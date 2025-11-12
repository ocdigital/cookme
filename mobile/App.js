import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/contexts/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreenRecipes from './src/screens/HomeScreenRecipes';
import InventoryScreen from './src/screens/InventoryScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import CaptchaScreen from './src/screens/CaptchaScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import PurchaseDetailsScreen from './src/screens/PurchaseDetailsScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import RecipesListScreen from './src/screens/RecipesListScreen';
import RecipeDetailsScreen from './src/screens/RecipeDetailsScreen';
import ProductsScreen from './src/screens/ProductsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
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
            name="Home"
            component={HomeScreenRecipes}
            options={{
              title: 'CookMe',
              headerLeft: () => null, // Remove back button
            }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{ title: 'Escanear Cupom' }}
          />
          <Stack.Screen
            name="Processing"
            component={ProcessingScreen}
            options={{
              title: 'Processando Cupom',
              headerLeft: () => null, // Prevent going back
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
            name="History"
            component={HistoryScreen}
            options={{ title: 'Histórico de Consultas' }}
          />
          <Stack.Screen
            name="PurchaseDetails"
            component={PurchaseDetailsScreen}
            options={{ title: 'Detalhes da Compra' }}
          />
          <Stack.Screen
            name="Recipes"
            component={RecipesScreen}
            options={{
              title: 'Receitas',
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="RecipesList"
            component={RecipesListScreen}
            options={{ title: 'Receitas' }}
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
            name="Inventory"
            component={InventoryScreen}
            options={{ title: 'Meu Inventário' }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ title: 'Minhas Favoritas' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
