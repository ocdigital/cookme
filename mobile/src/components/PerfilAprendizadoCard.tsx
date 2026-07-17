import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import { PerfilAprendizado } from '@/hooks/useCookMeAprendizado';

interface Dimensao {
  label: string;
  icon: string;
  valor: number;
  cor: string;
}

function BarraDimensao({ label, icon, valor, cor }: Dimensao) {
  const preenchido = Math.min(100, valor);
  const vazio = preenchido === 0;

  return (
    <View style={styles.dimensao}>
      <View style={styles.dimensaoHeader}>
        <MaterialCommunityIcons name={icon as any} size={14} color={vazio ? C.ink[400] : cor} />
        <Text style={[styles.dimensaoLabel, vazio && styles.dimensaoLabelVazio]}>{label}</Text>
        <Text style={[styles.dimensaoPct, { color: vazio ? C.ink[400] : cor }]}>
          {vazio ? '—' : `${preenchido}%`}
        </Text>
      </View>
      <View style={styles.trilha}>
        <View style={[styles.preenchimento, { width: `${preenchido}%` as any, backgroundColor: cor }]} />
      </View>
    </View>
  );
}

interface Props {
  perfil: PerfilAprendizado;
  progressoGeral: number;
}

export function PerfilAprendizadoCard({ perfil, progressoGeral }: Props) {
  const dimensoes: Dimensao[] = [
    { label: 'Ingredientes favoritos', icon: 'heart-outline', valor: perfil.ingredientes_favoritos, cor: C.green[500] },
    { label: 'Gostos e aversões', icon: 'thumb-up-outline', valor: perfil.gostos_e_aversoes, cor: '#6366f1' },
    { label: 'Seu ritmo de cozinha', icon: 'clock-outline', valor: perfil.ritmo_de_cozinha, cor: C.amber[600] },
    { label: 'Categorias preferidas', icon: 'tag-outline', valor: perfil.categorias_preferidas, cor: '#16a34a' },
  ];

  const nivel = progressoGeral < 20
    ? { label: 'Recém chegou', cor: C.ink[400] }
    : progressoGeral < 40
    ? { label: 'Começando', cor: C.amber[600] }
    : progressoGeral < 70
    ? { label: 'Me conhece bem', cor: C.green[500] }
    : { label: 'Parceiro', cor: '#6366f1' };

  return (
    <View style={styles.card}>
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.titulo}>O CookMe está te conhecendo</Text>
          <View style={styles.nivelRow}>
            <View style={[styles.nivelBadge, { backgroundColor: nivel.cor + '18', borderColor: nivel.cor + '40' }]}>
              <Text style={[styles.nivelTxt, { color: nivel.cor }]}>{nivel.label}</Text>
            </View>
            <Text style={styles.avaliacoesTxt}>
              {perfil.total_avaliacoes} {perfil.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
            </Text>
          </View>
        </View>
        <View style={styles.circulo}>
          <Text style={styles.circuloPct}>{progressoGeral}</Text>
          <Text style={styles.circuloSimbolo}>%</Text>
        </View>
      </View>

      <View style={styles.dimensoes}>
        {dimensoes.map(d => <BarraDimensao key={d.label} {...d} />)}
      </View>

      {(perfil.favoritos.length > 0 || perfil.aversoes.length > 0) && (
        <View style={styles.aprendido}>
          {perfil.favoritos.length > 0 && (
            <View style={styles.aprendidoLinha}>
              <MaterialCommunityIcons name="heart" size={13} color={C.green[500]} />
              <Text style={styles.aprendidoLabel}>Você curte</Text>
              <Text style={styles.aprendidoValores} numberOfLines={1}>
                {perfil.favoritos.join(' · ')}
              </Text>
            </View>
          )}
          {perfil.aversoes.length > 0 && (
            <View style={styles.aprendidoLinha}>
              <MaterialCommunityIcons name="close-circle-outline" size={13} color={C.ink[400]} />
              <Text style={styles.aprendidoLabel}>Evita</Text>
              <Text style={styles.aprendidoValores} numberOfLines={1}>
                {perfil.aversoes.join(' · ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {perfil.total_avaliacoes === 0 && (
        <View style={styles.dica}>
          <MaterialCommunityIcons name="lightbulb-outline" size={13} color={C.amber[700]} />
          <Text style={styles.dicaTxt}>Avalie receitas para eu aprender seus gostos</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.ink[0],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.ink[150],
    padding: 16,
    ...shadows.sm,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titulo: { ...T.h3, fontSize: 14, color: C.ink[900], marginBottom: 6 },
  nivelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nivelBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nivelTxt: { fontSize: 11, fontWeight: '700' },
  avaliacoesTxt: { ...T.micro, color: C.ink[400] } as any,
  circulo: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.green[50],
    borderWidth: 2, borderColor: C.green[200],
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  circuloPct: { fontSize: 16, fontWeight: '800', color: C.green[600] },
  circuloSimbolo: { fontSize: 10, fontWeight: '700', color: C.green[500], marginTop: 2 },

  dimensoes: { gap: 10 },
  dimensao: { gap: 4 },
  dimensaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dimensaoLabel: { ...T.small, flex: 1, color: C.ink[700] },
  dimensaoLabelVazio: { color: C.ink[400] },
  dimensaoPct: { fontSize: 11, fontWeight: '700' },
  trilha: {
    height: 5, backgroundColor: C.ink[150],
    borderRadius: 3, overflow: 'hidden',
  },
  preenchimento: { height: '100%', borderRadius: 3 },

  aprendido: {
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.ink[100],
    gap: 6,
  },
  aprendidoLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aprendidoLabel: { ...T.micro, color: C.ink[500], fontWeight: '700', width: 56 } as any,
  aprendidoValores: { ...T.small, color: C.ink[700], flex: 1 } as any,

  dica: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 12,
    backgroundColor: C.amber[50],
    borderRadius: radius.sm,
    padding: 8,
  },
  dicaTxt: { ...T.small, color: C.amber[800], flex: 1 } as any,
});
