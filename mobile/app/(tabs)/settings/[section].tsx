import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';

export default function SettingsDetailScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();

  return (
    <Screen style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{section}</Text>
        <Text style={styles.body}>Settings detail screen placeholder.</Text>
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
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  body: {
    fontSize: 14,
    color: '#6e6e73',
  },
});
