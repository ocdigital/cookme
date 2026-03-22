import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
// import { useAuth } from '@/hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  // const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={60} color="#FF6B6B" />
        </View>
        <Text style={styles.name}>{'Usuário'}</Text>
        <Text style={styles.email}>{'user@email.com'}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Notificações</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ddd" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="heart-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Meus Favoritos</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ddd" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="history" size={24} color="#333" />
          <Text style={styles.menuText}>Histórico de Compras</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ddd" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="lock-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Privacidade</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ddd" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => console.log("logout")}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff3f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3f1',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  spacing: {
    height: 20,
  },
});
