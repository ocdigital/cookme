import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, label, description, value, onToggle, onPress, last }: {
  icon: string; label: string; description?: string;
  value?: boolean; onToggle?: (v: boolean) => void; onPress?: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon as any} size={18} color={C.green[600]} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      {onToggle !== undefined ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: C.ink[200], true: C.green[400] }}
          thumbColor={value ? C.green[600] : C.ink[400]}
        />
      ) : onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [location, setLocation] = useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Section title="Notificações">
        <SettingRow
          icon="bell-outline" label="Notificações Push"
          description="Receba alertas importantes"
          value={notifications} onToggle={setNotifications} last
        />
      </Section>

      <Section title="Aparência">
        <SettingRow
          icon="weather-night" label="Modo Escuro"
          description="Use tema escuro"
          value={darkMode} onToggle={setDarkMode} last
        />
      </Section>

      <Section title="Privacidade">
        <SettingRow
          icon="map-marker-outline" label="Localização"
          description="Usar localização"
          value={location} onToggle={setLocation}
        />
        <SettingRow icon="shield-outline" label="Dados Pessoais" description="Gerencie seus dados" onPress={() => {}} last />
      </Section>

      <Section title="Sobre">
        <SettingRow icon="information-outline" label="Versão do App" description="v1.0.0" />
        <SettingRow icon="file-document-outline" label="Termos de Serviço" onPress={() => {}} />
        <SettingRow icon="lock-outline" label="Política de Privacidade" onPress={() => {}} last />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  section: { gap: 0 },
  sectionTitle: {
    ...T.micro, color: C.ink[400],
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 6, marginLeft: 4,
  },
  sectionBody: {
    backgroundColor: C.ink[0],
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150],
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.ink[150] },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { ...T.body, color: C.ink[800], fontWeight: '600' },
  rowDesc: { ...T.small, color: C.ink[400], marginTop: 1 },
});
