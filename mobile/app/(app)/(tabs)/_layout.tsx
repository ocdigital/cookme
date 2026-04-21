import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C } from '@/constants/theme';

export default function TabsLayout() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: C.ink[0] },
        headerShadowVisible: false,
        headerTintColor: C.ink[800],
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: C.ink[900] },
        headerLeft: () => (
          <TouchableOpacity
            style={{ paddingLeft: 16 }}
            onPress={() => navigation.toggleDrawer()}
          >
            <MaterialCommunityIcons name="menu" size={24} color={C.ink[700]} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
