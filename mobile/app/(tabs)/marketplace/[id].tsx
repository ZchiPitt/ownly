import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';

export default function MarketplaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Listing Detail</Text>
        <Text style={styles.value}>Listing ID: {id}</Text>
        <Text style={styles.value}>Condition: Excellent</Text>
        <Text style={styles.value}>Seller: Ownly Community</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  value: {
    fontSize: 15,
    color: '#3a3a3c',
    marginBottom: 6,
  },
});
