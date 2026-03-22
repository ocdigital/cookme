import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';

const DrawerContent = (props) => {
  const { navigation } = props;

  const menuItems = [
    {
      section: 'COMPRAS',
      items: [
        { label: 'Minhas Compras', icon: 'shopping-bag', screen: 'Compras' },
        { label: 'Minha Lista', icon: 'list-box', screen: 'MinhaLista' },
        { label: 'Análise de Gastos', icon: 'chart-line', screen: 'Analise' },
        { label: 'Histórico de Preços', icon: 'history', screen: 'HistoricoPrecos' },
      ],
    },
    {
      section: 'NAVEGAÇÃO',
      items: [
        { label: 'Categorias', icon: 'folder-multiple', screen: 'Categorias' },
        { label: 'Meus Favoritos', icon: 'heart', screen: 'Favorites' },
      ],
    },
    {
      section: 'CONTA',
      items: [
        { label: 'Meu Perfil', icon: 'account', screen: 'Profile' },
        { label: 'Configurações', icon: 'cog', screen: 'Settings' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView {...props} scrollEnabled={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="cart" size={40} color="#ff6b6b" />
          </View>
          <Text style={styles.appName}>CookMe</Text>
          <Text style={styles.appSubtitle}>Sua economia no mercado</Text>
        </View>

        <View style={styles.divider} />

        {/* Menu Items */}
        {menuItems.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.section}</Text>

            {section.items.map((item, itemIdx) => (
              <TouchableOpacity
                key={itemIdx}
                style={styles.menuItem}
                onPress={() => {
                  navigation.navigate(item.screen);
                  navigation.closeDrawer();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color="#666"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#ccc"
                  style={styles.menuChevron}
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.divider} />

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="information" size={20} color="#2196f3" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Versão 1.0</Text>
              <Text style={styles.infoDesc}>Beta</Text>
            </View>
          </View>
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn}>
          <MaterialCommunityIcons name="help-circle" size={20} color="#2196f3" />
          <Text style={styles.footerBtnText}>Ajuda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn}>
          <MaterialCommunityIcons name="logout" size={20} color="#ff6b6b" />
          <Text style={styles.footerBtnText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff3f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuChevron: {
    marginLeft: 8,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196f3',
  },
  infoDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  footerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

export default DrawerContent;
