import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Image, Alert, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { useModoAlimentar } from '@/contexts/ModoAlimentarContext';
import { useRecipeGenerator } from '@/hooks/useRecipeGenerator';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenTutorial from '@/components/ScreenTutorial';
import { useScreenTutorial } from '@/hooks/useScreenTutorial';

// ─── tipos ───────────────────────────────────────────────────────────────────

interface IngredienteProduto {
  nome: string;        // nome_display limpo: "Sal", "Ovo", "Manteiga"
  produto_id: string | null;
}

type ModoAlimentar = 'normal' | 'fitness' | 'vegetariano' | 'vegano';

const MODO_INFO: Record<ModoAlimentar, { icon: string; label: string; cor: string }> = {
  normal:      { icon: 'food-variant',   label: 'Todas as receitas',        cor: '' },
  fitness:     { icon: 'dumbbell',       label: 'Modo Fitness',             cor: '#6366f1' },
  vegetariano: { icon: 'leaf',           label: 'Modo Vegetariano',         cor: '#16a34a' },
  vegano:      { icon: 'sprout',         label: 'Modo Vegano',              cor: '#16a34a' },
};

interface QuaseReceita {
  id: string;
  nome: string;
  cobertura_pct: number;
  faltando: string[];
  n_faltando: number;
  mensagem: string;
  imagem_url?: string;
  tem_protagonista: boolean;
}

interface ReceitaDisponivel {
  id: string;
  titulo: string;
  descricao: string;
  tempo_preparo: string;
  dificuldade: string;
  ingredientes: string[];
  ingredientes_produtos: IngredienteProduto[];
  modo_preparo: string;
  rendimento: string;
  imagem_url?: string;
  is_nova?: boolean;
  cobertura: number;
  disponivel: boolean;
  tem_protagonista: boolean;
  faltando: string[];
  vezes_executada: number;
  usa_vencendo?: string[];
  tags_dieta?: string[];
}

// ─── extração de ingrediente (igual despensa) ─────────────────────────────────

const INGREDIENTES_COMPOSTOS = new Set([
  'farinha trigo','farinha mandioca','farinha milho','farinha aveia',
  'óleo soja','oleo soja','leite coco','leite condensado','creme leite',
  'molho tomate','extrato tomate','feijão preto','feijão carioca',
  'arroz integral','batata doce','batata palha','carne moída','carne bovina',
  'peito frango','coxa frango','queijo mussarela','queijo parmesão','queijo meia',
]);

function extrairIngrediente(nomeProduto: string): string {
  let nome = nomeProduto
    .replace(/^\d+\s+/g, '')
    .replace(/\b\d+\s*(kg|g|ml|l|un|gr)\b/gi, '')
    .replace(/\bde\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim().toLowerCase();
  const palavras = nome.split(/\s+/).filter(p => p.length > 1);
  if (!palavras.length) return '';
  const duas = palavras.slice(0, 2).join(' ');
  return INGREDIENTES_COMPOSTOS.has(duas) ? duas : palavras[0];
}

// Limpa strings de ingrediente de receita para exibição humana
// "1/2 xicara de leite de coco" → "leite de coco"
// "3 dentes de alho inteiros (com casca)" → "alho"
// "2 batatas doces medias" → "batata doce"
function limparIngrediente(texto: string): string {
  let s = texto
    .toLowerCase()
    .replace(/\(.*?\)/g, '')                                   // remove parênteses e conteúdo
    .replace(/^\d[\d\/\s]*/g, '')                              // remove número/fração no início: "1/2 ", "2 "
    .replace(/\b\d+\s*(kg|g|ml|l|xicara[s]?|colher[es]*\s*(de\s*(sopa|cha))?|dente[s]?|unidade[s]?|pitada[s]?|folha[s]?|fio[s]?|ramo[s]?)\b/gi, '') // medidas
    .replace(/\b(pequen[oa]s?|medi[oa]s?|grande[s]?|frescas?|cozid[oa]s?|picad[oa]s?|amassad[oa]s?|inteiros?|fatiado[s]?|ralad[oa]s?|em\s+\w+)\b/gi, '') // adjetivos/prep
    .replace(/\ba\s+gosto\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Extrai o núcleo do ingrediente: remove preposições iniciais
  s = s.replace(/^(de|da|do|com|e)\s+/i, '').trim();

  // Capitaliza primeira letra
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── tela principal ──────────────────────────────────────────────────────────

export default function ReceitasScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const insets = useSafeAreaInsets();

  const { modoAlimentar, setModoAlimentar: setModoCtx } = useModoAlimentar();
  const [receitas, setReceitas] = useState<ReceitaDisponivel[]>([]);
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [totalIngredientes, setTotalIngredientes] = useState(0);
  const [ingredientesVencendo, setIngredientesVencendo] = useState<string[]>([]);
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
  const [quaseReceitas, setQuaseReceitas] = useState<QuaseReceita[]>([]);
  const [comprando, setComprando] = useState<string | null>(null);
  const { gerarReceitas } = useRecipeGenerator();
  const { showTutorial, dismissTutorial } = useScreenTutorial('receitas');

  // Sheet de ingredientes (compartilhado entre "Fiz essa!" e "Faltando")
  const [sheet, setSheet] = useState<{ receita: ReceitaDisponivel; modo: 'fiz' | 'faltando' } | null>(null);

  useFocusEffect(useCallback(() => { carregarReceitas(); carregarFavoritos(); carregarQuaseReceitas(); }, []));

  const carregarReceitas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/receitas/disponiveis');
      setReceitas(res.data.receitas || []);
      const modoApi = res.data.modo_alimentar as ModoAlimentar;
      if (modoApi) setModoCtx(modoApi);
      setTotalIngredientes(res.data.ingredientes_ativos || 0);
      setIngredientesVencendo(res.data.ingredientes_vencendo || []);
    } catch {
      // silencioso — pode ser inventário vazio
    } finally {
      setLoading(false);
    }
  };

  const carregarQuaseReceitas = async () => {
    try {
      const res = await api.get('/receitas/quase-possiveis');
      setQuaseReceitas(res.data?.receitas || []);
    } catch {
      // silencioso
    }
  };

  const carregarFavoritos = async () => {
    try {
      const res = await api.get('/receitas/favoritas');
      setFavoritosIds(new Set((res.data as { id: string }[]).map((r) => r.id)));
    } catch { /* silencioso */ }
  };

  const toggleFavorito = async (receitaId: string) => {
    // Optimistic update
    setFavoritosIds((prev) => {
      const next = new Set(prev);
      next.has(receitaId) ? next.delete(receitaId) : next.add(receitaId);
      return next;
    });
    try {
      await api.post(`/receitas/${receitaId}/favoritar`);
    } catch {
      // Reverter em caso de erro
      setFavoritosIds((prev) => {
        const next = new Set(prev);
        next.has(receitaId) ? next.delete(receitaId) : next.add(receitaId);
        return next;
      });
    }
  };

  const trocarModo = async (novoModo: ModoAlimentar) => {
    if (novoModo === modoAlimentar) return;
    setModoCtx(novoModo);
    try {
      await api.patch('/usuarios/preferencias', { modo_alimentar: novoModo });
      await carregarReceitas();
    } catch {
      setModoCtx(modoAlimentar); // reverter
    }
  };

  const handleGerar = async () => {
    try {
      setGerando(true);
      // Envia lista vazia — o backend busca os ingredientes do inventário do usuário
      // usando nome_display limpo e filtrando esgotados automaticamente
      // forcar_ia=true garante que a IA gera receitas novas com os ingredientes atuais
      await gerarReceitas([], true);
      await carregarReceitas();
    } catch {
      Alert.alert('Erro', 'Falha ao gerar receitas');
    } finally {
      setGerando(false);
    }
  };

  const comprarFaltando = async (receita: QuaseReceita) => {
    setComprando(receita.id);
    try {
      const res = await api.post(`/receitas/${receita.id}/comprar-faltando`);
      const data = res.data;
      Alert.alert(
        '🛒 Adicionado à lista!',
        `${data.ingredientes_adicionados} ingrediente(s) adicionado(s) à lista "${data.lista_titulo}"`,
        [{ text: 'Ótimo!' }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar à lista de compras');
    } finally {
      setComprando(null);
    }
  };

  const abrirFiz = async (receita: ReceitaDisponivel) => {
    try {
      await api.post(`/receitas/${receita.id}/executar`);
    } catch { /* silencioso — registra em background */ }
    setSheet({ receita, modo: 'fiz' });
  };

  const abrirFaltando = (receita: ReceitaDisponivel) => {
    setSheet({ receita, modo: 'faltando' });
  };

  const fecharSheet = async () => {
    setSheet(null);
    await carregarReceitas();
  };

  // Quase Lá! = tem protagonista (usuário JÁ TEM o ingrediente principal, faltam complementos)
  // Sugestão   = sem protagonista (inspiração de compra futura)
  const quasePossiveis  = quaseReceitas.filter(r => r.tem_protagonista);
  const sugestoesPrato  = quaseReceitas.filter(r => !r.tem_protagonista);

  const urgentes = receitas.filter(r => r.usa_vencendo && r.usa_vencendo.length > 0);
  const urgentesIds = new Set(urgentes.map(r => r.id));
  const disponiveis = receitas.filter(r => r.disponivel && !urgentesIds.has(r.id));
  const comProtagonista = receitas.filter(r => !r.disponivel && r.tem_protagonista && !urgentesIds.has(r.id));
  const parciais = receitas.filter(r => !r.disponivel && !r.tem_protagonista && !urgentesIds.has(r.id));
  const modoInfo = MODO_INFO[modoAlimentar];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={22} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>IA Culinária</Text>
          <Text style={styles.headerTitle}>Receitas</Text>
        </View>
        <TouchableOpacity style={styles.btnGerar} onPress={handleGerar} disabled={gerando}>
          {gerando
            ? <ActivityIndicator size="small" color={C.ink[0]} />
            : <>
                <MaterialCommunityIcons name="auto-fix" size={16} color={C.ink[0]} />
                <Text style={styles.btnGerarText}>Gerar novas</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* Chips de modo alimentar */}
      <View style={styles.modoChipsRow}>
        {(Object.entries(MODO_INFO) as [ModoAlimentar, typeof MODO_INFO[ModoAlimentar]][]).map(([modo, info]) => {
          const ativo = modoAlimentar === modo;
          const cor = info.cor || C.green[600];
          return (
            <TouchableOpacity
              key={modo}
              style={[styles.modoChip, ativo && { backgroundColor: cor + '18', borderColor: cor }]}
              onPress={() => trocarModo(modo)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={info.icon as any} size={13} color={ativo ? cor : C.ink[400]} />
              <Text style={[styles.modoChipTxt, ativo && { color: cor, fontWeight: '700' }]}>
                {info.label.replace('Modo ', '').replace('Todas as receitas', 'Normal')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Atalhos de navegação */}
      <View style={styles.navChipsRow}>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/favoritas')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="heart-outline" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Favoritas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/receitas-feitas')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="check-circle-outline" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Feitas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/minhas-receitas')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="book-outline" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Minhas Receitas</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={C.green[500]} /></View>
      ) : receitas.length === 0 ? (
        <EmptyState onGerar={handleGerar} gerando={gerando} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Resumo */}
          <View style={styles.resumo}>
            <MaterialCommunityIcons name="fridge-outline" size={16} color={C.green[600]} />
            <Text style={styles.resumoText}>
              {totalIngredientes} ingredientes · {disponiveis.length + comProtagonista.length} receitas sugeridas
            </Text>
            <TouchableOpacity onPress={carregarReceitas}>
              <MaterialCommunityIcons name="refresh" size={16} color={C.ink[400]} />
            </TouchableOpacity>
          </View>

          {/* Use antes que estrague */}
          {urgentes.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={15} color={C.amber[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitleUrgente}>Use antes que estrague</Text>
                  <Text style={styles.sectionSubUrgente}>
                    Receitas com {ingredientesVencendo.slice(0, 2).join(', ')}{ingredientesVencendo.length > 2 ? ` e mais ${ingredientesVencendo.length - 2}` : ''}
                  </Text>
                </View>
              </View>
              {urgentes.map(r => (
                <ReceitaCard
                  key={`urgente-${r.id}`}
                  receita={r}
                  urgente
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onFiz={() => abrirFiz(r)}
                  onFaltando={() => abrirFaltando(r)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
              <View style={styles.separador} />
            </>
          )}

          {/* Disponíveis */}
          {disponiveis.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Prontas para fazer</Text>
              {disponiveis.map(r => (
                <ReceitaCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onFiz={() => abrirFiz(r)}
                  onFaltando={() => abrirFaltando(r)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </>
          )}

          {/* Quase Lá! — tem protagonista, faltam apenas complementos */}
          {quasePossiveis.length > 0 && (
            <>
              <View style={styles.quaseHeader}>
                <View style={styles.quaseHeaderIcon}>
                  <MaterialCommunityIcons name="cart-heart" size={15} color={C.ink[0]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quaseHeaderTitle}>Quase Lá! 🛒</Text>
                  <Text style={styles.quaseHeaderSub}>Você tem o ingrediente principal — compre só o que falta</Text>
                </View>
              </View>
              {quasePossiveis.map(r => (
                <QuaseCard
                  key={`quase-${r.id}`}
                  receita={r}
                  comprando={comprando === r.id}
                  onComprar={() => comprarFaltando(r)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id } })}
                />
              ))}
            </>
          )}

          {/* Sugestão de prato — sem protagonista, inspiração de compra */}
          {sugestoesPrato.length > 0 && (
            <>
              <View style={styles.sugestaoHeader}>
                <View style={styles.sugestaoHeaderIcon}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={15} color={C.ink[0]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sugestaoHeaderTitle}>Sugestão de prato 💡</Text>
                  <Text style={styles.sugestaoHeaderSub}>Você já tem parte dos ingredientes — inspire-se!</Text>
                </View>
              </View>
              {sugestoesPrato.map(r => (
                <SugestaoCard
                  key={`sugestao-${r.id}`}
                  receita={r}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id } })}
                />
              ))}
            </>
          )}

          {/* Tem protagonista mas faltam complementos */}
          {comProtagonista.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Tem o ingrediente principal</Text>
              {comProtagonista.map(r => (
                <ReceitaCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onFiz={() => abrirFiz(r)}
                  onFaltando={() => abrirFaltando(r)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </>
          )}

          {/* Parciais sem protagonista */}
          {parciais.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Faltam alguns ingredientes</Text>
              {parciais.map(r => (
                <ReceitaCard
                  key={r.id}
                  receita={r}
                  favoritado={favoritosIds.has(r.id)}
                  onToggleFavorito={() => toggleFavorito(r.id)}
                  onFiz={() => abrirFiz(r)}
                  onFaltando={() => abrirFaltando(r)}
                  onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id, dados: JSON.stringify(r) } })}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Sheet de ingredientes */}
      {sheet && (
        <IngredientesSheet
          receita={sheet.receita}
          modo={sheet.modo}
          onFechar={fecharSheet}
        />
      )}

      <ScreenTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        steps={[
          { icon: 'robot-happy', title: 'Receitas com IA', description: 'A inteligência artificial analisa o que você tem na despensa e sugere receitas personalizadas para você.' },
          { icon: 'auto-fix', title: 'Gerar receitas', description: "Toque em 'Gerar novas' no topo para criar sugestões com os ingredientes disponíveis na sua despensa." },
          { icon: 'check-circle-outline', title: 'Fiz essa receita!', description: "Ao cozinhar, toque em 'Fiz essa!' para registrar e descontar automaticamente os ingredientes usados." },
        ]}
      />
    </View>
  );
}

// ─── ReceitaCard ─────────────────────────────────────────────────────────────

function ReceitaCard({ receita, onFiz, onFaltando, onPress, urgente, favoritado, onToggleFavorito }: {
  receita: ReceitaDisponivel;
  onFiz: () => void;
  onFaltando: () => void;
  onPress: () => void;
  urgente?: boolean;
  favoritado?: boolean;
  onToggleFavorito?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const parcial = !receita.disponivel;

  return (
    <TouchableOpacity style={styles.receitaCard} onPress={onPress} activeOpacity={0.92}>
      <View style={{ position: 'relative' }}>
        {receita.imagem_url && !imageError ? (
          <Image source={{ uri: receita.imagem_url }} style={[styles.receitaImg, parcial && { opacity: 0.55 }]} onError={() => setImageError(true)} />
        ) : (
          <View style={[styles.receitaImgPlaceholder, parcial && { backgroundColor: C.ink[100] }]}>
            <MaterialCommunityIcons name="image-outline" size={32} color={C.ink[300]} />
          </View>
        )}
        {onToggleFavorito && (
          <TouchableOpacity
            style={[styles.heartBtn, !(receita.imagem_url && !imageError) && { backgroundColor: 'transparent' }]}
            onPress={onToggleFavorito}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={20}
              color={favoritado ? C.red[500] : (receita.imagem_url && !imageError ? C.ink[0] : C.ink[400])}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.receitaBody}>
        {/* Tags */}
        <View style={styles.tagRow}>
          {urgente && receita.usa_vencendo && receita.usa_vencendo.length > 0 && (
            <View style={styles.tagUrgente}>
              <MaterialCommunityIcons name="clock-alert-outline" size={11} color={C.ink[0]} />
              <Text style={styles.tagUrgenteText}>Usa {receita.usa_vencendo[0]}</Text>
            </View>
          )}
          {receita.is_nova && (
            <View style={styles.tagNova}>
              <MaterialCommunityIcons name="shimmer" size={11} color={C.ink[0]} />
              <Text style={styles.tagNovaText}>Nova</Text>
            </View>
          )}
          <View style={[styles.tagCobertura, { backgroundColor: parcial ? C.amber[50] : C.green[50] }]}>
            <MaterialCommunityIcons
              name={parcial ? 'alert-outline' : 'check-circle-outline'}
              size={11}
              color={parcial ? C.amber[700] : C.green[700]}
            />
            <Text style={[styles.tagCoberturaText, { color: parcial ? C.amber[700] : C.green[700] }]}>
              {receita.cobertura}% dos ingredientes
            </Text>
          </View>
        </View>

        <Text style={[styles.receitaNome, parcial && { color: C.ink[400] }]}>
          {receita.titulo}
        </Text>

        {receita.descricao ? (
          <Text style={styles.receitaDesc} numberOfLines={2}>{receita.descricao}</Text>
        ) : null}

        {/* O que falta — inline */}
        {parcial && receita.faltando.length > 0 && (
          <View style={styles.faltandoBox}>
            <MaterialCommunityIcons name="cart-outline" size={13} color={C.amber[600]} />
            <Text style={styles.faltandoLabel}>Falta: </Text>
            <Text style={styles.faltandoItens} numberOfLines={2}>
              {receita.faltando.join(', ')}
            </Text>
          </View>
        )}

        {/* Meta + Fiz essa */}
        <View style={styles.acoes}>
          <View style={styles.receitaMeta}>
            {receita.tempo_preparo ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={C.ink[400]} />
                <Text style={styles.metaText}>{receita.tempo_preparo}</Text>
              </View>
            ) : null}
            {receita.vezes_executada > 0 && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="chef-hat" size={13} color={C.ink[400]} />
                <Text style={styles.metaText}>{receita.vezes_executada}x feita</Text>
              </View>
            )}
          </View>
          {receita.disponivel && (
            <TouchableOpacity style={styles.btnFiz} onPress={onFiz}>
              <MaterialCommunityIcons name="check" size={14} color={C.ink[0]} />
              <Text style={styles.btnFizText}>Fiz essa!</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}


// ─── QuaseCard ────────────────────────────────────────────────────────────────

function QuaseCard({ receita, comprando, onComprar, onPress }: {
  receita: QuaseReceita;
  comprando: boolean;
  onComprar: () => void;
  onPress: () => void;
}) {
  const pct = Math.min(100, Math.round(receita.cobertura_pct));
  return (
    <TouchableOpacity style={styles.quaseCard} onPress={onPress} activeOpacity={0.92}>
      {/* Barra de progresso */}
      <View style={styles.quaseProgressBg}>
        <View style={[styles.quaseProgressFill, { width: `${pct}%` as any }]} />
      </View>

      <View style={styles.quaseBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.quaseNome} numberOfLines={2}>{receita.nome}</Text>
          <Text style={styles.quaseMensagem}>{receita.mensagem}</Text>
          {receita.faltando.length > 0 && (
            <View style={styles.quaseFaltando}>
              <MaterialCommunityIcons name="plus-circle-outline" size={12} color={C.green[600]} />
              <Text style={styles.quaseFaltandoTxt} numberOfLines={1}>
                {receita.faltando.slice(0, 3).join(', ')}{receita.faltando.length > 3 ? '…' : ''}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.quaseBtnComprar, comprando && { opacity: 0.6 }]}
          onPress={onComprar}
          disabled={comprando}
          activeOpacity={0.8}
        >
          {comprando
            ? <ActivityIndicator size="small" color={C.ink[0]} />
            : <>
                <MaterialCommunityIcons name="cart-plus" size={14} color={C.ink[0]} />
                <Text style={styles.quaseBtnTxt}>
                  {receita.n_faltando === 1 ? 'Comprar 1 item' : `Comprar ${receita.n_faltando}`}
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── SugestaoCard ────────────────────────────────────────────────────────────

function SugestaoCard({ receita, onPress }: {
  receita: QuaseReceita;
  onPress: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const pct = Math.min(100, Math.round(receita.cobertura_pct));
  // Destaca o ingrediente principal faltante (geralmente o primeiro da lista)
  const protagonista = receita.faltando[0] ?? '';

  return (
    <TouchableOpacity style={styles.sugestaoCard} onPress={onPress} activeOpacity={0.92}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {/* Ícone / imagem pequena */}
        {receita.imagem_url && !imageError ? (
          <Image
            source={{ uri: receita.imagem_url }}
            style={styles.sugestaoImg}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.sugestaoImgPlaceholder}>
            <MaterialCommunityIcons name="food-variant" size={22} color={C.ink[400]} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.sugestaoNome} numberOfLines={1}>{receita.nome}</Text>

          {/* Progresso */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={styles.sugestaoProgressBg}>
              <View style={[styles.sugestaoProgressFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.sugestaoPct}>{pct}%</Text>
          </View>

          {/* Ingrediente principal faltante — faltando[0] é sempre o protagonista */}
          {protagonista ? (
            <View style={styles.sugestaoFaltando}>
              <MaterialCommunityIcons name="cart-outline" size={11} color="#7c3aed" />
              <Text style={styles.sugestaoFaltandoTxt} numberOfLines={1}>
                Ingrediente principal: <Text style={{ fontWeight: '700' }}>{protagonista}</Text>
                {receita.n_faltando > 1 ? ` + ${receita.n_faltando - 1} item(s)` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── IngredientesSheet ────────────────────────────────────────────────────────

function IngredientesSheet({
  receita,
  modo,
  onFechar,
}: {
  receita: ReceitaDisponivel;
  modo: 'fiz' | 'faltando';
  onFechar: () => void;
}) {
  // Usa ingredientes_produtos (nome_display limpo + produto_id) enviados pelo backend
  const itensRaw: IngredienteProduto[] = (receita.ingredientes_produtos?.length ?? 0) > 0
    ? receita.ingredientes_produtos
    : (receita.ingredientes || []).map(ing => ({ nome: ing, produto_id: null }));
  // Dedup por nome
  const itens = itensRaw.filter((item, idx, arr) =>
    arr.findIndex(x => x.nome.toLowerCase() === item.nome.toLowerCase()) === idx
  );

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  const toggle = (produto_id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      next.has(produto_id) ? next.delete(produto_id) : next.add(produto_id);
      return next;
    });
  };

  const confirmar = async () => {
    setSalvando(true);
    try {
      if (selecionados.size > 0) {
        const invRes = await api.get('/inventario');
        const invItens: any[] = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.produtos || []);

        await Promise.all(
          Array.from(selecionados).map(async (key) => {
            const ing = itens.find(i => (i.produto_id ?? i.nome) === key);
            if (!ing) return;
            const invItem = invItens.find((p: any) => {
              const nomeInv = (p.nome_display || p.nome || '').toLowerCase();
              const nomeIng = ing.nome.toLowerCase();
              return nomeInv === nomeIng || nomeInv.includes(nomeIng) || nomeIng.includes(nomeInv);
            });
            if (invItem) {
              await api.patch(`/inventario/${invItem.id}/esgotado`, { esgotado: true });
            }
          })
        );
      }
    } catch { /* silencioso */ }
    finally {
      setSalvando(false);
      onFechar();
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onFechar} activeOpacity={1} />
        <View style={styles.sheetBox}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Cabeçalho */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderIcon}>
              <MaterialCommunityIcons
                name={modo === 'fiz' ? 'check-circle' : 'package-variant-remove'}
                size={22}
                color={modo === 'fiz' ? C.green[600] : C.amber[700]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitulo}>
                {modo === 'fiz' ? 'Receita feita!' : 'O que acabou?'}
              </Text>
              <Text style={styles.sheetSub}>
                {modo === 'fiz'
                  ? 'Marque o que acabou na sua despensa'
                  : 'Marque os ingredientes que você não tem mais'}
              </Text>
            </View>
          </View>

          {/* Lista de ingredientes com checkbox */}
          <FlatList
            data={itens}
            keyExtractor={(item, i) => `${item.produto_id ?? item.nome}-${i}`}
            style={styles.sheetList}
            renderItem={({ item }) => {
              const key = item.produto_id ?? item.nome;
              const marcado = selecionados.has(key);
              return (
                <TouchableOpacity
                  style={[styles.sheetIngRow, marcado && styles.sheetIngRowMarcado]}
                  onPress={() => toggle(key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, marcado && styles.checkboxMarcado]}>
                    {marcado && <MaterialCommunityIcons name="check" size={13} color={C.ink[0]} />}
                  </View>
                  <Text style={[styles.sheetIngNome, marcado && styles.sheetIngNomeMarcado]}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Botões */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.sheetBtnCancelar} onPress={onFechar}>
              <Text style={styles.sheetBtnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetBtnConfirmar, salvando && { opacity: 0.6 }]}
              onPress={confirmar}
              disabled={salvando}
            >
              {salvando
                ? <ActivityIndicator size="small" color={C.ink[0]} />
                : <>
                    <MaterialCommunityIcons name="check" size={16} color={C.ink[0]} />
                    <Text style={styles.sheetBtnConfirmarText}>
                      {selecionados.size > 0 ? `Marcar ${selecionados.size} como acabou` : 'Confirmar'}
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmptyState({ onGerar, gerando }: { onGerar: () => void; gerando: boolean }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="chef-hat" size={48} color={C.green[500]} />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma receita ainda</Text>
      <Text style={styles.emptySub}>Gere receitas com os ingredientes da sua despensa</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onGerar} disabled={gerando}>
        {gerando
          ? <ActivityIndicator size="small" color={C.ink[0]} />
          : <>
              <MaterialCommunityIcons name="auto-fix" size={18} color={C.ink[0]} />
              <Text style={styles.emptyBtnText}>Gerar agora</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  menuBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },
  btnGerar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.green[500], paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: radius.md, ...shadows.sm, minWidth: 44, justifyContent: 'center',
  },
  btnGerarText: { ...T.small, color: C.ink[0], fontWeight: '700' },

  modoChipsRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  modoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.ink[200],
    backgroundColor: C.ink[50],
  },
  modoChipTxt: { ...T.micro, color: C.ink[500], fontWeight: '500' },

  navChipsRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.ink[50], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  navChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.ink[200],
    backgroundColor: C.ink[0],
  },
  navChipTxt: { ...T.micro, color: C.ink[600], fontWeight: '500' },

  content: { padding: 20, paddingBottom: 32, gap: 12 },

  resumo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.ink[0], borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: C.ink[150],
  },
  resumoText: { ...T.small, color: C.ink[600], flex: 1 },

  modoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: radius.pill,
    borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  modoBadgeTxt: { ...T.micro, fontWeight: '700', letterSpacing: 0.3 },

  sectionTitle: { ...T.h3, color: C.ink[700], marginTop: 4, marginBottom: 4 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.amber[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.amber[200], padding: 12, marginBottom: 10,
  },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.amber[500], alignItems: 'center', justifyContent: 'center',
  },
  sectionTitleUrgente: { ...T.h3, color: C.amber[800], fontSize: 14 },
  sectionSubUrgente: { ...T.micro, color: C.amber[700], marginTop: 1 },
  separador: { height: 1, backgroundColor: C.ink[150], marginVertical: 4 },
  tagUrgente: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: C.amber[500], borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagUrgenteText: { ...T.micro, color: C.ink[0], fontWeight: '700' },

  // Card receita
  receitaCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], overflow: 'hidden', ...shadows.sm,
  },
  receitaImg: { width: '100%', height: 160, resizeMode: 'cover' },
  receitaImgPlaceholder: {
    width: '100%', height: 100, backgroundColor: C.ink[100],
    alignItems: 'center', justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  receitaBody: { padding: 14, gap: 6 },

  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tagNova: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: C.green[600], borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagNovaText: { ...T.micro, color: C.ink[0], fontWeight: '700' },
  tagCobertura: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagCoberturaText: { ...T.micro, fontWeight: '600' },

  receitaNome: { ...T.h3, color: C.ink[900] },
  receitaDesc: { ...T.small, color: C.ink[500], lineHeight: 18 },

  faltandoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 4,
    backgroundColor: C.amber[50], borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: C.amber[200],
  },
  faltandoLabel: { ...T.micro, color: C.amber[700], fontWeight: '700' },
  faltandoItens: { ...T.micro, color: C.amber[700], flex: 1, lineHeight: 16 },

  receitaMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...T.micro, color: C.ink[400] },

  acoes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  btnFaltando: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.amber[200],
    backgroundColor: C.amber[50], paddingVertical: 7, paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  btnFaltandoText: { ...T.small, color: C.amber[700], fontWeight: '700' },
  btnFiz: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.green[500], paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: radius.md, ...shadows.sm,
  },
  btnFizText: { ...T.small, color: C.ink[0], fontWeight: '700' },

  preparo: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.ink[100], marginTop: 4 },
  ingredientesSection: { marginBottom: 8 },
  ingredientesSectionTitle: { ...T.small, color: C.ink[700], fontWeight: '700', marginBottom: 6 },
  ingredienteItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 2 },
  ingredienteBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green[500], marginTop: 6, flexShrink: 0 },
  ingredienteItemText: { ...T.small, color: C.ink[700], flex: 1, lineHeight: 18 },
  passo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  passoNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  passoNumText: { ...T.micro, color: C.ink[0], fontWeight: '700' },
  passoText: { ...T.small, color: C.ink[700], flex: 1, lineHeight: 18 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h2, color: C.ink[900] },
  emptySub: { ...T.body, color: C.ink[500], textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[500], paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: radius.md, marginTop: 8, ...shadows.md,
  },
  emptyBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // Quase Lá!
  quaseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.green[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.green[200], padding: 12, marginBottom: 4,
  },
  quaseHeaderIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.green[600], alignItems: 'center', justifyContent: 'center',
  },
  quaseHeaderTitle: { ...T.h3, color: C.green[900], fontSize: 14 },
  quaseHeaderSub: { ...T.micro, color: C.green[700], marginTop: 2 },
  quaseCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.green[200], overflow: 'hidden', ...shadows.sm,
  },
  quaseProgressBg: { height: 4, backgroundColor: C.ink[150] },
  quaseProgressFill: { height: 4, backgroundColor: C.green[500] },
  quaseBody: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  quaseNome: { ...T.h3, color: C.ink[900], fontSize: 14, lineHeight: 18 },
  quaseMensagem: { ...T.micro, color: C.green[700], fontWeight: '600', marginTop: 3 },
  quaseFaltando: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  quaseFaltandoTxt: { ...T.micro, color: C.ink[500], flex: 1 },
  quaseBtnComprar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.green[600], paddingVertical: 9, paddingHorizontal: 10,
    borderRadius: radius.md, ...shadows.sm, minWidth: 100, justifyContent: 'center',
  },
  quaseBtnTxt: { ...T.micro, color: C.ink[0], fontWeight: '700' },

  // Sugestão de prato (sem protagonista)
  sugestaoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f5f3ff', borderRadius: radius.md,
    borderWidth: 1, borderColor: '#ddd6fe', padding: 12, marginBottom: 4,
  },
  sugestaoHeaderIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },
  sugestaoHeaderTitle: { ...T.h3, color: '#4c1d95', fontSize: 14 },
  sugestaoHeaderSub: { ...T.micro, color: '#5b21b6', marginTop: 2 },
  sugestaoCard: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: '#ddd6fe', overflow: 'hidden',
    padding: 12, ...shadows.sm,
  },
  sugestaoImg: { width: 56, height: 56, borderRadius: radius.md, resizeMode: 'cover' },
  sugestaoImgPlaceholder: {
    width: 56, height: 56, borderRadius: radius.md,
    backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center',
  },
  sugestaoNome: { ...T.h3, color: C.ink[900], fontSize: 13, lineHeight: 17 },
  sugestaoProgressBg: { flex: 1, height: 4, backgroundColor: C.ink[150], borderRadius: 2 },
  sugestaoProgressFill: { height: 4, backgroundColor: '#7c3aed', borderRadius: 2 },
  sugestaoPct: { ...T.micro, color: '#7c3aed', fontWeight: '700', minWidth: 28, textAlign: 'right' },
  sugestaoFaltando: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sugestaoFaltandoTxt: { ...T.micro, color: '#5b21b6', flex: 1 },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheetBox: {
    backgroundColor: C.ink[0], borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, maxHeight: '85%',
    ...shadows.modal,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink[200], alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.ink[100],
  },
  sheetHeaderIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  sheetTitulo: { ...T.h3, color: C.ink[900], fontSize: 16 },
  sheetSub: { ...T.micro, color: C.ink[500], marginTop: 2 },
  sheetList: { maxHeight: 340, paddingHorizontal: 16, marginTop: 4 },
  sheetIngRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 8, borderRadius: radius.md, marginVertical: 1,
  },
  sheetIngRowMarcado: { backgroundColor: C.red[50] },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.ink[300],
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: C.red[500], borderColor: C.red[500] },
  sheetIngNome: { ...T.body, color: C.ink[800], flex: 1 },
  sheetIngNomeMarcado: { color: C.red[500], textDecorationLine: 'line-through' },
  sheetFooter: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.ink[100],
  },
  sheetBtnCancelar: {
    flex: 1, paddingVertical: 13, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.ink[200], alignItems: 'center',
  },
  sheetBtnCancelarText: { ...T.body, color: C.ink[600], fontWeight: '600' },
  sheetBtnConfirmar: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.green[500], paddingVertical: 13, borderRadius: radius.md, ...shadows.sm,
  },
  sheetBtnConfirmarText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
