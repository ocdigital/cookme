import { View, Text, StyleSheet } from 'react-native';

export default function ShoppingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Minha Lista de Compras</Text>
      <Text style={styles.subtext}>Em desenvolvimento...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#999',
  },
});
