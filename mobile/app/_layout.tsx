import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ModoAlimentarProvider } from '@/contexts/ModoAlimentarContext';
import { inicializarNotificacoes } from '@/services/notifications';
import * as Sentry from '@sentry/react-native';
import { QueryProvider } from '@/providers/QueryProvider';
import { NetworkProvider } from '@/providers/NetworkProvider';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useMutationQueueSync } from '@/hooks/useOfflineMutation';

Sentry.init({
  dsn: 'https://45db6b759cff9374c6e76b2e9c585d3c@o4504663060578304.ingest.us.sentry.io/4511559245758464',
  debug: false,
  environment: process.env.EXPO_PUBLIC_ENV || 'development',
  tracesSampleRate: 0.2,
});

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
  // Processa fila de mutações offline quando reconectar
  useMutationQueueSync();

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
        <QueryProvider>
          <NetworkProvider>
            <ThemeProvider value={AppTheme}>
              <AuthProvider>
                <ModoAlimentarProvider>
                  <RootLayoutContent />
                  <OfflineBanner />
                </ModoAlimentarProvider>
              </AuthProvider>
            </ThemeProvider>
          </NetworkProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
