import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ItemAIMetadata } from '../../../../src/types/database';
import { Screen, type ItemEditorValues } from '../../../components';
import { useAuth } from '../../../contexts';
import { useCreateInventoryItemMutation } from '../../../hooks';

function parseTags(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  } catch {
    return [];
  }
}

function parseBbox(value: string | undefined): [number, number, number, number] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length !== 4) {
      return undefined;
    }

    const numeric = parsed.map((part) => Number(part));
    if (numeric.some((part) => !Number.isFinite(part))) {
      return undefined;
    }

    return numeric as [number, number, number, number];
  } catch {
    return undefined;
  }
}

export default function QuickAddScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createItemMutation = useCreateInventoryItemMutation();
  const params = useLocalSearchParams<{
    imageUrl?: string;
    thumbnailUrl?: string;
    sourceBatchId?: string;
    detectedName?: string;
    detectedCategory?: string;
    detectedBrand?: string;
    detectedTags?: string;
    detectedBbox?: string;
    confidence?: string;
    analysisModel?: string;
    analyzedAt?: string;
  }>();

  const detectedName = typeof params.detectedName === 'string' ? params.detectedName.trim() : '';
  const detectedCategory = typeof params.detectedCategory === 'string' ? params.detectedCategory.trim() : '';
  const detectedBrand = typeof params.detectedBrand === 'string' ? params.detectedBrand.trim() : '';
  const imageUrl = typeof params.imageUrl === 'string' ? params.imageUrl : '';
  const thumbnailUrl = typeof params.thumbnailUrl === 'string' ? params.thumbnailUrl : '';
  const sourceBatchId = typeof params.sourceBatchId === 'string' ? params.sourceBatchId.trim() : '';
  const analysisModel = typeof params.analysisModel === 'string' ? params.analysisModel.trim() : '';
  const analyzedAt = typeof params.analyzedAt === 'string' ? params.analyzedAt.trim() : '';

  const detectedTags = useMemo(
    () => parseTags(typeof params.detectedTags === 'string' ? params.detectedTags : undefined),
    [params.detectedTags],
  );
  const detectedBbox = useMemo(
    () => parseBbox(typeof params.detectedBbox === 'string' ? params.detectedBbox : undefined),
    [params.detectedBbox],
  );
  const confidenceScore = useMemo(() => {
    if (typeof params.confidence !== 'string') {
      return 0;
    }
    const parsed = Number(params.confidence);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.confidence]);

  const aiMetadata: ItemAIMetadata = {
    detected_name: detectedName || undefined,
    detected_category: detectedCategory || undefined,
    detected_tags: detectedTags,
    detected_brand: detectedBrand || undefined,
    confidence_score: confidenceScore,
    analysis_provider: 'analyze-image',
    analysis_model: analysisModel || undefined,
    analyzed_at: analyzedAt || undefined,
    detected_bbox: detectedBbox,
  };

  const handleConfirmQuickAdd = async () => {
    if (!user?.id) {
      return;
    }

    const values: ItemEditorValues = {
      name: detectedName || 'Untitled item',
      description: '',
      quantity: 1,
      categoryId: null,
      locationId: null,
      tags: detectedTags,
      price: '',
      currency: 'USD',
      purchaseDate: '',
      expirationDate: '',
      warrantyExpiryDate: '',
      brand: detectedBrand,
      model: '',
    };

    try {
      await createItemMutation.mutateAsync({
        userId: user.id,
        values,
        photoUrl: imageUrl || undefined,
        thumbnailUrl: thumbnailUrl || null,
        aiMetadata,
        sourceBatchId: sourceBatchId || null,
      });

      Alert.alert('Item added', `${values.name} was saved to your inventory.`);
      router.replace('/(tabs)/inventory');
    } catch (error) {
      Alert.alert('Quick add failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!user?.id) {
    return null;
  }

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Quick Add',
          headerLargeTitle: false,
        }}
      />
      <View style={styles.card}>
        <Text style={styles.title}>Confirm Quick Add</Text>
        <Text style={styles.subtitle}>We found one item. Save it now, then edit later if needed.</Text>

        {imageUrl ? <Image source={{ uri: imageUrl }} resizeMode="cover" style={styles.previewImage} /> : null}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name</Text>
          <Text style={styles.summaryValue}>{detectedName || 'Untitled item'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Confidence</Text>
          <Text style={styles.summaryValue}>{Math.round(confidenceScore * 100)}%</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Category</Text>
          <Text style={styles.summaryValue}>{detectedCategory || 'Not detected'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Brand</Text>
          <Text style={styles.summaryValue}>{detectedBrand || 'Not detected'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tags</Text>
          <Text style={styles.summaryValue}>{detectedTags.length ? detectedTags.join(', ') : 'None'}</Text>
        </View>

        <Pressable
          onPress={handleConfirmQuickAdd}
          disabled={createItemMutation.isPending}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            createItemMutation.isPending && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.primaryButtonText}>{createItemMutation.isPending ? 'Saving...' : 'Quick Add Item'}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/add/manual',
              params: {
                imageUri: imageUrl,
                thumbnailUri: thumbnailUrl,
              },
            })
          }
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
        >
          <Text style={styles.secondaryButtonText}>Edit Before Saving</Text>
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6e6e73',
    lineHeight: 20,
  },
  previewImage: {
    marginTop: 14,
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  summaryRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1c1c1e',
    flex: 1,
    textAlign: 'right',
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#34c759',
  },
  primaryButtonPressed: {
    backgroundColor: '#30b357',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0a84ff',
  },
  secondaryButtonPressed: {
    backgroundColor: '#f2f2f7',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
});
