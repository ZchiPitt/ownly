import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { ItemEditorForm, Screen, type ItemEditorValues } from '../../../components';
import { useAuth } from '../../../contexts';
import { useCreateInventoryItemMutation } from '../../../hooks';
import { supabase } from '../../../lib';

function toPublicUrl(path: string | undefined): string | null {
  if (!path?.trim()) {
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('items').getPublicUrl(path.trim());

  return publicUrl || null;
}

export default function ManualAddScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const createItemMutation = useCreateInventoryItemMutation();
  const params = useLocalSearchParams<{
    imageUri?: string;
    thumbnailUri?: string;
    imagePath?: string;
    thumbnailPath?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    sourceBatchId?: string;
  }>();

  const imageUri = typeof params.imageUri === 'string' ? params.imageUri : '';
  const thumbnailUri = typeof params.thumbnailUri === 'string' ? params.thumbnailUri : '';
  const imagePath = typeof params.imagePath === 'string' ? params.imagePath.trim() : '';
  const thumbnailPath = typeof params.thumbnailPath === 'string' ? params.thumbnailPath.trim() : '';
  const imageUrlParam = typeof params.imageUrl === 'string' ? params.imageUrl.trim() : '';
  const thumbnailUrlParam = typeof params.thumbnailUrl === 'string' ? params.thumbnailUrl.trim() : '';
  const sourceBatchId = typeof params.sourceBatchId === 'string' ? params.sourceBatchId.trim() : '';

  const imageUrl = useMemo(() => {
    if (imageUrlParam) {
      return imageUrlParam;
    }
    if (imagePath) {
      return toPublicUrl(imagePath) ?? '';
    }
    return imageUri;
  }, [imagePath, imageUri, imageUrlParam]);

  const thumbnailUrl = useMemo(() => {
    if (thumbnailUrlParam) {
      return thumbnailUrlParam;
    }
    if (thumbnailPath) {
      return toPublicUrl(thumbnailPath) ?? null;
    }
    return thumbnailUri || null;
  }, [thumbnailPath, thumbnailUri, thumbnailUrlParam]);

  const handleSubmit = async (values: ItemEditorValues) => {
    if (!user?.id) {
      return;
    }

    try {
      await createItemMutation.mutateAsync({
        userId: user.id,
        values,
        photoUrl: imageUrl || undefined,
        thumbnailUrl,
        sourceBatchId: sourceBatchId || null,
      });
      Alert.alert('Item created', `${values.name.trim() || 'Item'} has been added to your inventory.`);
      router.replace('/(tabs)/inventory');
    } catch (error) {
      Alert.alert('Could not create item', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!user?.id) {
    return null;
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: 'Manual Entry',
          headerLargeTitle: false,
        }}
      />
      {imageUrl ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Selected Photo</Text>
          <Image source={{ uri: imageUrl }} resizeMode="cover" style={styles.previewImage} />
        </View>
      ) : null}
      <ItemEditorForm mode="create" userId={user.id} onSubmit={handleSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    padding: 12,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#f2f2f7',
  },
});
