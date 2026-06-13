import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import { LogoIcon } from '@/components/CookmeLogo';

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não conferem');
      return;
    }
    if (name.trim().length < 3) {
      Alert.alert('Erro', 'O nome deve ter pelo menos 3 caracteres');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await registerUser(name, email, password);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <LogoIcon size={48} />
            <Text style={styles.logoText}>cookme<Text style={styles.logoDot}>.</Text></Text>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Junte-se à comunidade CookMe</Text>
          </View>

          <View style={styles.form}>
            {[
              { label: 'Nome', value: name, set: setName, placeholder: 'Seu nome completo', type: 'default' as const },
              { label: 'Email', value: email, set: setEmail, placeholder: 'seu@email.com', type: 'email-address' as const },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.ink[400]}
                  value={field.value}
                  onChangeText={field.set}
                  editable={!loading}
                  keyboardType={field.type}
                  autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                />
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Criar senha"
                  placeholderTextColor={C.ink[400]}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={C.ink[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Confirmar senha"
                  placeholderTextColor={C.ink[400]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                  <MaterialCommunityIcons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={C.ink[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Criando…' : 'Criar Conta'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  inner: { paddingHorizontal: 24, paddingVertical: 40, flexGrow: 1, justifyContent: 'space-between' },
  logoArea: { alignItems: 'center', marginBottom: 32, gap: 4 },
  logoText: { fontSize: 28, fontWeight: '800', color: C.green[600], letterSpacing: -0.5 },
  logoDot: { color: C.amber[500] },
  title: { ...T.h1, color: C.ink[900], marginTop: 4 },
  subtitle: { ...T.body, color: C.ink[500] },
  form: { gap: 18, marginBottom: 32 },
  inputGroup: { gap: 6 },
  label: { ...T.small, color: C.ink[700], fontWeight: '600' },
  input: {
    backgroundColor: C.ink[0],
    borderWidth: 1, borderColor: C.ink[200],
    borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: C.ink[900],
    ...shadows.sm,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.ink[0],
    borderWidth: 1, borderColor: C.ink[200],
    borderRadius: radius.md,
    ...shadows.sm,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: C.ink[900],
  },
  eyeBtn: {
    paddingHorizontal: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  button: {
    backgroundColor: C.green[500],
    paddingVertical: 16, borderRadius: radius.md,
    alignItems: 'center', marginTop: 4,
    ...shadows.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...T.body, color: C.ink[0], fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...T.body, color: C.ink[500] },
  link: { ...T.body, color: C.green[600], fontWeight: '700' },
});
