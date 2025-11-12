import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    notificacoes_habilitadas: true,
    horario_notificacoes: '08:00',
    tags_dieta: [],
    restricoes_alimentares: [],
    numero_pessoas: 1,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await userService.getPreferences();
      if (data) {
        setPreferences({
          notificacoes_habilitadas: data.notificacoes_habilitadas ?? true,
          horario_notificacoes: data.horario_notificacoes || '08:00',
          tags_dieta: data.tags_dieta || [],
          restricoes_alimentares: data.restricoes_alimentares || [],
          numero_pessoas: data.numero_pessoas || 1,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      // Mantém preferências padrão se houver erro
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (updatedPrefs) => {
    try {
      setLoading(true);
      await userService.updatePreferences(updatedPrefs);
      setPreferences(updatedPrefs);
      Alert.alert('Sucesso', 'Preferências atualizadas');
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      Alert.alert('Erro', error.response?.data?.message || error.message || 'Erro ao atualizar preferências');
      // Reverte as alterações em caso de erro
      await loadPreferences();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = (value) => {
    handleUpdatePreferences({
      ...preferences,
      notificacoes_habilitadas: value,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
          <Text style={styles.loadingText}>Carregando preferências...</Text>
        </View>
      ) : (
        <>
          {/* Notificações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Notificações</Text>

            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Habilitar Notificações</Text>
                  <Text style={styles.settingSubtext}>
                    Receba alertas sobre receitas e produtos
                  </Text>
                </View>
                <Switch
                  value={preferences.notificacoes_habilitadas}
                  onValueChange={handleToggleNotifications}
                  disabled={loading}
                  trackColor={{ false: '#E0D5C8', true: '#FFB996' }}
                  thumbColor={
                    preferences.notificacoes_habilitadas
                      ? '#FF8C42'
                      : '#999'
                  }
                />
              </View>

              {preferences.notificacoes_habilitadas && (
                <View style={[styles.settingRow, styles.settingRowBorder]}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Horário de Notificações</Text>
                    <Text style={styles.settingValue}>
                      {preferences.horario_notificacoes}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Em desenvolvimento', 'Seleção de horário')
                    }
                  >
                    <Text style={styles.settingIcon}>⏰</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Preferências de Receitas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍳 Preferências de Receitas</Text>

            <View style={styles.settingCard}>
              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Tags de Dieta</Text>
                  <Text style={styles.settingSubtext}>
                    Vegana, Vegetariana, Low-Carb, etc.
                  </Text>
                </View>
                <Text style={styles.settingIcon}>→</Text>
              </TouchableOpacity>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    Número de Pessoas
                  </Text>
                  <Text style={styles.settingValue}>
                    {preferences.numero_pessoas} pessoa
                    {preferences.numero_pessoas !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.numberSelector}>
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdatePreferences({
                        ...preferences,
                        numero_pessoas: Math.max(1, preferences.numero_pessoas - 1),
                      })
                    }
                  >
                    <Text style={styles.numberButton}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.numberValue}>
                    {preferences.numero_pessoas}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdatePreferences({
                        ...preferences,
                        numero_pessoas: preferences.numero_pessoas + 1,
                      })
                    }
                  >
                    <Text style={styles.numberButton}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Restrições Alimentares</Text>
                  <Text style={styles.settingSubtext}>
                    Alergia, Intolerância, etc.
                  </Text>
                </View>
                <Text style={styles.settingIcon}>→</Text>
              </View>
            </View>
          </View>

          {/* Informações da Aplicação */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Sobre</Text>

            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Versão da App</Text>
                  <Text style={styles.settingValue}>1.0.0</Text>
                </View>
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Política de Privacidade</Text>
                  <Text style={styles.settingSubtext}>
                    Leia nossos termos e condições
                  </Text>
                </View>
                <Text style={styles.settingIcon}>→</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Entre em Contato</Text>
                  <Text style={styles.settingSubtext}>
                    support@cookme.com
                  </Text>
                </View>
                <Text style={styles.settingIcon}>→</Text>
              </View>
            </View>
          </View>

          {/* Cache e Dados */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 Armazenamento</Text>

            <TouchableOpacity
              style={[styles.settingCard, styles.buttonCard]}
              onPress={() =>
                Alert.alert(
                  'Limpar Cache',
                  'Isso limpará dados em cache local',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Limpar',
                      style: 'destructive',
                      onPress: () =>
                        Alert.alert('Sucesso', 'Cache limpo com sucesso'),
                    },
                  ]
                )
              }
            >
              <Text style={styles.buttonText}>Limpar Cache da Aplicação</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
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
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0e5d8',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C1810',
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 11,
    color: '#999',
  },
  settingValue: {
    fontSize: 12,
    color: '#FF8C42',
    fontWeight: '600',
    marginTop: 4,
  },
  settingIcon: {
    fontSize: 16,
    color: '#FF8C42',
    fontWeight: '600',
  },
  numberSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  numberButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C42',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  numberValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C1810',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  spacer: {
    height: 50,
  },
});
