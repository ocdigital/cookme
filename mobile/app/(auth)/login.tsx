import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import { CookmeLogo } from '@/components/CookmeLogo';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple, isAppleAvailable, isGoogleAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, rememberMe);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (error.message !== 'cancel') {
        Alert.alert('Erro', error.message || 'Falha ao entrar com Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      await loginWithApple();
    } catch (error: any) {
      if ((error as any).code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Erro', error.message || 'Falha ao entrar com Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <CookmeLogo iconSize={64} textSize={32} showTagline tagline="Sua despensa inteligente" />
          </View>

          <View style={styles.body}>
            {/* Social Buttons */}
            <View style={styles.socialGroup}>
              {isGoogleAvailable && (
              <TouchableOpacity
                style={[styles.socialBtn, styles.googleBtn, loading && styles.btnDisabled]}
                onPress={handleGoogle}
                disabled={loading}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Continuar com Google</Text>
              </TouchableOpacity>
              )}

              {isAppleAvailable && (
                <TouchableOpacity
                  style={[styles.socialBtn, styles.appleBtn, loading && styles.btnDisabled]}
                  onPress={handleApple}
                  disabled={loading}
                >
                  <Text style={styles.appleIcon}></Text>
                  <Text style={styles.appleText}>Continuar com Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou entre com email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Form */}
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
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Sua senha"
                    placeholderTextColor={C.ink[400]}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
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

              <View style={styles.rememberForgotRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(v => !v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Manter logado</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(auth)/esqueci-senha' as any)}>
                  <Text style={styles.forgotText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Entrando…' : 'Entrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.link}>Criar agora</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  inner: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingVertical: 40 },
  logoArea: { alignItems: 'center', marginTop: 20 },

  body: { gap: 24 },

  socialGroup: { gap: 12 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: radius.md, gap: 10,
    ...shadows.sm,
  },
  googleBtn: { backgroundColor: C.ink[0], borderWidth: 1, borderColor: C.ink[200] },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { ...T.body, fontWeight: '600', color: C.ink[800] },
  appleBtn: { backgroundColor: C.ink[900] },
  appleIcon: { fontSize: 18, color: C.ink[0] },
  appleText: { ...T.body, fontWeight: '600', color: C.ink[0] },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.ink[200] },
  dividerText: { ...T.small, color: C.ink[400] },

  form: { gap: 16 },
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
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rememberForgotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  forgotText: { color: C.green[600], fontSize: 13, fontWeight: '600' },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 2, borderColor: C.ink[300],
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.green[500], borderColor: C.green[500] },
  checkmark: { color: C.ink[0], fontSize: 12, fontWeight: '800', lineHeight: 14 },
  rememberText: { ...T.small, color: C.ink[600], fontWeight: '500' },

  button: {
    backgroundColor: C.green[500], paddingVertical: 16,
    borderRadius: radius.md, alignItems: 'center', marginTop: 4, ...shadows.md,
  },
  btnDisabled: { opacity: 0.6 },
  buttonText: { ...T.body, color: C.ink[0], fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...T.body, color: C.ink[500] },
  link: { ...T.body, color: C.green[600], fontWeight: '700' },
});
