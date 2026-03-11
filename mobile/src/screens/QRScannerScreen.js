import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { scraperService } from '../services/api';

export default function QRScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;

    setScanned(true);
    processQRCode(data);
  };

  const processQRCode = async (qrcodeTexto) => {
    try {
      // Validar formato básico do QR Code SAT
      if (!qrcodeTexto || qrcodeTexto.length < 100) {
        Alert.alert(
          'QR Code Inválido',
          'Este não parece ser um QR Code de cupom fiscal SAT válido. Verifique o código e tente novamente.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }

      // Iniciar consulta no backend
      const response = await scraperService.startConsulta(qrcodeTexto);

      if (!response || !response.sessionId) {
        throw new Error('Resposta inválida do servidor');
      }

      // Navegar para tela de processamento
      navigation.replace('Processing', {
        sessionId: response.sessionId,
        qrcodeTexto,
      });
    } catch (error) {
      console.error('Erro ao iniciar consulta:', error);
      console.error('Erro completo:', JSON.stringify(error, null, 2));

      let errorMessage = 'Erro ao processar QR Code. Tente novamente.';
      let errorDetails = '';

      // Erro de resposta do servidor
      if (error.response) {
        errorMessage = error.response.data?.message || `Erro ${error.response.status}: ${error.response.statusText}`;
        errorDetails = error.response.data?.details || '';
      }
      // Erro de conexão
      else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Mensagem de erro:', errorMessage);
      console.error('Detalhes:', errorDetails);

      Alert.alert(
        'Erro ao processar QR Code',
        errorDetails ? `${errorMessage}

${errorDetails}` : errorMessage,
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  const handleManualInput = () => {
    if (!manualText.trim()) {
      Alert.alert('Erro', 'Cole o texto do QR Code');
      return;
    }

    setShowManualInput(false);
    processQRCode(manualText.trim());
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permissão da câmera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sem acesso à câmera</Text>
        <Text style={styles.helpText}>
          Permita o acesso à câmera nas configurações do aplicativo
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.buttonText}>Inserir Manualmente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.instruction}>
            Aponte a câmera para o QR Code do cupom fiscal
          </Text>

          <View style={styles.bottomButtons}>
            {scanned && (
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.buttonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.manualButton]}
              onPress={() => setShowManualInput(true)}
            >
              <Text style={styles.buttonText}>Inserir Manualmente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Modal para entrada manual */}
      <Modal
        visible={showManualInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Inserir QR Code Manualmente</Text>
            <Text style={styles.modalSubtitle}>
              Cole o texto completo do QR Code do cupom fiscal
            </Text>

            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={8}
              placeholder="Cole o texto do QR Code aqui..."
              value={manualText}
              onChangeText={setManualText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowManualInput(false);
                  setManualText('');
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleManualInput}
              >
                <Text style={styles.buttonText}>Processar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  scanArea: {
    width: 250,
    height: 250,
    marginTop: 50,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 8,
  },
  bottomButtons: {
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#FF9800',
  },
  manualButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  helpText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
});
