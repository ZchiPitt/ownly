import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';

export default function AddPreviewScreen() {
  return (
    <Screen style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Preview</Text>
        <Text style={styles.body}>This is where the captured photo will appear.</Text>
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
  },
  body: {
    fontSize: 14,
    color: '#6e6e73',
  },
});
