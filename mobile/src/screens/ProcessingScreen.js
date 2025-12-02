import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { scraperService } from '../services/api';

const STATUS_MESSAGES = {
  iniciando: 'Iniciando processo...',
  consultando_sat: 'Acessando site da Fazenda...',
  aguardando_captcha: 'Aguardando resolução do CAPTCHA',
  processando_dados: 'Extraindo produtos do cupom...',
  salvando_api: 'Salvando na sua conta...',
  concluido: 'Compra cadastrada com sucesso!',
  erro: 'Ocorreu um erro',
  timeout: 'Tempo limite excedido',
  cancelado: 'Processo cancelado',
};

export default function ProcessingScreen({ route, navigation }) {
  const { sessionId } = route?.params || {};
  const [status, setStatus] = useState('iniciando');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(STATUS_MESSAGES.iniciando);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const pollIntervalRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startPolling();

    return () => {
      // Cleanup: parar polling ao desmontar componente
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Animar progresso
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const startPolling = () => {
    // Poll a cada 2 segundos
    pollIntervalRef.current = setInterval(async () => {
      await checkStatus();
    }, 2000);

    // Primeira checagem imediata
    checkStatus();
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const checkStatus = async () => {
    try {
      const response = await scraperService.getStatus(sessionId);

      setStatus(response.status);
      setProgress(response.progress || 0);
      setMessage(STATUS_MESSAGES[response.status] || 'Processando...');

      if (response.status === 'aguardando_captcha') {
        // Parar polling e abrir WebView do CAPTCHA
        stopPolling();
        navigation.navigate('Captcha', {
          sessionId,
          captchaUrl: response.captchaUrl,
          chaveAcesso: response.chaveAcesso,
        });
      } else if (response.status === 'concluido') {
        // Sucesso!
        stopPolling();
        setData(response);
        setTimeout(() => {
          navigation.replace('Result', {
            success: true,
            data: response,
          });
        }, 1000);
      } else if (['erro', 'timeout', 'cancelado'].includes(response.status)) {
        // Erro
        stopPolling();
        setError(response.erro || STATUS_MESSAGES[response.status]);
        setTimeout(() => {
          navigation.replace('Result', {
            success: false,
            error: response.erro || STATUS_MESSAGES[response.status],
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      stopPolling();

      const errorMessage = error.response?.data?.message || 'Erro ao processar cupom';
      setError(errorMessage);

      Alert.alert(
        'Erro',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar',
      'Tem certeza que deseja cancelar o processamento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              stopPolling();
              await scraperService.cancelConsulta(sessionId);
              navigation.navigate('Home');
            } catch (error) {
              console.error('Erro ao cancelar:', error);
              navigation.navigate('Home');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Ícone de Status */}
        <View style={styles.iconContainer}>
          {error ? (
            <Text style={styles.icon}>❌</Text>
          ) : status === 'concluido' ? (
            <Text style={styles.icon}>✅</Text>
          ) : (
            <ActivityIndicator size="large" color="#4CAF50" />
          )}
        </View>

        {/* Mensagem de Status */}
        <Text style={styles.statusText}>{message}</Text>

        {/* Barra de Progresso */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>

        {/* Informações Adicionais */}
        {data && status === 'concluido' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              ✅ {data.totalProdutos} produtos cadastrados
            </Text>
            <Text style={styles.infoText}>
              💰 Valor total: R$ {data.valorTotal?.toFixed(2)}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Dica para CAPTCHA */}
        {status === 'consultando_sat' && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💡 Você será solicitado a resolver um CAPTCHA em breve
            </Text>
          </View>
        )}
      </View>

      {/* Botão de Cancelar */}
      {!['concluido', 'erro', 'timeout', 'cancelado'].includes(status) && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 5,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
  },
  tipContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    marginTop: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
