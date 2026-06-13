import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ModoAlimentarProvider } from '@/contexts/ModoAlimentarContext';
import { inicializarNotificacoes } from '@/services/notifications';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5A623', // amber[400]
  },
};

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isSignedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  useEffect(() => {
    if (isSignedIn) {
      inicializarNotificacoes();
    }
  }, [isSignedIn]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {isSignedIn ? (
        <Stack.Screen
          name="(app)"
          options={{
            gestureEnabled: false,
          }}
        />
      ) : (
        <Stack.Screen
          name="(auth)"
          options={{
            gestureEnabled: false,
          }}
        />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F5A623' }}>
      <SafeAreaProvider>
        <ThemeProvider value={AppTheme}>
          <AuthProvider>
            <ModoAlimentarProvider>
              <RootLayoutContent />
            </ModoAlimentarProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
