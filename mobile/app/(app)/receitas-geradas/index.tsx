import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRecipeGenerator } from '@/hooks/useRecipeGenerator';

// Componente para renderizar imagem com fallback
function ReceitaImageComponent({ imageUrl }: { imageUrl?: string }) {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl) {
    return (
      <View style={[styles.receitaImagem, styles.imagemPlaceholder]}>
        <MaterialCommunityIcons name="image-off" size={48} color="#ddd" />
        <Text style={styles.imagemPlaceholderText}>Sem imagem</Text>
      </View>
    );
  }

  if (imageError) {
    return (
      <View style={[styles.receitaImagem, styles.imagemPlaceholder]}>
        <MaterialCommunityIcons name="image-broken" size={48} color="#ddd" />
        <Text style={styles.imagemPlaceholderText}>Erro ao carregar</Text>
      </View>
    );
  }

  return (
    <>
      <Image
        source={{ uri: imageUrl }}
        style={styles.receitaImagem}
        resizeMode="cover"
        onLoad={() => console.log('✅ Imagem carregada:', imageUrl.substring(0, 50))}
        onError={(error) => {
          console.log('❌ Erro ao carregar imagem:', imageUrl, error);
          setImageError(true);
        }}
      />
      <Text style={styles.debugUrl}>{imageUrl.substring(0, 60)}...</Text>
    </>
  );
}

export default function ReceitasGeradasScreen() {
  const router = useRouter();
  const { ingredientes_json } = useLocalSearchParams<{ ingredientes_json: string }>();
  const { receitas, loading, erro, gerarReceitas, limpar } = useRecipeGenerator();

  useEffect(() => {
    if (ingredientes_json) {
      const ingredientes = JSON.parse(ingredientes_json);
      gerarReceitas(ingredientes).catch(err => {
        console.error('Erro:', err);
      });
    }

    return () => limpar();
  }, [ingredientes_json]);

  if (erro) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receitas Geradas</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Erro ao gerar receitas</Text>
          <Text style={styles.errorDetails}>{erro}</Text>
          <TouchableOpacity style={styles.btnRetry} onPress={() => router.back()}>
            <Text style={styles.btnRetryText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receitas Sugeridas</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Gerando receitas com IA...</Text>
          <Text style={styles.loadingSubtext}>Isso pode levar alguns segundos</Text>
        </View>
      ) : receitas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chef-hat" size={64} color="#ddd" />
          <Text style={styles.emptyText}>Nenhuma receita gerada</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {receitas.map((receita, idx) => (
            <View key={idx} style={styles.receitaCard}>
              <View style={styles.receitaHeader}>
                <Text style={styles.receitaTitulo}>{receita.titulo}</Text>
                <View style={styles.dificuldadeBadge}>
                  <Text style={styles.dificuldadeText}>{receita.dificuldade}</Text>
                </View>
              </View>

              <View style={styles.imagemContainer}>
                <ReceitaImageComponent imageUrl={receita.imagem_url} />
              </View>

              <Text style={styles.receitaDescricao}>{receita.descricao}</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{receita.tempo_preparo}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={16} color="#666" />
                  <Text style={styles.infoText}>{receita.rendimento}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Ingredientes</Text>
              {receita.ingredientes.map((ing, i) => (
                <Text key={i} style={styles.ingredienteItem}>
                  • {ing}
                </Text>
              ))}

              <Text style={styles.sectionTitle}>Modo de Preparo</Text>
              <Text style={styles.modoPreparoText}>{receita.modo_preparo}</Text>

              <TouchableOpacity style={styles.btnUsar}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.btnUsarText}>Usar esta receita</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.spacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  receitaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  imagemContainer: {
    width: '100%',
    marginBottom: 12,
  },
  receitaImagem: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  imagemPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagemPlaceholderText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 6,
  },
  debugUrl: {
    fontSize: 10,
    color: '#999',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  receitaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receitaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  dificuldadeBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dificuldadeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  receitaDescricao: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  ingredienteItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 8,
  },
  modoPreparoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  btnUsar: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  btnUsarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  errorDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  btnRetry: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  btnRetryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
