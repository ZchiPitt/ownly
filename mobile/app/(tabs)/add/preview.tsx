import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';

export default function AddPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    imageUri?: string;
    source?: string;
  }>();

  const imageUri = typeof params.imageUri === 'string' ? params.imageUri : null;
  const sourceLabel = params.source === 'camera' ? 'Camera' : params.source === 'library' ? 'Photo Library' : null;

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Photo Preview',
          headerLargeTitle: false,
        }}
      />
      <View style={styles.card}>
        <Text style={styles.title}>Preview</Text>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.previewImage} />
            {sourceLabel ? <Text style={styles.metaText}>Source: {sourceLabel}</Text> : null}
            <Text style={styles.body}>Photo selected. Continue when you are ready to analyze or add details.</Text>
          </>
        ) : (
          <Text style={styles.body}>No image selected yet. Return to Add and choose camera or photo library.</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/(tabs)/add')}
        >
          <Text style={styles.buttonText}>{imageUri ? 'Choose Another Photo' : 'Back to Add'}</Text>
        </Pressable>
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
    lineHeight: 20,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f2f2f7',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#0a84ff',
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
