import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';

export default function AddScreen() {
  const router = useRouter();
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleCameraCapture = async () => {
    setIsBusy(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        const message =
          'Camera access is required to capture item photos. Enable camera permission in iOS Settings, then try again.';
        setPermissionMessage(message);
        Alert.alert('Camera permission required', message);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setPermissionMessage(null);
      router.push({
        pathname: '/(tabs)/add/preview',
        params: {
          imageUri: result.assets[0].uri,
          source: 'camera',
          imageWidth: String(result.assets[0].width ?? ''),
          imageHeight: String(result.assets[0].height ?? ''),
          imageFileName: result.assets[0].fileName ?? '',
          imageMimeType: result.assets[0].mimeType ?? '',
        },
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleLibraryPick = async () => {
    setIsBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        const message =
          'Photo Library access is required to upload item photos. Enable Photos permission in iOS Settings, then try again.';
        setPermissionMessage(message);
        Alert.alert('Photo library permission required', message);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setPermissionMessage(null);
      router.push({
        pathname: '/(tabs)/add/preview',
        params: {
          imageUri: result.assets[0].uri,
          source: 'library',
          imageWidth: String(result.assets[0].width ?? ''),
          imageHeight: String(result.assets[0].height ?? ''),
          imageFileName: result.assets[0].fileName ?? '',
          imageMimeType: result.assets[0].mimeType ?? '',
        },
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add an Item</Text>
        <Text style={styles.subtitle}>Start with a photo or enter details manually.</Text>
        <Pressable
          onPress={handleCameraCapture}
          disabled={isBusy}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isBusy && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </Pressable>
        <Pressable
          onPress={handleLibraryPick}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
            isBusy && styles.secondaryButtonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Choose from Library</Text>
        </Pressable>
        {permissionMessage ? <Text style={styles.permissionMessage}>{permissionMessage}</Text> : null}
        <Link href="/(tabs)/add/manual" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.tertiaryButton,
              pressed && styles.tertiaryButtonPressed,
              isBusy && styles.tertiaryButtonDisabled,
            ]}
            disabled={isBusy}
          >
            <Text style={styles.tertiaryButtonText}>Enter Manually</Text>
          </Pressable>
        </Link>
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 16,
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
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0a84ff',
    backgroundColor: '#ffffff',
  },
  secondaryButtonPressed: {
    backgroundColor: '#f2f2f7',
  },
  secondaryButtonDisabled: {
    opacity: 0.55,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  permissionMessage: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#8e3b2d',
  },
  tertiaryButton: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
  },
  tertiaryButtonPressed: {
    backgroundColor: '#e5e5ea',
  },
  tertiaryButtonDisabled: {
    opacity: 0.55,
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
});
