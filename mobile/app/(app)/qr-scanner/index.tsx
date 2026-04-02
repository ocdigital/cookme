import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function QRScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);
    setProcessing(true);

    try {
      // Simular processamento do código
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Dados fictícios - simular produto encontrado
      Alert.alert('Produto Encontrado', `Código: ${data}`, [
        {
          text: 'Cancelar',
          onPress: () => setScanned(false),
        },
        {
          text: 'Adicionar ao Inventário',
          onPress: () => {
            Alert.alert('✓ Adicionado', 'Produto adicionado ao seu inventário');
            setScanned(false);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar código');
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Solicitando permissão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Scanner</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.centeredContent}>
          <MaterialCommunityIcons name="camera-off" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Câmera não autorizada</Text>
          <Text style={styles.errorText}>
            Permita o acesso à câmera nas configurações do seu celular
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR / Código de Barras</Text>
        <TouchableOpacity onPress={() => setFlashEnabled(!flashEnabled)}>
          <MaterialCommunityIcons
            name={flashEnabled ? 'flashlight-off' : 'flashlight'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={flashEnabled}
      >
        {/* Frame de enquadramento */}
        <View style={styles.overlay}>
          <View style={styles.unmask1} />
          <View style={styles.middleRow}>
            <View style={styles.unmask2} />
            <View style={styles.frameBox}>
              <View style={styles.frameCorner1} />
              <View style={styles.frameCorner2} />
              <View style={styles.frameCorner3} />
              <View style={styles.frameCorner4} />
              <Text style={styles.frameText}>Alinhe o código aqui</Text>
            </View>
            <View style={styles.unmask3} />
          </View>
          <View style={styles.unmask4} />
        </View>

        {/* Processando */}
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.processingText}>Processando...</Text>
          </View>
        )}
      </CameraView>

      {scanned && (
        <View style={styles.scanButton}>
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Escanear Novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instrução */}
      <View style={styles.instruction}>
        <MaterialCommunityIcons name="qrcode" size={20} color="#FF6B6B" />
        <Text style={styles.instructionText}>
          Aproxime o código para escanear
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  unmask1: {
    flex: 1,
  },
  middleRow: {
    flexDirection: 'row',
    height: 200,
  },
  unmask2: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  frameBox: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameCorner1: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FF6B6B',
    top: -2,
    left: -2,
  },
  frameCorner2: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FF6B6B',
    top: -2,
    right: -2,
  },
  frameCorner3: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FF6B6B',
    bottom: -2,
    left: -2,
  },
  frameCorner4: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FF6B6B',
    bottom: -2,
    right: -2,
  },
  frameText: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  unmask3: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  unmask4: {
    flex: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
  },
  scanButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rescanButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instruction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    gap: 8,
  },
  instructionText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
