import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = 100;
const MAX_PHOTOS = 10;

type Step = 'choose' | 'camera' | 'gallery' | 'processing' | 'review' | 'success';

interface OcrResult {
  items: Array<{ name: string; quantity: number; price: number }>;
  duplicates: string[];
  total: number;
}

export default function ReceiptOcrScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('choose');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPhotos([...photos, photo.uri]);
        Alert.alert('Foto Capturada', `${photos.length + 1}/${MAX_PHOTOS} fotos`, [
          { text: 'Capturar Mais' },
          { text: 'Processar', onPress: () => { setCurrentStep('processing'); processPhotos([...photos, photo.uri]); } },
        ]);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao capturar foto');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled) {
        const allPhotos = [...photos, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS);
        setPhotos(allPhotos);
        Alert.alert('Imagens Selecionadas', `Total: ${allPhotos.length}/${MAX_PHOTOS} fotos`, [
          { text: 'Adicionar Mais' },
          { text: 'Processar', onPress: () => { setCurrentStep('processing'); processPhotos(allPhotos); } },
        ]);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao selecionar imagens');
    }
  };

  const processPhotos = async (photosToProcess: string[]) => {
    if (photosToProcess.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma foto');
      setCurrentStep('choose');
      return;
    }
    setIsLoading(true);
    try {
      const ocrTexts = await Promise.all(
        photosToProcess.map(async (photoUri) => {
          try {
            const response = await fetch(photoUri);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
            });
            reader.readAsDataURL(blob);
            const base64 = await base64Promise;
            const ocrResponse = await api.post('/receitas/ocr/extract-from-image', { image: base64, mimeType: 'image/jpeg' });
            return ocrResponse.data.ocrText || '';
          } catch { return ''; }
        })
      );
      const validOcrTexts = ocrTexts.filter(t => t.length > 0);
      if (validOcrTexts.length === 0) {
        Alert.alert('Erro', 'Não consegui ler nenhuma imagem. Tente fotos mais claras.');
        setCurrentStep('choose');
        setIsLoading(false);
        return;
      }
      const response = await api.post('/receitas/ocr/process', {
        photos: validOcrTexts.map((text, idx) => ({ ocrText: text, photoNumber: idx + 1, totalPhotos: validOcrTexts.length })),
        ignoreWarnings: false,
      });
      setOcrResult({
        items: response.data.items.map((item: any) => ({ name: item.nome, quantity: item.quantidade, price: item.preco_total })),
        duplicates: response.data.duplicatesFlagged?.map((d: any) => d.nome) || [],
        total: response.data.items.reduce((sum: number, item: any) => sum + item.preco_total, 0),
      });
      setCurrentStep('review');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao processar cupom');
      setCurrentStep('choose');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!ocrResult || ocrResult.items.length === 0) { Alert.alert('Erro', 'Nenhum item para validar'); return; }
    try {
      setIsLoading(true);
      const classificationResponse = await api.post('/receitas/ocr/classify-items', {
        items: ocrResult.items.map(item => ({ nome: item.name, preco_total: item.price, quantidade: item.quantity })),
      });
      const produtosJson = JSON.stringify(
        classificationResponse.data.items.map((item: any) => ({
          nome: item.nome,
          categoria: item.categoria,
          confianca_classificacao: Math.round(item.confianca * 100),
          motivo: item.descricao || 'Classificado automaticamente',
          ingrediente_receita: item.ingrediente_receita,
          requer_validacao: item.requer_validacao,
        }))
      );
      router.push({ pathname: '/(app)/validacao', params: { produtos_json: produtosJson } });
    } catch {
      const produtosJson = JSON.stringify(
        ocrResult.items.map(item => ({ nome: item.name, categoria: 'Indefinido', confianca_classificacao: 50, motivo: 'Erro ao classificar - confirme manualmente', ingrediente_receita: null, requer_validacao: true }))
      );
      router.push({ pathname: '/(app)/validacao', params: { produtos_json: produtosJson } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    setPhotos([]); setOcrResult(null); setCurrentStep('choose'); router.back();
  };

  // --- PERMISSION ---
  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={C.green[500]} />
        <Text style={styles.permissionText}>Solicitando permissão...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionIconWrap}>
          <MaterialCommunityIcons name="camera-off" size={32} color={C.red[500]} />
        </View>
        <Text style={styles.permissionTitle}>Câmera não autorizada</Text>
        <Text style={styles.permissionSub}>Permita o acesso à câmera nas configurações</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => router.back()}>
          <Text style={styles.permissionBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ===== CHOOSE =====
  if (currentStep === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digitalizar Cupom</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.chooseContent} showsVerticalScrollIndicator={false}>
          <View style={styles.chooseHero}>
            <View style={styles.chooseIconWrap}>
              <MaterialCommunityIcons name="receipt" size={40} color={C.green[600]} />
            </View>
            <Text style={styles.chooseTitle}>Capturar Cupom Fiscal</Text>
            <Text style={styles.chooseSub}>Fotografe o cupom para extrair os itens automaticamente</Text>
          </View>

          <View style={styles.chooseOptions}>
            <TouchableOpacity style={styles.optionCard} onPress={() => setCurrentStep('camera')} activeOpacity={0.7}>
              <View style={[styles.optionIcon, { backgroundColor: C.green[50] }]}>
                <MaterialCommunityIcons name="camera" size={28} color={C.green[600]} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Usar Câmera</Text>
                <Text style={styles.optionSub}>Fotografe o cupom agora</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={pickFromGallery} activeOpacity={0.7}>
              <View style={[styles.optionIcon, { backgroundColor: C.amber[50] }]}>
                <MaterialCommunityIcons name="image-multiple" size={28} color={C.amber[600]} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Galeria</Text>
                <Text style={styles.optionSub}>Escolha fotos existentes</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, styles.optionCardTest]}
              onPress={() => { setCurrentStep('processing'); processPhotos(['test']); }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: C.ink[100] }]}>
                <MaterialCommunityIcons name="beaker-outline" size={28} color={C.ink[500]} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: C.ink[500] }]}>Modo de Teste</Text>
                <Text style={styles.optionSub}>3 cupons de exemplo</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
            </TouchableOpacity>
          </View>

          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color={C.amber[600]} />
            <Text style={styles.tipText}>Dica: Até {MAX_PHOTOS} fotos para melhor resultado. Garanta boa iluminação.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== CAMERA =====
  if (currentStep === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back">
          {/* Overlay escuro */}
          <SafeAreaView style={styles.cameraUI}>
            {/* Top bar */}
            <View style={styles.cameraTopBar}>
              <TouchableOpacity style={styles.camBtn} onPress={() => setCurrentStep('choose')}>
                <MaterialCommunityIcons name="close" size={20} color={C.ink[0]} />
              </TouchableOpacity>
              <View style={styles.camCounterWrap}>
                <View style={styles.camDot} />
                <Text style={styles.camCounter}>{photos.length}/{MAX_PHOTOS} fotos</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* Frame */}
            <View style={styles.frameArea}>
              <View style={styles.frameBracketTL} />
              <View style={styles.frameBracketTR} />
              <View style={styles.frameBracketBL} />
              <View style={styles.frameBracketBR} />
              <Text style={styles.frameHint}>Alinhe o cupom dentro da área</Text>
            </View>

            {/* Photo strip */}
            {photos.length > 0 && (
              <FlatList
                data={photos}
                horizontal
                keyExtractor={(_, i) => i.toString()}
                style={styles.photoStrip}
                contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
                renderItem={({ item, index }) => (
                  <View>
                    <Image source={{ uri: item }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.removeThumb} onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
                      <MaterialCommunityIcons name="close" size={12} color={C.ink[0]} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            {/* Bottom controls */}
            <View style={styles.cameraBottomBar}>
              <TouchableOpacity
                style={[styles.processBtn, photos.length === 0 && { opacity: 0.4 }]}
                disabled={photos.length === 0}
                onPress={() => { setCurrentStep('processing'); processPhotos(photos); }}
              >
                <Text style={styles.processBtnText}>Processar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>

              <View style={{ width: 80 }} />
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ===== PROCESSING =====
  if (currentStep === 'processing') {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingCard}>
          <View style={styles.processingIconWrap}>
            <ActivityIndicator size="large" color={C.green[500]} />
          </View>
          <Text style={styles.processingTitle}>Processando cupom</Text>
          <Text style={styles.processingSub}>Extraindo itens com IA...</Text>
          <View style={styles.processingDots}>
            {[0, 1, 2].map(i => <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.3 }]} />)}
          </View>
        </View>
      </View>
    );
  }

  // ===== REVIEW =====
  if (currentStep === 'review' && ocrResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBack} onPress={() => setCurrentStep('choose')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revisar Itens</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.reviewContent}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{ocrResult.items.length}</Text>
              <Text style={styles.statLbl}>Itens</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMid]}>
              <Text style={[styles.statValue, { color: ocrResult.duplicates.length > 0 ? C.amber[600] : C.green[600] }]}>
                {ocrResult.duplicates.length}
              </Text>
              <Text style={styles.statLbl}>Duplicatas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>R$ {ocrResult.total.toFixed(2)}</Text>
              <Text style={styles.statLbl}>Total</Text>
            </View>
          </View>

          {ocrResult.duplicates.length > 0 && (
            <View style={styles.duplicateCard}>
              <View style={styles.duplicateHeader}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={C.amber[600]} />
                <Text style={styles.duplicateTitle}>Duplicatas detectadas</Text>
              </View>
              {ocrResult.duplicates.map((dup, i) => (
                <Text key={i} style={styles.duplicateItem}>{dup}</Text>
              ))}
            </View>
          )}

          <Text style={styles.reviewSectionTitle}>Itens extraídos</Text>
          {ocrResult.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, i === ocrResult.items.length - 1 && styles.itemRowLast]}>
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons name="package-variant-closed" size={16} color={C.ink[400]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qtd: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setCurrentStep('choose')}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator size="small" color={C.ink[0]} />
              : <>
                  <MaterialCommunityIcons name="check" size={18} color={C.ink[0]} />
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== SUCCESS =====
  if (currentStep === 'success') {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successIconWrap}>
          <MaterialCommunityIcons name="check-circle" size={48} color={C.green[600]} />
        </View>
        <Text style={styles.successTitle}>Cupom Digitalizado!</Text>
        <Text style={styles.successSub}>{ocrResult?.items.length} itens extraídos com sucesso</Text>
        <View style={styles.successStats}>
          <View style={styles.successStat}>
            <Text style={styles.successStatLabel}>Total</Text>
            <Text style={styles.successStatValue}>R$ {ocrResult?.total.toFixed(2)}</Text>
          </View>
          {(ocrResult?.duplicates.length ?? 0) > 0 && (
            <View style={[styles.successStat, { borderLeftWidth: 1, borderLeftColor: C.ink[150] }]}>
              <Text style={styles.successStatLabel}>Duplicatas</Text>
              <Text style={styles.successStatValue}>{ocrResult?.duplicates.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Concluído</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
}

const FRAME_W = width - 48;
const FRAME_H = 220;
const BRACKET = 24;
const BRACKET_T = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  headerBack: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...T.h3, color: C.ink[900] },

  // Permission
  permissionContainer: { flex: 1, backgroundColor: C.ink[50], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  permissionIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.red[50], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  permissionTitle: { ...T.h3, color: C.ink[900] },
  permissionSub: { ...T.body, color: C.ink[500], textAlign: 'center' },
  permissionBtn: { backgroundColor: C.green[500], paddingVertical: 12, paddingHorizontal: 32, borderRadius: radius.md, marginTop: 8, ...shadows.sm },
  permissionText: { ...T.body, color: C.ink[500], marginTop: 12 },
  permissionBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // Choose
  chooseContent: { padding: 20, paddingBottom: 40, gap: 20 },
  chooseHero: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  chooseIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  chooseTitle: { ...T.h2, color: C.ink[900] },
  chooseSub: { ...T.body, color: C.ink[500], textAlign: 'center' },
  chooseOptions: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150],
    padding: 16, ...shadows.sm,
  },
  optionCardTest: { borderStyle: 'dashed', borderColor: C.ink[200] },
  optionIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  optionTitle: { ...T.h3, color: C.ink[900] },
  optionSub: { ...T.small, color: C.ink[500], marginTop: 2 },
  tipCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: C.amber[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.amber[200], padding: 12,
  },
  tipText: { ...T.small, color: C.amber[700], flex: 1 },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: C.ink[900] },
  cameraUI: { flex: 1, justifyContent: 'space-between' },
  cameraTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  camBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  camCounterWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  camDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber[400] },
  camCounter: { ...T.small, color: C.ink[0] },

  // Frame brackets
  frameArea: {
    width: FRAME_W, height: FRAME_H,
    alignSelf: 'center',
    justifyContent: 'flex-end', alignItems: 'center',
    paddingBottom: 12,
  },
  frameBracketTL: { position: 'absolute', top: 0, left: 0, width: BRACKET, height: BRACKET, borderTopWidth: BRACKET_T, borderLeftWidth: BRACKET_T, borderColor: C.amber[400], borderTopLeftRadius: 4 },
  frameBracketTR: { position: 'absolute', top: 0, right: 0, width: BRACKET, height: BRACKET, borderTopWidth: BRACKET_T, borderRightWidth: BRACKET_T, borderColor: C.amber[400], borderTopRightRadius: 4 },
  frameBracketBL: { position: 'absolute', bottom: 0, left: 0, width: BRACKET, height: BRACKET, borderBottomWidth: BRACKET_T, borderLeftWidth: BRACKET_T, borderColor: C.amber[400], borderBottomLeftRadius: 4 },
  frameBracketBR: { position: 'absolute', bottom: 0, right: 0, width: BRACKET, height: BRACKET, borderBottomWidth: BRACKET_T, borderRightWidth: BRACKET_T, borderColor: C.amber[400], borderBottomRightRadius: 4 },
  frameHint: { ...T.small, color: 'rgba(255,255,255,0.7)' },

  photoStrip: { maxHeight: 116, marginBottom: 8 },
  photoThumb: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: radius.sm, borderWidth: 2, borderColor: C.green[500] },
  removeThumb: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: C.ink[800], alignItems: 'center', justifyContent: 'center' },

  cameraBottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12,
  },
  shutterBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: C.ink[0],
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.ink[0] },
  processBtn: {
    width: 80, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: C.green[500], alignItems: 'center',
  },
  processBtnText: { ...T.small, color: C.ink[0], fontWeight: '700' },

  // Processing
  processingContainer: { flex: 1, backgroundColor: C.ink[900], alignItems: 'center', justifyContent: 'center' },
  processingCard: {
    backgroundColor: C.ink[800], borderRadius: radius.xl, padding: 32,
    alignItems: 'center', gap: 12, width: width - 80,
    borderWidth: 1, borderColor: C.ink[700],
  },
  processingIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.ink[700], alignItems: 'center', justifyContent: 'center' },
  processingTitle: { ...T.h3, color: C.ink[0] },
  processingSub: { ...T.body, color: C.ink[400] },
  processingDots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green[400] },

  // Review
  reviewContent: { padding: 20, paddingBottom: 24 },
  statsRow: {
    flexDirection: 'row', backgroundColor: C.ink[0],
    borderRadius: radius.lg, borderWidth: 1, borderColor: C.ink[150],
    overflow: 'hidden', marginBottom: 16, ...shadows.sm,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statCardMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.ink[150] },
  statValue: { ...T.h3, color: C.ink[900] },
  statLbl: { ...T.micro, color: C.ink[400], marginTop: 2 },
  duplicateCard: {
    backgroundColor: C.amber[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.amber[200], padding: 12, marginBottom: 16,
  },
  duplicateHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  duplicateTitle: { ...T.small, color: C.amber[700], fontWeight: '700' },
  duplicateItem: { ...T.small, color: C.amber[700], paddingLeft: 22, paddingVertical: 2 },
  reviewSectionTitle: { ...T.micro, color: C.ink[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.ink[0], paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.ink[150],
    borderTopWidth: 1, borderTopColor: C.ink[150], marginTop: -1,
    borderRadius: 0,
  },
  itemRowLast: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  itemIconWrap: { width: 32, height: 32, borderRadius: radius.xs, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  itemName: { ...T.body, color: C.ink[800], fontWeight: '600' },
  itemQty: { ...T.small, color: C.ink[400], marginTop: 1 },
  itemPrice: { ...T.body, color: C.ink[700], fontWeight: '600' },
  reviewActions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: C.ink[0], borderTopWidth: 1, borderTopColor: C.ink[150],
  },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: C.ink[0], borderWidth: 1, borderColor: C.ink[200], alignItems: 'center' },
  cancelBtnText: { ...T.body, color: C.ink[700], fontWeight: '600' },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: radius.md, backgroundColor: C.green[500], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, ...shadows.sm },
  confirmBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },

  // Success
  successContainer: { flex: 1, backgroundColor: C.ink[50], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  successIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { ...T.h1, color: C.ink[900] },
  successSub: { ...T.body, color: C.ink[500] },
  successStats: {
    flexDirection: 'row', backgroundColor: C.ink[0],
    borderRadius: radius.lg, borderWidth: 1, borderColor: C.ink[150],
    overflow: 'hidden', marginTop: 8, ...shadows.sm, alignSelf: 'stretch',
  },
  successStat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  successStatLabel: { ...T.small, color: C.ink[400] },
  successStatValue: { ...T.h3, color: C.ink[900], marginTop: 2 },
  doneBtn: { backgroundColor: C.green[500], paddingVertical: 14, paddingHorizontal: 40, borderRadius: radius.md, marginTop: 8, ...shadows.md },
  doneBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
