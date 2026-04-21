import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('dev@cookme.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🍳</Text>
          </View>
          <Text style={styles.logoText}>cookme<Text style={styles.logoDot}>.</Text></Text>
          <Text style={styles.logoTagline}>Sua despensa inteligente</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={C.ink[400]}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor={C.ink[400]}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Entrando…' : 'Entrar'}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>Criar agora</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingVertical: 40 },
  logoArea: { alignItems: 'center', marginTop: 20, gap: 8 },
  logoIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200],
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  logoEmoji: { fontSize: 36 },
  logoText: {
    fontSize: 32, fontWeight: '800', color: C.green[600], letterSpacing: -0.5,
  },
  logoDot: { color: C.amber[500] },
  logoTagline: { ...T.small, color: C.ink[500] },
  form: { gap: 20, marginBottom: 32 },
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
  button: {
    backgroundColor: C.green[500],
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 4,
    ...shadows.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...T.body, color: C.ink[0], fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...T.body, color: C.ink[500] },
  link: { ...T.body, color: C.green[600], fontWeight: '700' },
});
