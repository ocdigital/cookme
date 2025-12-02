import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const { success, data, error } = route?.params || {};

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleTryAgain = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Home' },
        { name: 'QRScanner' },
      ],
    });
  };

  if (success) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Ícone de Sucesso */}
          <View style={styles.iconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>

          {/* Título */}
          <Text style={styles.title}>Cupom Cadastrado!</Text>
          <Text style={styles.subtitle}>
            Sua compra foi cadastrada com sucesso
          </Text>

          {/* Informações da Compra */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Produtos cadastrados:</Text>
              <Text style={styles.infoValue}>{data?.totalProdutos || 0}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valor total:</Text>
              <Text style={styles.infoValue}>
                R$ {data?.valorTotal?.toFixed(2) || '0.00'}
              </Text>
            </View>

            {data?.compraId && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID da compra:</Text>
                  <Text style={styles.infoValueSmall}>{data.compraId}</Text>
                </View>
              </>
            )}
          </View>

          {/* Dica */}
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💡 Os produtos foram adicionados ao seu inventário automaticamente!
            </Text>
          </View>

          {/* Botões */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
            <Text style={styles.primaryButtonText}>Ver Inventário</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleTryAgain}>
            <Text style={styles.secondaryButtonText}>Cadastrar Outro Cupom</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Erro
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Ícone de Erro */}
        <View style={styles.iconContainer}>
          <Text style={styles.errorIcon}>❌</Text>
        </View>

        {/* Título */}
        <Text style={styles.title}>Erro ao Processar</Text>
        <Text style={styles.subtitle}>
          Não foi possível cadastrar o cupom fiscal
        </Text>

        {/* Mensagem de Erro */}
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error || 'Erro desconhecido'}</Text>
        </View>

        {/* Possíveis Causas */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Possíveis causas:</Text>
          <Text style={styles.helpItem}>• QR Code inválido ou incompleto</Text>
          <Text style={styles.helpItem}>• CAPTCHA não foi resolvido</Text>
          <Text style={styles.helpItem}>• Tempo limite excedido</Text>
          <Text style={styles.helpItem}>• Problema de conexão com a internet</Text>
        </View>

        {/* Botões */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain}>
          <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
          <Text style={styles.secondaryButtonText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 30,
  },
  successIcon: {
    fontSize: 100,
  },
  errorIcon: {
    fontSize: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 18,
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#1B5E20',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#C8E6C9',
    marginVertical: 8,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
    fontWeight: '500',
  },
  helpCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
  },
  helpItem: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 5,
  },
  tipContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    marginBottom: 30,
  },
  tipText: {
    fontSize: 14,
    color: '#1565C0',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
