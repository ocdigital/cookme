import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

const PRIVACY_URL = 'https://ocdigital.github.io/cookme_landing/privacidade.html';

export default function TermosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScreenWrapper>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>Legal</Text>
          <Text style={styles.headerTitle}>Termos de Uso</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>1. Aceitação dos Termos</Text>
          <Text style={styles.paragrafo}>
            Ao utilizar o CookMe, você concorda com estes Termos de Uso. Se não concordar, não utilize o aplicativo.
            O CookMe é operado pela OC Digital, com sede no Brasil.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>2. Descrição do Serviço</Text>
          <Text style={styles.paragrafo}>
            O CookMe é um aplicativo de gestão de cozinha inteligente que permite ao usuário registrar ingredientes
            a partir de notas fiscais, receber sugestões de receitas personalizadas e planejar refeições semanais.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>3. Conta de Usuário</Text>
          <Text style={styles.paragrafo}>
            Você é responsável por manter a confidencialidade de suas credenciais de acesso. Notifique-nos
            imediatamente em caso de uso não autorizado da sua conta. Reservamo-nos o direito de encerrar contas
            que violem estes termos.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>4. Planos e Pagamentos</Text>
          <Text style={styles.paragrafo}>
            O CookMe oferece um plano gratuito com funcionalidades básicas e planos pagos com recursos avançados.
            Os pagamentos são processados com segurança via Stripe. Assinaturas são renovadas automaticamente
            até cancelamento. O cancelamento pode ser feito a qualquer momento pelo app, sem multas.
          </Text>
          <Text style={styles.paragrafo}>
            Preços podem ser alterados com aviso prévio de 30 dias por email.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>5. Conteúdo e Receitas</Text>
          <Text style={styles.paragrafo}>
            Receitas exibidas no CookMe são obtidas de fontes públicas (como TudoGostoso.com.br) e geradas por
            inteligência artificial. Não garantimos a precisão nutricional das receitas. O CookMe não se responsabiliza
            por reações alérgicas ou problemas de saúde decorrentes do preparo das receitas.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>6. Uso Aceitável</Text>
          <Text style={styles.paragrafo}>
            É proibido usar o CookMe para:{'\n'}
            • Atividades ilegais ou fraudulentas{'\n'}
            • Acesso não autorizado a sistemas{'\n'}
            • Envio de spam ou conteúdo malicioso{'\n'}
            • Engenharia reversa do aplicativo
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>7. Privacidade e LGPD</Text>
          <Text style={styles.paragrafo}>
            O tratamento dos seus dados pessoais é regido pela nossa Política de Privacidade, em conformidade
            com a Lei Geral de Proteção de Dados (Lei 13.709/2018). Você tem direito de acessar, corrigir e
            excluir seus dados a qualquer momento.
          </Text>
          <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(PRIVACY_URL)}>
            <MaterialCommunityIcons name="open-in-new" size={14} color={C.green[600]} />
            <Text style={styles.linkTxt}>Ver Política de Privacidade completa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>8. Limitação de Responsabilidade</Text>
          <Text style={styles.paragrafo}>
            O CookMe é fornecido "como está". Não nos responsabilizamos por danos indiretos, incidentais ou
            consequenciais decorrentes do uso ou impossibilidade de uso do aplicativo.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>9. Alterações nos Termos</Text>
          <Text style={styles.paragrafo}>
            Podemos atualizar estes termos a qualquer momento. Alterações significativas serão comunicadas
            via notificação no app ou email com antecedência mínima de 15 dias.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>10. Contato</Text>
          <Text style={styles.paragrafo}>
            Dúvidas ou reclamações: contato@cookme.com.br{'\n'}
            Encarregado de Dados (LGPD): dpo@cookme.com.br
          </Text>
        </View>

        <Text style={styles.dataAtualizacao}>Última atualização: junho de 2026</Text>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 14, paddingTop: 12,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },

  content: { padding: 20, gap: 12, paddingBottom: 48 },

  card: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  cardTitulo: {
    ...T.small, fontWeight: '700', color: C.ink[700],
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8,
  },
  paragrafo: { ...T.body, color: C.ink[600], lineHeight: 22, marginBottom: 6 },

  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: C.green[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.green[200],
  },
  linkTxt: { ...T.small, color: C.green[700], fontWeight: '600' },

  dataAtualizacao: { ...T.micro, color: C.ink[400], textAlign: 'center', marginTop: 8 },
});
