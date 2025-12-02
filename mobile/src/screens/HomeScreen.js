import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { inventarioService, receitasService } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [vencendo, setVencendo] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, vencendoData, sugestoesData] = await Promise.all([
        inventarioService.getStats(),
        inventarioService.getVencendo(7),
        receitasService.getSugestoes(),
      ]);

      setStats(statsData);
      setVencendo(vencendoData || []);
      setSugestoes((sugestoesData && Array.isArray(sugestoesData)) ? sugestoesData.slice(0, 3) : []); // Top 3 sugestões
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Olá, {user?.nome}! 👋</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Scanner Button */}
      <TouchableOpacity
        style={styles.scannerButton}
        onPress={() => navigation.navigate('QRScanner')}
      >
        <Text style={styles.scannerIcon}>📷</Text>
        <Text style={styles.scannerText}>Escanear Cupom Fiscal</Text>
        <Text style={styles.scannerSubtext}>
          Cadastre suas compras automaticamente
        </Text>
      </TouchableOpacity>

      {/* Quick Navigation */}
      <View style={styles.quickNavContainer}>
        <TouchableOpacity
          style={styles.quickNavButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.quickNavIcon}>📋</Text>
          <Text style={styles.quickNavText}>Histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavButton}
          onPress={() => navigation.navigate('Recipes')}
        >
          <Text style={styles.quickNavIcon}>👨‍🍳</Text>
          <Text style={styles.quickNavText}>Receitas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.quickNavIcon}>🛒</Text>
          <Text style={styles.quickNavText}>Produtos</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_itens || 0}</Text>
            <Text style={styles.statLabel}>Itens</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.itens_vencendo_7dias || 0}
            </Text>
            <Text style={styles.statLabel}>Vencendo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              R$ {stats.valor_estimado?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>Valor</Text>
          </View>
        </View>
      )}

      {/* Produtos Vencendo */}
      {vencendo.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Produtos Vencendo</Text>
          {vencendo.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>
                  {item.produto?.nome}
                </Text>
                <Text style={styles.listItemSubtitle}>
                  Vence em:{' '}
                  {new Date(item.data_validade).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text style={styles.listItemBadge}>
                {item.quantidade_disponivel} {item.unidade}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Sugestões de Receitas */}
      {sugestoes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Sugestões de Receitas</Text>
          {sugestoes.map((receita, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{receita.nome}</Text>
                <Text style={styles.listItemSubtitle}>
                  {receita.ingredientes_disponiveis}% dos ingredientes disponíveis
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {Math.round(receita.score * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🍳 CookMe - Motor de Otimização de Inventário
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
  },
  scannerButton: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scannerIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  scannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  scannerSubtext: {
    fontSize: 14,
    color: '#666',
  },
  quickNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  quickNavButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickNavIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  quickNavText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listItemBadge: {
    backgroundColor: '#FFB74D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
