import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const response = await api.get('/receitas', { params: { limit: 6 } });
      setRecipes(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerFixed}>
        <View style={styles.headerTop}>
          <View style={styles.locationSection}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#FF6B6B" />
            <View style={styles.locationText}>
              <Text style={styles.deliverLabel}>DELIVER TO</Text>
              <View style={styles.locationPicker}>
                <Text style={styles.locationName}>Minha Casa</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color="#333" />
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account-circle" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Hey {user?.nome?.split(' ')[0]}, {getGreeting()}!</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, ingredients"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* All Recipes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Recipes</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/recipes')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recipesGrid}>
            {recipes.slice(0, 2).map((recipe, idx) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push('/(app)/(tabs)/recipes')}
              >
                {recipe.imagem_url ? (
                  <Image
                    source={{ uri: recipe.imagem_url }}
                    style={styles.recipeImage}
                  />
                ) : (
                  <View style={styles.recipeImagePlaceholder}>
                    <MaterialCommunityIcons name="book-outline" size={40} color="#ddd" />
                  </View>
                )}
                <View style={styles.recipeCardContent}>
                  <Text style={styles.recipeCardTitle} numberOfLines={2}>
                    {recipe.nome}
                  </Text>
                  <View style={styles.recipeCardMeta}>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
                      <Text style={styles.metaText}>{recipe.tempo_preparo || '-'}min</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFA500" />
                      <Text style={styles.metaText}>{recipe.avaliacao_media?.toFixed(1) || '-'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Ingredients</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/shopping')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.popularSection}>
            <TouchableOpacity style={styles.popularCard} onPress={() => router.push('/(app)/qr-scanner')}>
              <MaterialCommunityIcons name="qrcode-scan" size={40} color="#FF6B6B" />
              <Text style={styles.popularText}>QR Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.popularCard} onPress={() => router.push('/(app)/receita-ocr')}>
              <MaterialCommunityIcons name="receipt" size={40} color="#FF6B6B" />
              <Text style={styles.popularText}>OCR Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.popularCard}>
              <MaterialCommunityIcons name="apple" size={40} color="#FF6B6B" />
              <Text style={styles.popularText}>Fresh Items</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerFixed: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  deliverLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  profileButton: {
    padding: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  greetingSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 24,
    top: 16,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 44,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  recipesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeCardContent: {
    padding: 12,
  },
  recipeCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipeCardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  popularSection: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  popularCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  spacing: {
    height: 20,
  },
});
