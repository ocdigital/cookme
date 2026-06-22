import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  FlatList, Animated, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as C, typography as T, radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'barcode-scan' as const,
    iconColor: C.amber[500],
    iconBg: C.amber[50],
    title: 'Fotografe seu cupom fiscal',
    subtitle: 'Escaneie a nota e seus ingredientes entram na despensa automaticamente.',
  },
  {
    icon: 'fridge-outline' as const,
    iconColor: C.green[600],
    iconBg: C.green[50],
    title: 'Sua despensa sempre atualizada',
    subtitle: 'Veja o que está vencendo, o que acabou, e nunca desperdice comida de novo.',
  },
  {
    icon: 'chef-hat' as const,
    iconColor: C.green[500],
    iconBg: C.green[100],
    title: 'Receitas com o que você tem',
    subtitle: 'A IA sugere receitas baseadas exatamente no que está na sua despensa agora.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      router.push('/(auth)/register');
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.root}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>cookme<Text style={styles.logoDot}>.</Text></Text>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={56} color={item.iconColor} />
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const w = scrollX.interpolate({ inputRange, outputRange: [8, 22, 8], extrapolate: 'clamp' });
          const bg = scrollX.interpolate({
            inputRange,
            outputRange: [C.ink[200], C.green[500], C.ink[200]],
            extrapolate: 'clamp',
          });
          return <Animated.View key={i} style={[styles.dot, { width: w, backgroundColor: bg }]} />;
        })}
      </View>

      {/* CTAs */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>
            {isLast ? 'Criar conta grátis' : 'Próximo'}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={C.ink[0]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
          <Text style={styles.secondaryBtnText}>Já tenho conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink[0] },

  logoRow: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  logoText: { fontSize: 26, fontWeight: '800', color: C.green[600], letterSpacing: -0.5 },
  logoDot: { color: C.amber[500] },

  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
    flex: 1,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    ...T.h1,
    color: C.ink[900],
    textAlign: 'center',
  },
  slideSubtitle: {
    ...T.body,
    color: C.ink[500],
    textAlign: 'center',
    lineHeight: 24,
  },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 20 },
  dot: { height: 8, borderRadius: radius.pill, backgroundColor: C.ink[200] },

  footer: { paddingHorizontal: 24, paddingBottom: 36, gap: 12 },
  primaryBtn: {
    backgroundColor: C.green[500],
    paddingVertical: 16,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  secondaryBtnText: { ...T.body, color: C.green[600], fontWeight: '600' },
});
