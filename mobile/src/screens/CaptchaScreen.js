import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { scraperService } from '../services/api';

export default function CaptchaScreen({ route, navigation }) {
  const { sessionId, captchaUrl, chaveAcesso } = route.params;
  const [loading, setLoading] = useState(true);
  const webViewRef = React.useRef(null);
  const paginaInicialCarregada = React.useRef(false);
  const cupomJaDetectado = React.useRef(false);

  const handleNavigationStateChange = async (navState) => {
    console.log('Navigation changed:', navState.url);
    console.log('Loading:', navState.loading);
    console.log('Página inicial carregada:', paginaInicialCarregada.current);

    // Detectar se o cupom fiscal foi carregado
    if (navState.url.includes('ConsultaPublicaCfe.aspx') && !navState.loading) {

      // Primeira vez que carrega = página com CAPTCHA
      // Ignorar a primeira carga
      if (!paginaInicialCarregada.current) {
        console.log('Primeira carga da página (CAPTCHA) - ignorando detecção');
        paginaInicialCarregada.current = true;
        return;
      }

      // Se já detectou cupom, não detectar novamente
      if (cupomJaDetectado.current) {
        console.log('Cupom já foi detectado - ignorando');
        return;
      }

      // Aguardar um pouco antes de verificar (página precisa renderizar)
      setTimeout(() => {
        console.log('Verificando se há cupom na página...');

        // Injetar JavaScript para verificar se há cupom fiscal na página
        const checkCupomScript = `
          (function() {
            var hasCupom = document.body.innerText.includes('TOTAL R$') ||
                           document.body.innerText.includes('CUPOM FISCAL') ||
                           document.body.innerText.includes('Extrato No Formato');

            console.log('Verificando cupom - hasCupom:', hasCupom);

            if (hasCupom) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'cupom_detectado',
                html: document.documentElement.outerHTML
              }));
            } else {
              console.log('Cupom não encontrado na página');
            }
          })();
        `;

        webViewRef.current?.injectJavaScript(checkCupomScript);
      }, 2000); // Aguardar 2 segundos após navegação
    }
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'cupom_detectado') {
        // Marcar que já detectou
        cupomJaDetectado.current = true;

        console.log('Cupom fiscal detectado!');
        console.log('HTML length:', data.html?.length || 0);

        try {
          // Notificar backend que CAPTCHA foi resolvido e cupom foi exibido
          console.log('Notificando backend...');
          console.log('Enviando HTML do cupom (tamanho:', data.html?.length || 0, 'caracteres)');

          await scraperService.notifyCaptchaResolved(sessionId, data.html);
          console.log('Backend notificado com sucesso!');
          console.log('Navegando de volta para Processing...');

          // Navegar automaticamente sem Alert
          navigation.replace('Processing', { sessionId });

        } catch (error) {
          console.error('Erro ao notificar backend:', error);
          Alert.alert(
            'Erro',
            `Falha ao notificar backend: ${error.message}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.log('WebView message (não é JSON):', event.nativeEvent.data);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar',
      'Se você cancelar, o cupom não será processado. Deseja continuar?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
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
      {/* Instruções */}
      <View style={styles.header}>
        <Text style={styles.title}>Resolva o CAPTCHA</Text>
        <Text style={styles.subtitle}>
          Complete o desafio abaixo para continuar o processamento do cupom
        </Text>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: captchaUrl }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onMessage={handleWebViewMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadEnd={() => {
            setLoading(false);

            // Aplicar zoom na página
          const zoomScript = `
            (function() {
              try {
                var meta = document.querySelector('meta[name="viewport"]');
                if (!meta) {
                  meta = document.createElement('meta');
                  meta.name = 'viewport';
                  document.head.appendChild(meta);
                }
                // Novo valor de escala: 1.2 é um leve zoom, mas deve caber na tela
                meta.setAttribute('content', 'width=device-width, initial-scale=1.2, maximum-scale=3.0, user-scalable=yes');

                // (OPCIONAL) Remova o zoom CSS para evitar super-escala
                document.body.style.zoom = '1.0';
                document.documentElement.style.zoom = '1.0';

                console.log('✅ Zoom ajustado para 1.2x');
              } catch(e) {
                console.error('❌ Erro ao aplicar zoom:', e);
              }
            })();
          `;

/*           webViewRef.current?.injectJavaScript(zoomScript); */

            // Preencher campo de chave após carregar
            if (chaveAcesso) {
              // Remover espaços da chave
              const chaveSemEspacos = chaveAcesso.replace(/\s/g, '');

              const jsCode = `
                (function() {
                  try {
                    console.log('Iniciando preenchimento da chave...');

                    // Tentar múltiplas vezes
                    var tentativas = 0;
                    var maxTentativas = 5;

                    var interval = setInterval(function() {
                      tentativas++;
                      console.log('Tentativa ' + tentativas + ' de ' + maxTentativas);

                      var campo = document.getElementById('conteudo_txtChaveAcesso');

                      if (campo) {
                        console.log('Campo encontrado!');
                        clearInterval(interval);

                        // Remover máscaras
                        campo.removeAttribute('input-mask');
                        campo.removeAttribute('maxlength');
                        campo.removeAttribute('data-mask');
                        campo.removeAttribute('readonly');

                        // Método 1: JavaScript direto
                        campo.value = '';
                        campo.value = '${chaveSemEspacos}';
                        campo.dispatchEvent(new Event('input', { bubbles: true }));
                        campo.dispatchEvent(new Event('change', { bubbles: true }));

                        // Aguardar e verificar
                        setTimeout(function() {
                          if (campo.value && campo.value.length > 0) {
                            console.log('✅ Campo preenchido: ' + campo.value);

                            // Scroll até o campo
                            campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          } else {
                            console.log('⚠️ Campo vazio, tentando método alternativo...');

                            // Método 2: Focus + value
                            campo.focus();
                            campo.value = '${chaveSemEspacos}';
                            campo.blur();

                            console.log('Valor após método 2: ' + campo.value);
                          }
                        }, 500);

                      } else if (tentativas >= maxTentativas) {
                        console.error('❌ Campo não encontrado após ' + maxTentativas + ' tentativas');
                        clearInterval(interval);
                      }
                    }, 1000);

                  } catch(e) {
                    console.error('❌ Erro ao preencher campo:', e);
                  }
                })();
              `;

              console.log('Injetando JavaScript para preencher chave:', chaveSemEspacos);
              webViewRef.current?.injectJavaScript(jsCode);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>

      {/* Botão Cancelar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* Dica */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          💡 Resolva o CAPTCHA e clique em "Consultar". O cupom será detectado automaticamente.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
  },
  tipText: {
    fontSize: 13,
    color: '#E65100',
    textAlign: 'center',
  },
});
