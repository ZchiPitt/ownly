import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../../components';

export default function SearchScreen() {
  return (
    <Screen style={styles.container}>
      <Text style={styles.label}>Search inventory</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder='Try "tent" or "kitchen"'
          placeholderTextColor="#8e8e93"
          style={styles.input}
        />
      </View>
      <Link href="/(tabs)/search/results" asChild>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Show Results</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#6e6e73',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  button: {
    backgroundColor: '#0a84ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#007aff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
