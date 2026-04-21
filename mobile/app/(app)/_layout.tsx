import { Stack } from 'expo-router';
import { colors as C } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.ink[50] },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="receita-ocr/index" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="validacao/index" options={{ headerShown: false }} />
      <Stack.Screen name="receitas-geradas/index" options={{ headerShown: false }} />
      <Stack.Screen name="listas/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="qr-scanner/index" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="comparacao/index" options={{ headerShown: false }} />
    </Stack>
  );
}
