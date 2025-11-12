import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
  });

  const handleUpdateProfile = async () => {
    if (!formData.nome || !formData.email) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        nome: formData.nome,
        telefone: formData.telefone || null,
      };
      await userService.updateProfile(updateData);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', error.response?.data?.message || error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header com Avatar */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user?.nome?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userBasicInfo}>
          <Text style={styles.userName}>{user?.nome || 'Usuário'}</Text>
          <Text style={styles.userRole}>
            {user?.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {!isEditing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Informações do Perfil */}
      {!isEditing ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📧 Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>

            {user?.telefone && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>📱 Telefone</Text>
                <Text style={styles.infoValue}>{user.telefone}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🔐 Papel</Text>
              <Text style={styles.infoValue}>
                {user?.role === 'admin' ? 'Administrador' : 'Usuário Comum'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editar Perfil</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={formData.nome}
              onChangeText={(text) =>
                setFormData({ ...formData, nome: text })
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              editable={false}
              value={formData.email}
            />
            <Text style={styles.helperText}>Email não pode ser alterado</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              value={formData.telefone}
              onChangeText={(text) =>
                setFormData({ ...formData, telefone: text })
              }
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setIsEditing(false)}
              disabled={loading}
            >
              <Text style={styles.buttonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Seção de Preferências */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.linkButtonIcon}>⚙️</Text>
          <View style={styles.linkButtonContent}>
            <Text style={styles.linkButtonText}>Configurações</Text>
            <Text style={styles.linkButtonSubtext}>Preferências e notificações</Text>
          </View>
          <Text style={styles.linkButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Seção de Segurança */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segurança</Text>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Alert.alert('Em desenvolvimento', 'Mudar senha - em desenvolvimento')}
        >
          <Text style={styles.linkButtonIcon}>🔒</Text>
          <View style={styles.linkButtonContent}>
            <Text style={styles.linkButtonText}>Mudar Senha</Text>
            <Text style={styles.linkButtonSubtext}>Altere sua senha de acesso</Text>
          </View>
          <Text style={styles.linkButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Seção de Ações */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleLogout}
        >
          <Text style={styles.dangerButtonIcon}>🚪</Text>
          <Text style={styles.dangerButtonText}>Sair da Conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerButton, styles.deleteButton]}
          onPress={() =>
            Alert.alert(
              'Deletar Conta',
              'Esta ação é irreversível. Tem certeza?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Deletar',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Em desenvolvimento', 'Deletar conta - em desenvolvimento');
                  },
                },
              ]
            )
          }
        >
          <Text style={styles.dangerButtonIcon}>🗑️</Text>
          <Text style={styles.dangerButtonText}>Deletar Conta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  headerSection: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C42',
  },
  userBasicInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 18,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e5d8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0e5d8',
    borderBottomWidth: 1,
    borderBottomColor: '#f0e5d8',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B4423',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C1810',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C1810',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0D5C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2C1810',
  },
  helperText: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#FF8C42',
  },
  buttonSecondary: {
    backgroundColor: '#F0E5D8',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonSecondaryText: {
    color: '#2C1810',
    fontWeight: '700',
    fontSize: 13,
  },
  linkButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  linkButtonIcon: {
    fontSize: 20,
  },
  linkButtonContent: {
    flex: 1,
  },
  linkButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 2,
  },
  linkButtonSubtext: {
    fontSize: 11,
    color: '#999',
  },
  linkButtonArrow: {
    fontSize: 16,
    color: '#FF8C42',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE5D8',
  },
  deleteButton: {
    borderColor: '#FFCDD2',
  },
  dangerButtonIcon: {
    fontSize: 18,
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B35',
  },
  spacer: {
    height: 30,
  },
});
