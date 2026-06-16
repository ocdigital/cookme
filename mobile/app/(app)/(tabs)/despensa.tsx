import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, TextInput, Platform, AppState, Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenTutorial from '@/components/ScreenTutorial';
import { useScreenTutorial } from '@/hooks/useScreenTutorial';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES, GC_TIMES } from '@/lib/queryClient';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import { useMutationQueueStore } from '@/stores/mutationQueue.store';
import { OfflineIndicator } from '@/components/OfflineIndicator';

interface Produto {
  id: string;
  nome: string;
  nome_original?: string;
  produto_id?: string;
  quantidade_disponivel: number;
  unidade: string;
  confianca_classificacao?: number;
  ingrediente_receita?: boolean;
  esgotado?: boolean;
  data_validade?: string | null;
}

type VencStatus = 'vencido' | 'urgente' | 'atencao' | 'ok' | 'sem_data';

function diasParaVencer(data?: string | null): number | null {
  if (!data) return null;
  const diff = new Date(data).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function vencStatus(data?: string | null): VencStatus {
  const dias = diasParaVencer(data);
  if (dias === null) return 'sem_data';
  if (dias < 0) return 'vencido';
  if (dias <= 2) return 'urgente';
  if (dias <= 7) return 'atencao';
  return 'ok';
}

const VENC_COLORS: Record<VencStatus, { bg: string; text: string; border: string }> = {
  vencido:  { bg: C.red[50],    text: C.red[600],    border: C.red[200] },
  urgente:  { bg: C.red[50],    text: C.red[600],    border: C.red[200] },
  atencao:  { bg: C.amber[50],  text: C.amber[700],  border: C.amber[200] },
  ok:       { bg: C.green[50],  text: C.green[700],  border: C.green[200] },
  sem_data: { bg: C.ink[100],   text: C.ink[400],    border: C.ink[200] },
};

function VencBadge({ data }: { data?: string | null }) {
  const dias = diasParaVencer(data);
  const status = vencStatus(data);
  const c = VENC_COLORS[status];

  let label = '';
  if (status === 'sem_data') label = 'sem data';
  else if (status === 'vencido') label = `venceu há ${Math.abs(dias!)}d`;
  else if (dias === 0) label = 'vence hoje';
  else label = `${dias}d`;

  const icon =
    status === 'vencido' ? 'calendar-remove' :
    status === 'urgente' ? 'calendar-alert' :
    status === 'atencao' ? 'calendar-clock' :
    status === 'sem_data' ? 'calendar-question' :
    'calendar-check';

  return (
    <View style={[styles.vencBadge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <MaterialCommunityIcons name={icon} size={11} color={c.text} />
      <Text style={[styles.vencText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

function EditValidadeModal({
  item,
  visible,
  onClose,
  onSave,
}: {
  item: Produto | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, data: string) => void;
}) {
  const [valor, setValor] = useState('');

  React.useEffect(() => {
    if (item?.data_validade) {
      // Formata para dd/mm/aaaa
      const d = new Date(item.data_validade);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      setValor(`${dia}/${mes}/${d.getFullYear()}`);
    } else {
      setValor('');
    }
  }, [item]);

  const handleSave = () => {
    if (!item) return;
    const parts = valor.split('/');
    if (parts.length !== 3) {
      Alert.alert('Data inválida', 'Use o formato dd/mm/aaaa');
      return;
    }
    const [dia, mes, ano] = parts;
    const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
    if (isNaN(date.getTime())) {
      Alert.alert('Data inválida', 'Use o formato dd/mm/aaaa');
      return;
    }
    onSave(item.id, date.toISOString());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Data de validade</Text>
          <Text style={styles.modalSub}>{item?.nome}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="dd/mm/aaaa"
            placeholderTextColor={C.ink[400]}
            value={valor}
            onChangeText={(text) => {
              // Remove tudo que não é dígito
              const digits = text.replace(/\D/g, '');
              // Aplica máscara dd/mm/aaaa
              let masked = digits;
              if (digits.length > 2) masked = digits.slice(0, 2) + '/' + digits.slice(2);
              if (digits.length > 4) masked = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
              setValor(masked);
            }}
            keyboardType="numeric"
            maxLength={10}
            autoFocus
          />
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalBtnSecondary} onPress={onClose}>
              <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSave}>
              <Text style={styles.modalBtnPrimaryText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

type ImportResult = {
  importados: string[];
  ignorados: string[];
  ja_existiam: string[];
} | null;

export default function DespensaScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<Produto | null>(null);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>(null);
  const [editandoNome, setEditandoNome] = useState<Produto | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addNome, setAddNome] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const insets = useSafeAreaInsets();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable;
  const { enqueue } = useMutationQueueStore();

  const { showTutorial, dismissTutorial } = useScreenTutorial('despensa');

  // ── Barcode scanner ──
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState<'camera' | 'result'>('camera');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [barcodeUrl, setBarcodeUrl] = useState('');
  const [webViewReady, setWebViewReady] = useState(false);

  // ─── Query principal ──────────────────────────────────────────────────────────
  const { data: inventarioData, isFetching: loading, refetch } = useQuery({
    queryKey: queryKeys.inventario(),
    queryFn: async () => {
      const response = await api.get('/inventario');
      const lista = response.data?.produtos || response.data?.data || [];
      const arr: Produto[] = Array.isArray(lista) ? lista : [];
      arr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
      return arr;
    },
    staleTime: STALE_TIMES.inventario,
    gcTime: GC_TIMES.inventario,
  });

  const produtos: Produto[] = inventarioData ?? [];

  const invalidateInventario = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inventario() });
  }, [queryClient]);

  // Recarrega ao focar
  useFocusEffect(useCallback(() => { invalidateInventario(); }, []));

  // Recarrega quando app volta do background
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        invalidateInventario();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [invalidateInventario]);

  const onRefresh = async () => {
    await refetch();
  };

  const removerProduto = (id: string) => {
    Alert.alert('Remover', 'Deseja remover este item da despensa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          // Optimistic update
          const prev = queryClient.getQueryData<Produto[]>(queryKeys.inventario()) ?? [];
          queryClient.setQueryData<Produto[]>(queryKeys.inventario(), prev.filter(x => x.id !== id));
          try {
            await api.delete(`/inventario/${id}`);
          } catch {
            queryClient.setQueryData(queryKeys.inventario(), prev);
            Alert.alert('Erro', 'Falha ao remover produto');
          }
        },
      },
    ]);
  };

  const marcarEsgotado = async (id: string, esgotado: boolean) => {
    // Optimistic update
    const prev = queryClient.getQueryData<Produto[]>(queryKeys.inventario()) ?? [];
    queryClient.setQueryData<Produto[]>(queryKeys.inventario(), prev.map(x => x.id === id ? { ...x, esgotado } : x));
    if (!isOnline) {
      // Offline: enfileirar para sync quando reconectar
      enqueue({
        method: 'patch',
        url: `/inventario/${id}/esgotado`,
        data: { esgotado },
        invalidateKeys: [Array.from(queryKeys.inventario())],
      });
      return;
    }
    try {
      await api.patch(`/inventario/${id}/esgotado`, { esgotado });
    } catch {
      queryClient.setQueryData(queryKeys.inventario(), prev);
      Alert.alert('Erro', 'Falha ao atualizar ingrediente');
    }
  };

  const abrirEditNome = (item: Produto) => {
    setEditandoNome(item);
    setNovoNome(item.nome);
  };

  const salvarNome = async () => {
    if (!editandoNome || !novoNome.trim()) return;
    setSalvandoNome(true);
    try {
      await api.patch(`/inventario/${editandoNome.id}/nome`, { nome: novoNome.trim() });
      const prev = queryClient.getQueryData<Produto[]>(queryKeys.inventario()) ?? [];
      queryClient.setQueryData<Produto[]>(queryKeys.inventario(), prev.map(x => x.id === editandoNome.id ? { ...x, nome: novoNome.trim() } : x));
      setEditandoNome(null);
    } catch {
      Alert.alert('Erro', 'Falha ao salvar nome');
    } finally {
      setSalvandoNome(false);
    }
  };

  const openBarcodeScanner = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) { Alert.alert('Câmera', 'Permissão de câmera necessária'); return; }
    }
    setScanned(false);
    setCodigoEscaneado('');
    setBarcodeUrl('');
    setWebViewReady(false);
    setBarcodeMode('camera');
    setBarcodeModalVisible(true);
  };

  const handleBarcodeScanned = ({ data: barcode }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(80);
    setCodigoEscaneado(barcode);
    setBarcodeMode('result');
    setBarcodeUrl(`https://www.google.com/search?q=${encodeURIComponent(barcode)}&hl=pt-BR&gl=br`);
  };

  const resetBarcodeModal = () => {
    setBarcodeModalVisible(false);
    setScanned(false);
    setCodigoEscaneado('');
    setBarcodeUrl('');
    setWebViewReady(false);
  };

  const importarIngredientes = async () => {
    setImportando(true);
    try {
      const response = await api.post('/inventario/importar-automatico');
      const result: ImportResult = response.data;
      setImportResult(result);
      if ((result?.importados?.length ?? 0) > 0) {
        invalidateInventario();
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao importar ingredientes');
    } finally {
      setImportando(false);
    }
  };

  const salvarValidade = async (id: string, data: string) => {
    const prev = queryClient.getQueryData<Produto[]>(queryKeys.inventario()) ?? [];
    queryClient.setQueryData<Produto[]>(queryKeys.inventario(), prev.map(x => x.id === id ? { ...x, data_validade: data } : x));
    try {
      await api.put(`/inventario/${id}`, { data_validade: data });
    } catch {
      queryClient.setQueryData(queryKeys.inventario(), prev);
      Alert.alert('Erro', 'Falha ao salvar data de validade');
    }
  };

  const abrirAddModal = () => {
    setAddNome('');
    setAddModalVisible(true);
  };

  const confirmarAdicionar = async () => {
    if (!addNome.trim()) { Alert.alert('Erro', 'Informe o nome do ingrediente'); return; }
    setAdicionando(true);
    try {
      await api.post('/inventario/adicionar-manual', {
        nome: addNome.trim(),
        quantidade: 1,
        unidade: 'un',
      });
      setAddModalVisible(false);
      invalidateInventario();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao adicionar ingrediente');
    } finally {
      setAdicionando(false);
    }
  };

  const alimentos = produtos.filter(p => p.ingrediente_receita !== false && !p.esgotado);
  const vencendoBreve = produtos.filter(p => {
    const s = vencStatus(p.data_validade);
    return (s === 'urgente' || s === 'atencao' || s === 'vencido') && !p.esgotado;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={22} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Minha despensa</Text>
          <Text style={styles.headerTitle}>{produtos.length} itens</Text>
        </View>
        <TouchableOpacity style={styles.fabBarcode} onPress={openBarcodeScanner}>
          <MaterialCommunityIcons name="barcode-scan" size={22} color={C.green[600]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabScan, importando && styles.fabScanLoading]}
          onPress={importarIngredientes}
          disabled={importando}
        >
          {importando
            ? <ActivityIndicator size="small" color={C.ink[0]} />
            : <MaterialCommunityIcons name="download-circle-outline" size={22} color={C.ink[0]} />
          }
        </TouchableOpacity>
      </View>

      {/* Chips de navegação */}
      <View style={styles.navChipsRow}>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/receita-ocr')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="qrcode-scan" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Escanear Cupom</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navChip} onPress={() => router.push('/(app)/compras' as any)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="shopping-outline" size={13} color={C.ink[500]} />
          <Text style={styles.navChipTxt}>Compras</Text>
        </TouchableOpacity>
      </View>

      <OfflineIndicator queryKey={Array.from(queryKeys.inventario())} />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={C.green[500]} /></View>
      ) : produtos.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="fridge-outline" size={52} color={C.green[500]} />
          </View>
          <Text style={styles.emptyTitle}>Despensa vazia</Text>
          <Text style={styles.emptySub}>Importe seus ingredientes automaticamente a partir das suas compras registradas.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={importarIngredientes} disabled={importando}>
            {importando
              ? <ActivityIndicator size="small" color={C.ink[0]} />
              : <MaterialCommunityIcons name="download-circle-outline" size={18} color={C.ink[0]} />
            }
            <Text style={styles.emptyBtnText}>Importar Ingredientes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={C.green[500]} />}
          ListHeaderComponent={() => (
            <>
              {/* Card de geração de receitas */}
              <View style={styles.insightCard}>
                <View style={styles.insightIconWrap}>
                  <MaterialCommunityIcons name="food-apple-outline" size={18} color={C.ink[0]} />
                </View>
                <Text style={styles.insightText}>{alimentos.length} ingredientes disponíveis</Text>
              </View>

              {/* Alerta de vencimento */}
              {vencendoBreve.length > 0 && (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => router.push({
                    pathname: '/(app)/receitas-geradas',
                    params: { ingredientes_json: JSON.stringify(vencendoBreve.map(p => p.nome)) },
                  })}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="clock-alert-outline" size={20} color={C.amber[700]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>
                      {vencendoBreve.length} {vencendoBreve.length === 1 ? 'item vencendo' : 'itens vencendo'} em breve
                    </Text>
                    <Text style={styles.alertSub}>Toque para ver receitas que usam esses ingredientes</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={C.amber[600]} />
                </TouchableOpacity>
              )}

              <View style={{ height: 4 }} />
            </>
          )}
          renderItem={({ item }) => {
            const status = vencStatus(item.data_validade);
            const cardBorder =
              status === 'vencido' ? C.red[200] :
              status === 'urgente' ? C.red[200] :
              status === 'atencao' ? C.amber[200] :
              C.ink[150];

            return (
              <View style={[styles.card, item.esgotado && styles.cardEsgotado, { borderColor: cardBorder }]}>
                <View style={[styles.cardIcon, {
                  backgroundColor: item.esgotado ? C.ink[100] :
                    status === 'vencido' || status === 'urgente' ? C.red[50] :
                    status === 'atencao' ? C.amber[50] :
                    item.ingrediente_receita !== false ? C.green[50] : C.ink[100],
                }]}>
                  <MaterialCommunityIcons
                    name={item.esgotado ? 'package-variant-closed-remove' : item.ingrediente_receita !== false ? 'food-apple-outline' : 'package-variant'}
                    size={22}
                    color={item.esgotado ? C.ink[400] :
                      status === 'vencido' || status === 'urgente' ? C.red[500] :
                      status === 'atencao' ? C.amber[600] :
                      item.ingrediente_receita !== false ? C.green[500] : C.ink[400]}
                  />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={[styles.cardNome, item.esgotado && styles.cardNomeEsgotado]}>{item.nome}</Text>
                  {item.nome_original && item.nome_original.toLowerCase() !== item.nome.toLowerCase() && (
                    <Text style={{ fontSize: 10, color: C.ink[400], marginTop: 1 }} numberOfLines={1}>
                      {item.nome_original}
                    </Text>
                  )}
                  <View style={styles.cardMeta}>
                    {item.esgotado ? (
                      <View style={styles.tagEsgotado}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={11} color={C.red[600]} />
                        <Text style={styles.tagEsgotadoText}>acabou</Text>
                      </View>
                    ) : item.ingrediente_receita === false ? (
                      <View style={styles.tagNaoAlimento}>
                        <Text style={styles.tagText}>não-alimento</Text>
                      </View>
                    ) : null}
                  </View>
                  {/* Badge de validade — toque para editar */}
                  {!item.esgotado && (
                    <TouchableOpacity onPress={() => setEditando(item)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} style={{ alignSelf: 'flex-start', marginTop: 5 }}>
                      <VencBadge data={item.data_validade} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardRight}>
                  {item.ingrediente_receita !== false && (
                    <TouchableOpacity
                      style={[styles.btnAcabou, item.esgotado && styles.btnAcabouAtivo]}
                      onPress={() => marcarEsgotado(item.id, !item.esgotado)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialCommunityIcons
                        name={item.esgotado ? 'refresh' : 'close-circle-outline'}
                        size={13}
                        color={item.esgotado ? C.green[600] : C.red[500]}
                      />
                      <Text style={[styles.btnAcabouText, item.esgotado && { color: C.green[600] }]}>
                        {item.esgotado ? 'Tem ainda' : 'Acabou'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => abrirEditNome(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={C.ink[300]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removerProduto(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.ink[300]} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal barcode scanner */}
      <Modal visible={barcodeModalVisible} animationType="slide" transparent onRequestClose={resetBarcodeModal}>
        <View style={styles.barcodeOverlay}>
          {barcodeMode === 'camera' && (
            <View style={styles.bcCameraSheet}>
              <View style={styles.bcHandle} />
              <View style={styles.bcCameraHeader}>
                <Text style={styles.bcCameraTitle}>Escanear código de barras</Text>
                <TouchableOpacity onPress={resetBarcodeModal} style={styles.bcCloseBtn}>
                  <MaterialCommunityIcons name="close" size={18} color={C.ink[700]} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, position: 'relative' }}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'code128', 'upc_a', 'upc_e', 'code39'],
                  }}
                />
                <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
                  <View style={{ width: 240, height: 140, position: 'relative' }}>
                    <View style={[styles.bcCorner, styles.bcCornerTL]} />
                    <View style={[styles.bcCorner, styles.bcCornerTR]} />
                    <View style={[styles.bcCorner, styles.bcCornerBL]} />
                    <View style={[styles.bcCorner, styles.bcCornerBR]} />
                  </View>
                  <Text style={styles.bcHint}>Aponte para o código de barras do produto</Text>
                </View>
              </View>
            </View>
          )}

          {barcodeMode === 'result' && (
            <View style={styles.bcResultSheet}>
              <View style={styles.bcHandle} />
              <View style={styles.bcResultHeader}>
                <Text style={styles.bcResultTitle}>Pesquisa de produto</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.bcRescanBtn} onPress={() => { setScanned(false); setBarcodeUrl(''); setCodigoEscaneado(''); setWebViewReady(false); setBarcodeMode('camera'); }}>
                    <MaterialCommunityIcons name="camera" size={16} color={C.green[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bcCloseBtn} onPress={resetBarcodeModal}>
                    <MaterialCommunityIcons name="close" size={18} color={C.ink[600]} />
                  </TouchableOpacity>
                </View>
              </View>
              {!webViewReady && (
                <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, StyleSheet.absoluteFillObject, { backgroundColor: C.ink[0], zIndex: 10 }]}>
                  <ActivityIndicator size="large" color={C.green[500]} />
                  <Text style={{ ...T.body, color: C.ink[400] }}>Buscando produto...</Text>
                </View>
              )}
              <WebView
                source={{ uri: barcodeUrl }}
                style={{ flex: 1, opacity: webViewReady ? 1 : 0 }}
                startInLoadingState
                injectedJavaScript={`
                  (function() {
                    var style = document.createElement('style');
                    style.textContent = '#searchform, #appbar, header, .o3j99, .minidiv, #top_nav, form[role="search"] { display: none !important; }';
                    document.head.appendChild(style);
                    setTimeout(function() {
                      var rso = document.getElementById('rso');
                      if (rso) window.scrollTo(0, rso.offsetTop - 8);
                      window.ReactNativeWebView.postMessage('ready');
                    }, 800);
                  })();
                  true;
                `}
                onMessage={(e) => { if (e.nativeEvent.data === 'ready') setWebViewReady(true); }}
              />
            </View>
          )}
        </View>
      </Modal>

      {/* FAB adicionar ingrediente */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 6 }]}
        onPress={abrirAddModal}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={26} color={C.ink[0]} />
      </TouchableOpacity>


      {/* Modal adicionar ingrediente manual */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAddModalVisible(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Adicionar ingrediente</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Arroz, Feijão, Leite..."
              placeholderTextColor={C.ink[400]}
              value={addNome}
              onChangeText={setAddNome}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={confirmarAdicionar}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={confirmarAdicionar} disabled={adicionando}>
                <Text style={styles.modalBtnPrimaryText}>{adicionando ? 'Adicionando...' : 'Adicionar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScreenTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        steps={[
          { icon: 'fridge-outline', title: 'Minha despensa', description: 'Aqui ficam todos os ingredientes que você tem em casa, com controle de validade e quantidade.' },
          { icon: 'download-circle-outline', iconBg: '#dcfce7', iconColor: '#16a34a', title: 'Importar ingredientes', description: 'Toque no botão verde para importar automaticamente ingredientes das suas compras registradas.' },
          { icon: 'barcode-scan', title: 'Busca por código de barras', description: 'Escaneie o código de barras de um produto para pesquisar informações e preços na internet.' },
        ]}
      />

      <EditValidadeModal
        item={editando}
        visible={editando !== null}
        onClose={() => setEditando(null)}
        onSave={salvarValidade}
      />

      {/* Modal editar nome do ingrediente */}
      <Modal visible={editandoNome !== null} transparent animationType="fade" onRequestClose={() => setEditandoNome(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditandoNome(null)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Corrigir ingrediente</Text>
            {editandoNome?.nome_original && (
              <Text style={styles.modalSub}>OCR original: {editandoNome.nome_original}</Text>
            )}
            <TextInput
              style={styles.modalInput}
              value={novoNome}
              onChangeText={setNovoNome}
              placeholder="Nome do ingrediente"
              placeholderTextColor={C.ink[400]}
              autoFocus
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={salvarNome}
            />
            <Text style={styles.editNomeTip}>
              Ao salvar, o sistema aprende este alias e o usa automaticamente em novas compras.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setEditandoNome(null)}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={salvarNome} disabled={salvandoNome}>
                <Text style={styles.modalBtnPrimaryText}>{salvandoNome ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal resultado da importação */}
      <Modal visible={importResult !== null} transparent animationType="fade" onRequestClose={() => setImportResult(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setImportResult(null)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <View style={styles.importResultIcon}>
              <MaterialCommunityIcons
                name={importResult?.importados?.length ? 'check-circle-outline' : 'information-outline'}
                size={36}
                color={importResult?.importados?.length ? C.green[500] : C.ink[400]}
              />
            </View>
            <Text style={styles.modalTitle}>Importação concluída</Text>

            {importResult?.importados?.length === 0 && importResult?.ja_existiam?.length === 0 ? (
              <Text style={styles.importResultSub}>
                Nenhum ingrediente novo encontrado nas compras pendentes.
              </Text>
            ) : (
              <>
                {(importResult?.importados?.length ?? 0) > 0 && (
                  <View style={styles.importSection}>
                    <View style={styles.importSectionHeader}>
                      <MaterialCommunityIcons name="plus-circle-outline" size={15} color={C.green[600]} />
                      <Text style={styles.importSectionTitle}>{importResult!.importados.length} ingrediente{importResult!.importados.length !== 1 ? 's' : ''} adicionado{importResult!.importados.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <Text style={styles.importList}>{importResult!.importados.join(', ')}</Text>
                  </View>
                )}
                {(importResult?.ja_existiam?.length ?? 0) > 0 && (
                  <View style={styles.importSection}>
                    <View style={styles.importSectionHeader}>
                      <MaterialCommunityIcons name="check-circle-outline" size={15} color={C.ink[400]} />
                      <Text style={[styles.importSectionTitle, { color: C.ink[500] }]}>{importResult!.ja_existiam.length} já na despensa</Text>
                    </View>
                  </View>
                )}
                {(importResult?.ignorados?.length ?? 0) > 0 && (
                  <View style={styles.importSection}>
                    <View style={styles.importSectionHeader}>
                      <MaterialCommunityIcons name="minus-circle-outline" size={15} color={C.ink[400]} />
                      <Text style={[styles.importSectionTitle, { color: C.ink[400] }]}>{importResult!.ignorados.length} não são ingredientes (ignorados)</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => setImportResult(null)}>
              <Text style={styles.modalBtnPrimaryText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  menuBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },
  fabBarcode: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200],
    alignItems: 'center', justifyContent: 'center', ...shadows.sm,
  },
  fabScan: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center', ...shadows.md,
  },
  fabScanLoading: { backgroundColor: C.green[400], opacity: 0.8 },
  barcodeOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  bcCameraSheet: {
    height: '75%', backgroundColor: C.ink[0],
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    overflow: 'hidden', ...shadows.modal,
  },
  bcResultSheet: {
    height: '70%', backgroundColor: C.ink[0],
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    ...shadows.modal,
  },
  bcHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.ink[200], alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  bcCameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  bcCameraTitle: { ...T.h3, color: C.ink[900] },
  bcResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16 },
  bcResultTitle: { ...T.h3, color: C.ink[900] },
  bcCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center' },
  bcRescanBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], alignItems: 'center', justifyContent: 'center',
  },
  bcCorner: { position: 'absolute', width: 24, height: 24, borderColor: C.green[400], borderWidth: 3 },
  bcCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  bcCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bcCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  bcCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  bcHint: { ...T.small, color: C.ink[0], marginTop: 24, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  insightCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.green[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.green[100], padding: 12, marginBottom: 10,
  },
  insightIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
  },
  insightText: { ...T.small, color: C.green[700], fontWeight: '600', flex: 1 },
  btnGerar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.green[500], paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm,
  },
  btnGerarText: { ...T.small, color: C.ink[0], fontWeight: '700' },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.amber[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.amber[200], padding: 12, marginBottom: 10,
  },
  alertTitle: { ...T.small, color: C.amber[800], fontWeight: '700' },
  alertSub: { ...T.micro, color: C.amber[700], marginTop: 1 },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 96 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.ink[0], borderRadius: radius.md,
    padding: 14, borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
  },
  cardIcon: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardNome: { ...T.h3, fontSize: 15, color: C.ink[900], marginBottom: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagNaoAlimento: { backgroundColor: C.ink[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  tagText: { ...T.micro, color: C.ink[600], letterSpacing: 0 },
  cardEsgotado: { opacity: 0.65, borderColor: C.red[100], backgroundColor: C.red[50] },
  cardNomeEsgotado: { textDecorationLine: 'line-through', color: C.ink[400] },
  tagEsgotado: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.red[50], borderRadius: radius.pill,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.red[100],
  },
  tagEsgotadoText: { ...T.micro, color: C.red[600], fontWeight: '700' },
  btnAcabou: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: C.red[200], borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 4, backgroundColor: C.red[50],
  },
  btnAcabouAtivo: { borderColor: C.green[200], backgroundColor: C.green[50] },
  btnAcabouText: { ...T.micro, color: C.red[500], fontWeight: '700' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  vencBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1,
  },
  vencText: { fontSize: 11, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h2, color: C.ink[900] },
  emptySub: { ...T.body, color: C.ink[500], textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[500], paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: radius.md, marginTop: 8, ...shadows.md,
  },
  emptyBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    padding: 24, width: '85%', gap: 12,
    ...shadows.modal,
  },
  modalTitle: { ...T.h2, color: C.ink[900] },
  modalSub: { ...T.small, color: C.ink[500], marginTop: -4 },
  modalInput: {
    borderWidth: 1, borderColor: C.ink[200], borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    ...T.body, color: C.ink[900], backgroundColor: C.ink[50], marginTop: 4,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtnSecondary: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.ink[200], alignItems: 'center',
  },
  modalBtnSecondaryText: { ...T.body, color: C.ink[600], fontWeight: '600' },
  modalBtnPrimary: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: C.green[500], alignItems: 'center',
  },
  modalBtnPrimaryText: { ...T.body, color: C.ink[0], fontWeight: '700' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  editNomeTip: { ...T.micro, color: C.ink[400], fontStyle: 'italic', lineHeight: 16, marginTop: -4 },
  importResultIcon: { alignItems: 'center', marginBottom: 4 },
  importResultSub: { ...T.body, color: C.ink[500], textAlign: 'center', lineHeight: 20 },
  importSection: { width: '100%', gap: 4 },
  importSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  importSectionTitle: { ...T.small, color: C.green[700], fontWeight: '700' },
  importList: { ...T.small, color: C.ink[600], lineHeight: 18, paddingLeft: 21 },
  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.green[500],
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
    elevation: 6,
  },

  navChipsRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.ink[50], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  navChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.ink[200],
    backgroundColor: C.ink[0],
  },
  navChipTxt: { ...T.micro, color: C.ink[600], fontWeight: '500' },
});
