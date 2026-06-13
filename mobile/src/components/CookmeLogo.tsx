import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, Rect, Circle, G } from 'react-native-svg';

const LG = {
  green: '#3FA365',
  amber: '#F3A82A',
  ink: '#1E1A14',
  paper: '#FBF7EF',
};

interface LogoIconProps {
  size?: number;
  color?: string;
  spark?: string;
}

export function LogoIcon({ size = 80, color = LG.green, spark = LG.amber }: LogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* pot body */}
      <Path d="M14 46 Q14 64 22 64 L58 64 Q66 64 66 46 Z" fill={color} />
      {/* lid (shifted up) */}
      <G transform="translate(0,-3)">
        <Ellipse cx="40" cy="38" rx="30" ry="6" fill={color} opacity={0.9} />
        <Rect x="36" y="29" width="8" height="8" rx="2" fill={color} />
      </G>
      {/* sparkles */}
      <Path d="M24 22 L25 18 L26 22 L30 23 L26 24 L25 28 L24 24 L20 23 Z" fill={spark} />
      <Path d="M52 14 L52.7 11 L53.5 14 L56.5 14.5 L53.5 15 L52.7 18 L52 15 L49 14.5 Z" fill={spark} />
      <Circle cx="40" cy="20" r="2" fill={spark} />
    </Svg>
  );
}

interface CookmeLogoProps {
  iconSize?: number;
  textSize?: number;
  showTagline?: boolean;
  tagline?: string;
  dark?: boolean;
}

export function CookmeLogo({
  iconSize = 80,
  textSize = 32,
  showTagline = false,
  tagline = 'Sua despensa inteligente',
  dark = false,
}: CookmeLogoProps) {
  const textColor = dark ? LG.paper : LG.ink;
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { width: iconSize + 16, height: iconSize + 16, borderRadius: (iconSize + 16) * 0.25 }]}>
        <LogoIcon size={iconSize} />
      </View>
      <Text style={[styles.wordmark, { fontSize: textSize, color: textColor, letterSpacing: textSize > 24 ? -1 : -0.5 }]}>
        cookme<Text style={{ color: LG.amber }}>.</Text>
      </Text>
      {showTagline && (
        <Text style={[styles.tagline, { color: dark ? LG.paper + 'AA' : '#6B7280' }]}>{tagline}</Text>
      )}
    </View>
  );
}

export function CookmeLogoHorizontal({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  const textColor = dark ? LG.paper : LG.ink;
  return (
    <View style={styles.horizontal}>
      <LogoIcon size={size} />
      <Text style={[styles.wordmark, { fontSize: size * 0.72, color: textColor, letterSpacing: -0.5 }]}>
        cookme<Text style={{ color: LG.amber }}>.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  iconWrapper: {
    backgroundColor: '#EDF7F1',
    borderWidth: 1,
    borderColor: '#C4E8D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  wordmark: {
    fontFamily: 'System',
    fontWeight: '800',
    lineHeight: 1.1 * 32,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '400',
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
