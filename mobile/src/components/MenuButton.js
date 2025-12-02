import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function MenuButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.menuButton}
      activeOpacity={0.6}
    >
      <Text style={styles.menuIcon}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
