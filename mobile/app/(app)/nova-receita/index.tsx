import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

interface Ingrediente {
  nome: string;
  quantidade: string;
  unidade: string;
  a_gosto: boolean;
}

const DIFICULDADES = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
];

const CATEGORIAS = [
  { value: 'cafe_da_manha', label: 'Café da manhã' },
  { value: 'almoco', label: 'Almoço' },
  { value: 'jantar', label: 'Jantar' },
  { value: 'lanche', label: 'Lanche' },
  { value: 'sobremesa', label: 'Sobremesa' },
  { value: 'bebida', label: 'Bebida' },
];

const UNIDADES = ['g', 'kg', 'ml', 'L', 'xícara', 'colher de sopa', 'colher de chá', 'unidade', 'fatia', 'pitada'];

export default function NovaReceitaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tempoPreparo, setTempoPreparo] = useState('');
  const [dificuldade, setDificuldade] = useState('media');
  const [rendimento, setRendimento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { nome: '', quantidade: '', unidade: 'g', a_gosto: false },
  ]);
  const [salvando, setSalvando] = useState(false);

  const adicionarIngrediente = () => {
    setIngredientes([...ingredientes, { nome: '', quantidade: '', unidade: 'g', a_gosto: false }]);
  };

  const removerIngrediente = (idx: number) => {
    if (ingredientes.length === 1) return;
    setIngredientes(ingredientes.filter((_, i) => i !== idx));
  };

  const atualizarIngrediente = (idx: number, campo: keyof Ingrediente, valor: string | boolean) => {
    setIngredientes(ingredientes.map((ing, i) =>
      i === idx ? { ...ing, [campo]: valor } : ing
    ));
  };

  const proximaUnidade = (atual: string) => {
    const idx = UNIDADES.indexOf(atual);
    return UNIDADES[(idx + 1) % UNIDADES.length];
  };

  const validar = () => {
    if (!titulo.trim()) { Alert.alert('Campo obrigatório', 'Informe o título da receita.'); return false; }
    if (!modoPreparo.trim()) { Alert.alert('Campo obrigatório', 'Descreva o modo de preparo.'); return false; }
    const ingValidos = ingredientes.filter(i => i.nome.trim());
    if (ingValidos.length === 0) { Alert.alert('Campo obrigatório', 'Adicione pelo menos um ingrediente.'); return false; }
    return true;
  };

  const salvar = async () => {
    if (!validar()) return;
    setSalvando(true);
    try {
      const ingValidos = ingredientes
        .filter(i => i.nome.trim())
        .map(i => ({
          nome: i.nome.trim(),
          quantidade: i.a_gosto ? undefined : i.quantidade || undefined,
          unidade: i.a_gosto ? undefined : i.unidade || undefined,
          a_gosto: i.a_gosto,
        }));

      await api.post('/receitas/minhas', {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        tempo_preparo: tempoPreparo ? parseInt(tempoPreparo) : undefined,
        dificuldade,
        rendimento_porcoes: rendimento ? parseInt(rendimento) : undefined,
        categoria_receita: categoria || undefined,
        modo_preparo: modoPreparo.trim(),
        ingredientes: ingValidos,
      });

      Alert.alert(
        'Receita enviada!',
        'Sua receita foi enviada para revisão e ficará disponível após aprovação.',
        [{ text: 'Ok', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a receita. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Compartilhar</Text>
          <Text style={styles.headerTitle}>Nova Receita</Text>
        </View>
        <TouchableOpacity
          style={[styles.salvarBtn, salvando && { opacity: 0.6 }]}
          onPress={salvar}
          disabled={salvando}
        >
          {salvando
            ? <ActivityIndicator size="small" color={C.ink[0]} />
            : <Text style={styles.salvarTxt}>Enviar</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Aviso moderação */}
          <View style={styles.avisoCard}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={C.amber[600]} />
            <Text style={styles.avisoTxt}>Sua receita passará por revisão antes de ser publicada.</Text>
          </View>

          {/* Informações básicas */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Informações básicas</Text>

            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ex: Bolo de cenoura com cobertura"
              placeholderTextColor={C.ink[300]}
              maxLength={80}
            />

            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva brevemente a receita..."
              placeholderTextColor={C.ink[300]}
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Tempo (min)</Text>
                <TextInput
                  style={styles.input}
                  value={tempoPreparo}
                  onChangeText={setTempoPreparo}
                  placeholder="45"
                  placeholderTextColor={C.ink[300]}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Porções</Text>
                <TextInput
                  style={styles.input}
                  value={rendimento}
                  onChangeText={setRendimento}
                  placeholder="4"
                  placeholderTextColor={C.ink[300]}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

          {/* Dificuldade */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Dificuldade</Text>
            <View style={styles.chipRow}>
              {DIFICULDADES.map(d => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, dificuldade === d.value && styles.chipAtivo]}
                  onPress={() => setDificuldade(d.value)}
                >
                  <Text style={[styles.chipTxt, dificuldade === d.value && styles.chipTxtAtivo]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Categoria */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Categoria</Text>
            <View style={styles.chipRow}>
              {CATEGORIAS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.chip, categoria === c.value && styles.chipAtivo]}
                  onPress={() => setCategoria(prev => prev === c.value ? '' : c.value)}
                >
                  <Text style={[styles.chipTxt, categoria === c.value && styles.chipTxtAtivo]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ingredientes */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Ingredientes *</Text>

            {ingredientes.map((ing, idx) => (
              <View key={idx} style={styles.ingRow}>
                <View style={styles.ingInputs}>
                  <TextInput
                    style={[styles.input, styles.ingNome]}
                    value={ing.nome}
                    onChangeText={v => atualizarIngrediente(idx, 'nome', v)}
                    placeholder="Ingrediente"
                    placeholderTextColor={C.ink[300]}
                  />
                  {!ing.a_gosto && (
                    <View style={styles.ingQtd}>
                      <TextInput
                        style={[styles.input, styles.ingQtdInput]}
                        value={ing.quantidade}
                        onChangeText={v => atualizarIngrediente(idx, 'quantidade', v)}
                        placeholder="Qtd"
                        placeholderTextColor={C.ink[300]}
                        keyboardType="decimal-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity
                        style={styles.unidadeBtn}
                        onPress={() => atualizarIngrediente(idx, 'unidade', proximaUnidade(ing.unidade))}
                      >
                        <Text style={styles.unidadeTxt} numberOfLines={1}>{ing.unidade}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <View style={styles.ingAcoes}>
                  <TouchableOpacity
                    style={[styles.aGostoBtn, ing.a_gosto && styles.aGostoBtnAtivo]}
                    onPress={() => atualizarIngrediente(idx, 'a_gosto', !ing.a_gosto)}
                  >
                    <Text style={[styles.aGostoTxt, ing.a_gosto && styles.aGostoTxtAtivo]}>a gosto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removerBtn}
                    onPress={() => removerIngrediente(idx)}
                    disabled={ingredientes.length === 1}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color={ingredientes.length === 1 ? C.ink[200] : C.ink[400]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addIngBtn} onPress={adicionarIngrediente}>
              <MaterialCommunityIcons name="plus" size={16} color={C.green[600]} />
              <Text style={styles.addIngTxt}>Adicionar ingrediente</Text>
            </TouchableOpacity>
          </View>

          {/* Modo de preparo */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Modo de preparo *</Text>
            <TextInput
              style={[styles.input, styles.inputPreparo]}
              value={modoPreparo}
              onChangeText={setModoPreparo}
              placeholder="Descreva o passo a passo da receita..."
              placeholderTextColor={C.ink[300]}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },
  salvarBtn: {
    backgroundColor: C.green[500], paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.md, minWidth: 70, alignItems: 'center',
  },
  salvarTxt: { ...T.small, color: C.ink[0], fontWeight: '700' },

  content: { padding: 16, gap: 14 },

  avisoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.amber[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.amber[200], padding: 12,
  },
  avisoTxt: { ...T.small, color: C.amber[700], flex: 1, lineHeight: 18 },

  card: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
    padding: 16, gap: 10,
  },
  cardLabel: {
    ...T.small, fontWeight: '700', color: C.ink[500],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  fieldLabel: { ...T.small, color: C.ink[600], fontWeight: '600', marginBottom: -4 },

  input: {
    backgroundColor: C.ink[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.ink[150],
    paddingHorizontal: 12, paddingVertical: 10,
    ...T.body, color: C.ink[900],
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  inputPreparo: { minHeight: 160, textAlignVertical: 'top' },

  row2: { flexDirection: 'row', gap: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: C.ink[200], backgroundColor: C.ink[0],
  },
  chipAtivo: { backgroundColor: C.green[500], borderColor: C.green[500] },
  chipTxt: { ...T.small, color: C.ink[600], fontWeight: '600' },
  chipTxtAtivo: { color: C.ink[0] },

  ingRow: { gap: 6 },
  ingInputs: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ingNome: { flex: 1 },
  ingQtd: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ingQtdInput: { width: 56, textAlign: 'center' },
  unidadeBtn: {
    backgroundColor: C.green[50], borderRadius: radius.sm,
    borderWidth: 1, borderColor: C.green[200],
    paddingHorizontal: 8, paddingVertical: 10, minWidth: 56, alignItems: 'center',
  },
  unidadeTxt: { ...T.micro, color: C.green[700], fontWeight: '700' },
  ingAcoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aGostoBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    borderWidth: 1, borderColor: C.ink[200], backgroundColor: C.ink[0],
  },
  aGostoBtnAtivo: { backgroundColor: C.amber[100], borderColor: C.amber[400] },
  aGostoTxt: { fontSize: 11, color: C.ink[500], fontWeight: '600' },
  aGostoTxtAtivo: { color: C.amber[700] },
  removerBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },

  addIngBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, justifyContent: 'center',
    borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    borderRadius: radius.md, backgroundColor: C.green[50],
  },
  addIngTxt: { ...T.small, color: C.green[600], fontWeight: '700' },
});
