import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

interface ReceitaDesafio {
  id: string;
  nome?: string;
  titulo?: string;
  imagem_url?: string | null;
  tempo_preparo?: number | null;
  dificuldade?: string;
  cobertura: number;
  ingredientes_faltando: string[];
  total_ingredientes: number;
}

interface Props {
  receita: ReceitaDesafio;
  onPress: () => void;
  onComprar?: () => void;
}

export function DesafioCard({ receita, onPress, onComprar }: Props) {
  const [imageError, setImageError] = useState(false);
  const nome = receita.titulo || receita.nome || '';
  const temImagem = !!receita.imagem_url && !imageError;
  const qtdFaltando = receita.ingredientes_faltando.length;
  const faltandoLabel = receita.ingredientes_faltando.slice(0, 3).join(', ');
  const temMais = receita.ingredientes_faltando.length > 3;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.imagemWrap}>
        {temImagem ? (
          <Image
            source={{ uri: receita.imagem_url! }}
            style={styles.imagem}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.imagem, styles.imagemFallback]}>
            <MaterialCommunityIcons name="trophy-outline" size={24} color={C.amber[400]} />
          </View>
        )}
        <View style={styles.badge}>
          <MaterialCommunityIcons name="trophy-outline" size={10} color={C.ink[0]} />
          <Text style={styles.badgeTxt}>Desafio</Text>
        </View>
        <View style={styles.coberturaChip}>
          <Text style={styles.coberturaChipTxt}>{receita.cobertura}%</Text>
        </View>
      </View>

      <View style={styles.corpo}>
        <Text style={styles.nome} numberOfLines={2}>{nome}</Text>

        <View style={styles.barra}>
          <View style={[styles.barraFill, { width: `${receita.cobertura}%` as any }]} />
        </View>

        <View style={styles.faltaRow}>
          <MaterialCommunityIcons name="cart-plus" size={12} color={C.amber[700]} />
          <Text style={styles.faltaTxt} numberOfLines={2}>
            Falta: <Text style={styles.faltaNomes}>{faltandoLabel}</Text>
            {temMais ? <Text style={styles.faltaTxt}> +{receita.ingredientes_faltando.length - 3}</Text> : null}
          </Text>
        </View>

        {onComprar && (
          <TouchableOpacity style={styles.ctaBtn} onPress={onComprar} activeOpacity={0.8}>
            <MaterialCommunityIcons name="cart-outline" size={13} color={C.ink[0]} />
            <Text style={styles.ctaTxt}>
              Comprar {qtdFaltando} ingrediente{qtdFaltando !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: C.ink[0],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.amber[200],
    overflow: 'hidden',
    ...shadows.sm,
  },
  imagemWrap: { position: 'relative' },
  imagem: { width: '100%', height: 118 },
  imagemFallback: {
    backgroundColor: C.amber[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 8, left: 8, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.amber[600],
    borderRadius: radius.pill,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  badgeTxt: { fontSize: 10, fontWeight: '700', color: C.ink[0] },
  coberturaChip: {
    position: 'absolute', top: 8, right: 8, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  coberturaChipTxt: { fontSize: 10, fontWeight: '700', color: C.ink[0] },

  corpo: { padding: 10, gap: 6 },
  nome: { fontSize: 13, fontWeight: '600', color: C.ink[900], lineHeight: 17 },

  barra: {
    height: 4, backgroundColor: C.amber[100],
    borderRadius: 2, overflow: 'hidden',
  },
  barraFill: {
    height: '100%', backgroundColor: C.amber[500], borderRadius: 2,
  },

  faltaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 2 },
  faltaTxt: { fontSize: 11, color: C.ink[500], flex: 1, lineHeight: 15 },
  faltaNomes: { fontWeight: '600', color: C.amber[800] },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.amber[600],
    borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 7,
    marginTop: 2,
  },
  ctaTxt: { fontSize: 11, fontWeight: '700', color: C.ink[0] },
});
