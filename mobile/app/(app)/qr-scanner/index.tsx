import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '@/services/api';

const { width } = Dimensions.get('window');
const PREF_KEY = 'cookme_preferir_foto_cupom';

type SessionStatus =
  | 'iniciando'
  | 'consultando_sat'
  | 'aguardando_captcha'
  | 'processando_dados'
  | 'salvando_api'
  | 'concluido'
  | 'erro'
  | 'timeout'
  | 'cancelado';

interface ScraperSession {
  sessionId: string;
  status: SessionStatus;
  progress: number;
  captchaUrl?: string;
  compraId?: string;
  totalProdutos?: number;
  valorTotal?: number;
  erro?: string;
}

const STATUS_LABELS: Record<string, string> = {
  iniciando: 'Iniciando conexão...',
  consultando_sat: 'Consultando SEFAZ...',
  aguardando_captcha: 'Aguardando CAPTCHA...',
  processando_dados: 'Processando itens do cupom...',
  salvando_api: 'Salvando no inventário...',
  concluido: 'Concluído!',
  erro: 'Erro na consulta',
  timeout: 'Tempo esgotado',
  cancelado: 'Cancelado',
};

function isFiscalReceiptQR(data: string): boolean {
  const lower = data.toLowerCase();
  return (
    lower.includes('sefaz') ||
    lower.includes('fazenda') ||
    lower.includes('nfce') ||
    lower.includes('nfc-e') ||
    lower.includes('sat.') ||
    lower.includes('satsp') ||
    lower.includes('cf-e') ||
    lower.includes('cupomfiscal') ||
    lower.includes('portalsped') ||
    lower.includes('nfe.fazenda')
  );
}

export default function QRScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [session, setSession] = useState<ScraperSession | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [preferirFoto, setPreferirFoto] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const scannedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      const saved = await SecureStore.getItemAsync(PREF_KEY);
      if (saved === 'true') {
        // Preferência ativa — redireciona direto para OCR de foto
        router.replace('/(app)/receita-ocr');
      }
    })();
    return () => stopPolling();
  }, []);

  const togglePreferirFoto = async (value: boolean) => {
    setPreferirFoto(value);
    await SecureStore.setItemAsync(PREF_KEY, value ? 'true' : 'false');
    if (value) {
      router.replace('/(app)/receita-ocr');
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const irParaFoto = () => {
    scannedRef.current = false;
    setScanned(false);
    setProcessing(false);
    router.push('/(app)/receita-ocr');
  };

  const handleSessionComplete = useCallback(
    (s: ScraperSession) => {
      if (completedRef.current) return;
      completedRef.current = true;
      stopPolling();
      setShowModal(false);
      setSession(null);

      Alert.alert(
        'Cupom fiscal importado!',
        `${s.totalProdutos || 0} itens encontrados.\nValor total: R$ ${s.valorTotal?.toFixed(2) || '0,00'}`,
        [
          {
            text: 'Ver Inventário',
            onPress: () => {
              scannedRef.current = false;
              setScanned(false);
              router.push('/(app)/(tabs)');
            },
          },
        ],
      );
    },
    [router],
  );

  const handleSessionError = useCallback((s: ScraperSession) => {
    if (completedRef.current) return;
    completedRef.current = true;
    stopPolling();
    setShowModal(false);
    setSession(null);

    const msg =
      s.status === 'timeout'
        ? 'A consulta expirou.'
        : s.erro || 'Falha ao consultar o cupom fiscal.';

    Alert.alert(
      'Não foi possível ler o QR Code',
      `${msg}\n\nDeseja fotografar o cupom para tentar com OCR?`,
      [
        {
          text: 'Fotografar cupom',
          onPress: irParaFoto,
        },
        {
          text: 'Tentar QR novamente',
          onPress: () => {
            scannedRef.current = false;
            setScanned(false);
            completedRef.current = false;
          },
        },
      ],
    );
  }, []);

  const pollStatus = useCallback(
    (sessionId: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.get<ScraperSession>(`/scraper/consultas/${sessionId}`);
          const s = res.data;
          setSession(s);

          if (s.status === 'concluido') {
            handleSessionComplete(s);
          } else if (
            s.status === 'erro' ||
            s.status === 'timeout' ||
            s.status === 'cancelado'
          ) {
            handleSessionError(s);
          }
        } catch {
          // Network error — keep polling
        }
      }, 2500);
    },
    [handleSessionComplete, handleSessionError],
  );

  const handleFiscalReceiptQR = async (data: string) => {
    setProcessing(true);
    try {
      const res = await api.post<ScraperSession>('/scraper/consultas', {
        qrcodeTexto: data,
      });
      const s = res.data;
      setSession(s);
      setShowModal(true);
      setProcessing(false);
      pollStatus(s.sessionId);
    } catch (err: any) {
      setProcessing(false);
      const msg =
        err?.response?.data?.message ||
        'Não foi possível iniciar a consulta.';

      Alert.alert(
        'Erro ao consultar SEFAZ',
        `${msg}\n\nDeseja fotografar o cupom para tentar com OCR?`,
        [
          { text: 'Fotografar cupom', onPress: irParaFoto },
          {
            text: 'Tentar novamente',
            onPress: () => {
              scannedRef.current = false;
              setScanned(false);
            },
          },
        ],
      );
    }
  };

  const handleProductBarcode = async (data: string) => {
    setProcessing(false);
    Alert.alert('Código de Barras', `Código: ${data}`, [
      { text: 'Cancelar', onPress: () => setScanned(false) },
      {
        text: 'Buscar Produto',
        onPress: () => {
          Alert.alert('Em breve', 'Busca por código de barras em desenvolvimento.');
          setScanned(false);
        },
      },
    ]);
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    completedRef.current = false;
    setScanned(true);
    setProcessing(true);

    if (isFiscalReceiptQR(data)) {
      await handleFiscalReceiptQR(data);
    } else {
      await handleProductBarcode(data);
    }
  };

  const handleCancelSession = async () => {
    if (!session) return;
    stopPolling();
    try {
      await api.delete(`/scraper/consultas/${session.sessionId}`);
    } catch {
      // Ignore
    }
    setShowModal(false);
    setSession(null);
    scannedRef.current = false;
    setScanned(false);
    setProcessing(false);
    completedRef.current = false;
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

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.processingText}>Iniciando consulta...</Text>
          </View>
        )}
      </CameraView>

      {/* Botão fotografar + toggle preferência */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.fotoBtn} onPress={irParaFoto}>
          <MaterialCommunityIcons name="camera" size={18} color="#fff" />
          <Text style={styles.fotoBtnText}>Fotografar cupom</Text>
        </TouchableOpacity>

        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>Sempre usar foto</Text>
          <Switch
            value={preferirFoto}
            onValueChange={togglePreferirFoto}
            trackColor={{ false: '#555', true: '#FF6B6B' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.instruction}>
        <MaterialCommunityIcons name="qrcode" size={20} color="#FF6B6B" />
        <Text style={styles.instructionText}>
          QR de cupom fiscal ou código de produto
        </Text>
      </View>

      {/* Modal de progresso SEFAZ */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelSession}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Consultando Cupom Fiscal</Text>

            <View style={styles.progressRow}>
              {session?.status === 'concluido' ? (
                <MaterialCommunityIcons name="check-circle" size={40} color="#22c55e" />
              ) : session?.status === 'erro' || session?.status === 'timeout' ? (
                <MaterialCommunityIcons name="alert-circle" size={40} color="#ef4444" />
              ) : (
                <ActivityIndicator size="large" color="#FF6B6B" />
              )}
            </View>

            <Text style={styles.statusLabel}>
              {STATUS_LABELS[session?.status || 'iniciando']}
            </Text>

            {session?.status === 'aguardando_captcha' && (
              <Text style={styles.captchaHint}>
                Resolva o CAPTCHA no navegador aberto no computador onde o servidor está rodando.{'\n'}
                O app será atualizado automaticamente.
              </Text>
            )}

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${session?.progress || 0}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>{session?.progress || 0}%</Text>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSession}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  unmask1: { flex: 1 },
  middleRow: { flexDirection: 'row', height: 220 },
  unmask2: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  frameBox: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameCorner1: {
    position: 'absolute', width: 20, height: 20,
    borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#FF6B6B', top: -2, left: -2,
  },
  frameCorner2: {
    position: 'absolute', width: 20, height: 20,
    borderTopWidth: 3, borderRightWidth: 3, borderColor: '#FF6B6B', top: -2, right: -2,
  },
  frameCorner3: {
    position: 'absolute', width: 20, height: 20,
    borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#FF6B6B', bottom: -2, left: -2,
  },
  frameCorner4: {
    position: 'absolute', width: 20, height: 20,
    borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#FF6B6B', bottom: -2, right: -2,
  },
  frameText: { fontSize: 12, color: '#FF6B6B', textAlign: 'center' },
  unmask3: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  unmask4: { flex: 1 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingText: { color: '#fff', marginTop: 16, fontSize: 14 },
  bottomBar: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  fotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  fotoBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  prefLabel: { color: '#aaa', fontSize: 13 },
  instruction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    gap: 8,
  },
  instructionText: { color: '#FF6B6B', fontSize: 13, fontWeight: '600' },
  centeredContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  loadingText: { marginTop: 16, fontSize: 14, color: '#999' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  errorText: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  backButton: {
    backgroundColor: '#FF6B6B', paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 8, marginTop: 24,
  },
  backButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressRow: { marginBottom: 16 },
  statusLabel: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
    minHeight: 20,
  },
  captchaHint: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelBtnText: { fontSize: 14, color: '#666' },
});
