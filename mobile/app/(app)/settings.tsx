import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [location, setLocation] = useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notificações Push</Text>
              <Text style={styles.settingDescription}>Receba alertas importantes</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ddd', true: '#FFB3B3' }}
            thumbColor={notifications ? '#FF6B6B' : '#999'}
          />
        </View>
      </View>

      {/* Display Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aparência</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="weather-night" size={24} color="#333" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Modo Escuro</Text>
              <Text style={styles.settingDescription}>Use tema escuro</Text>
            </View>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#ddd', true: '#FFB3B3' }}
            thumbColor={darkMode ? '#FF6B6B' : '#999'}
          />
        </View>
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacidade</Text>

        <TouchableOpacity style={[styles.settingItem, { marginBottom: 0 }]}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Localização</Text>
              <Text style={styles.settingDescription}>Usar localização</Text>
            </View>
          </View>
          <Switch
            value={location}
            onValueChange={setLocation}
            trackColor={{ false: '#ddd', true: '#FFB3B3' }}
            thumbColor={location ? '#FF6B6B' : '#999'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="shield-outline" size={24} color="#333" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Dados Pessoais</Text>
              <Text style={styles.settingDescription}>Gerencie seus dados</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ddd" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#333" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Versão do App</Text>
              <Text style={styles.settingDescription}>v1.0.0</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#333" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Termos de Serviço</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ddd" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { marginBottom: 0 }]}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#333" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Política de Privacidade</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ddd" />
        </TouchableOpacity>
      </View>

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
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  spacing: {
    height: 20,
  },
});
