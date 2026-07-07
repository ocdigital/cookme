import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { colors as C, radius, typography as T } from '@/constants/theme';

/**
 * Esqueci minha senha — 2 passos na mesma tela:
 * 1. e-mail → backend envia código de 6 dígitos (sempre responde 200)
 * 2. código + nova senha → redefine e volta ao login
 */
export default function EsqueciSenhaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [passo, setPasso] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const enviarCodigo = async () => {
    if (!email.trim()) {
      Alert.alert('Ops', 'Digite seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/esqueci-senha', { email: email.trim().toLowerCase() });
      setPasso(2);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const redefinir = async () => {
    if (codigo.length !== 6) {
      Alert.alert('Ops', 'O código tem 6 dígitos.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Ops', 'A nova senha precisa de pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/redefinir-senha', {
        email: email.trim().toLowerCase(),
        codigo,
        nova_senha: novaSenha,
      });
      Alert.alert('Pronto! 🎉', 'Senha redefinida. Entre com a nova senha.', [
        { text: 'Fazer login', onPress: () => router.replace('/(auth)/login' as any) },
      ]);
    } catch (e: any) {
      Alert.alert(
        'Não deu certo',
        e?.response?.data?.message || 'Código inválido ou expirado. Solicite um novo.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.ink[0] }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}>
        <TouchableOpacity onPress={() => (passo === 2 ? setPasso(1) : router.back())} style={styles.voltar}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink[700]} />
        </TouchableOpacity>

        <MaterialCommunityIcons name="lock-reset" size={48} color={C.green[600]} style={{ alignSelf: 'center' }} />
        <Text style={styles.titulo}>Esqueceu a senha?</Text>

        {passo === 1 ? (
          <>
            <Text style={styles.sub}>
              Digite seu e-mail e enviaremos um código de 6 dígitos para redefinir sua senha.
            </Text>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={C.ink[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              autoFocus
            />
            <TouchableOpacity style={[styles.botao, loading && styles.botaoOff]} onPress={enviarCodigo} disabled={loading}>
              {loading ? <ActivityIndicator color={C.ink[0]} /> : <Text style={styles.botaoTxt}>Enviar código</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.sub}>
              Enviamos um código para <Text style={{ fontWeight: '700' }}>{email}</Text>.{'\n'}
              Confira sua caixa de entrada (e o spam).
            </Text>
            <Text style={styles.label}>Código de 6 dígitos</Text>
            <TextInput
              style={[styles.input, styles.inputCodigo]}
              placeholder="000000"
              placeholderTextColor={C.ink[300]}
              value={codigo}
              onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              autoFocus
            />
            <Text style={styles.label}>Nova senha</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={C.ink[400]}
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry={!mostrarSenha}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setMostrarSenha(v => !v)} style={{ padding: 10 }}>
                <MaterialCommunityIcons
                  name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={C.ink[400]}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.botao, loading && styles.botaoOff]} onPress={redefinir} disabled={loading}>
              {loading ? <ActivityIndicator color={C.ink[0]} /> : <Text style={styles.botaoTxt}>Redefinir senha</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={enviarCodigo} disabled={loading} style={{ padding: 12 }}>
              <Text style={styles.reenviar}>Não recebeu? Reenviar código</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 4 },
  voltar: { marginBottom: 16, width: 40 },
  titulo: { ...T.h2, color: C.ink[900], textAlign: 'center', marginVertical: 12 },
  sub: { ...T.body, color: C.ink[600], textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  label: { ...T.small, color: C.ink[700], fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: C.ink[200], borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.ink[900], marginBottom: 8,
  },
  inputCodigo: { textAlign: 'center', fontSize: 28, letterSpacing: 12, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: C.ink[200], borderRadius: radius.md, marginBottom: 8,
  },
  botao: {
    backgroundColor: C.green[600], borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  botaoOff: { opacity: 0.6 },
  botaoTxt: { ...T.body, color: C.ink[0], fontWeight: '700' },
  reenviar: { ...T.small, color: C.green[600], textAlign: 'center', fontWeight: '600' },
});
