import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';

export default function TabsLayout() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <Stack
      screenOptions={{
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
        headerLeft: () => (
          <TouchableOpacity
            style={{ paddingLeft: 16 }}
            onPress={() => navigation.toggleDrawer()}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#333" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Inventário - Home */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Inventário',
        }}
      />
    </Stack>
  );
}
