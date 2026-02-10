import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DetectedItem } from '../../../../src/types/api';
import type { ItemAIMetadata } from '../../../../src/types/database';
import { ItemEditorForm, Screen, type ItemEditorValues } from '../../../components';
import { useAuth } from '../../../contexts';
import { useCreateInventoryItemMutation } from '../../../hooks';

type BatchStage = 'select' | 'edit';

function parseDetectedItems(value: string | undefined): DetectedItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is DetectedItem => typeof entry?.name === 'string' && entry.name.trim().length > 0);
  } catch {
    return [];
  }
}

function toItemEditorValues(detectedItem: DetectedItem): Partial<ItemEditorValues> {
  return {
    name: detectedItem.name?.trim() || 'Untitled item',
    description: '',
    quantity: 1,
    tags: (detectedItem.tags ?? []).filter((tag): tag is string => typeof tag === 'string' && !!tag.trim()),
    price: '',
    currency: 'USD',
    purchaseDate: '',
    expirationDate: '',
    warrantyExpiryDate: '',
    brand: detectedItem.brand?.trim() ?? '',
    model: '',
  };
}

function toAiMetadata(
  detectedItem: DetectedItem,
  analysisModel: string,
  analyzedAt: string,
): ItemAIMetadata {
  return {
    detected_name: detectedItem.name || undefined,
    detected_category: detectedItem.category_suggestion || undefined,
    detected_tags: (detectedItem.tags ?? []).filter((tag): tag is string => typeof tag === 'string' && !!tag.trim()),
    detected_brand: detectedItem.brand || undefined,
    confidence_score: Number.isFinite(detectedItem.confidence) ? detectedItem.confidence : 0,
    analysis_provider: 'analyze-image',
    analysis_model: analysisModel || undefined,
    analyzed_at: analyzedAt || undefined,
    detected_bbox: detectedItem.bbox,
  };
}

export default function BatchAddScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createItemMutation = useCreateInventoryItemMutation();
  const params = useLocalSearchParams<{
    imageUrl?: string;
    thumbnailUrl?: string;
    sourceBatchId?: string;
    detectedItems?: string;
    analysisModel?: string;
    analyzedAt?: string;
  }>();

  const imageUrl = typeof params.imageUrl === 'string' ? params.imageUrl : '';
  const thumbnailUrl = typeof params.thumbnailUrl === 'string' ? params.thumbnailUrl : '';
  const sourceBatchId = typeof params.sourceBatchId === 'string' ? params.sourceBatchId.trim() : '';
  const analysisModel = typeof params.analysisModel === 'string' ? params.analysisModel.trim() : '';
  const analyzedAt = typeof params.analyzedAt === 'string' ? params.analyzedAt.trim() : '';

  const detectedItems = useMemo(
    () => parseDetectedItems(typeof params.detectedItems === 'string' ? params.detectedItems : undefined),
    [params.detectedItems],
  );

  const [stage, setStage] = useState<BatchStage>('select');
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [editQueue, setEditQueue] = useState<number[]>([]);
  const [editCursor, setEditCursor] = useState(0);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  useEffect(() => {
    setSelectedIndexes(detectedItems.map((_, index) => index));
  }, [detectedItems]);

  const selectedDetections = useMemo(
    () => selectedIndexes.map((index) => detectedItems[index]).filter((item): item is DetectedItem => !!item),
    [detectedItems, selectedIndexes],
  );
  const currentEditIndex = editQueue[editCursor];
  const currentDetectedItem = detectedItems[currentEditIndex];

  const toggleSelected = (index: number) => {
    setSelectedIndexes((previous) =>
      previous.includes(index) ? previous.filter((entry) => entry !== index) : [...previous, index].sort((a, b) => a - b),
    );
  };

  const createDetectedItem = async (detectedItem: DetectedItem, values: ItemEditorValues) => {
    if (!user?.id) {
      return;
    }

    await createItemMutation.mutateAsync({
      userId: user.id,
      values,
      photoUrl: imageUrl || undefined,
      thumbnailUrl: thumbnailUrl || null,
      sourceBatchId: sourceBatchId || null,
      aiMetadata: toAiMetadata(detectedItem, analysisModel, analyzedAt),
    });
  };

  const handleBatchSave = async () => {
    if (!selectedDetections.length) {
      Alert.alert('Select at least one item', 'Choose one or more detections before saving.');
      return;
    }

    setIsSavingBatch(true);
    try {
      for (const detectedItem of selectedDetections) {
        const values = {
          ...toItemEditorValues(detectedItem),
          name: toItemEditorValues(detectedItem).name ?? 'Untitled item',
          description: '',
          quantity: 1,
          categoryId: null,
          locationId: null,
          tags: toItemEditorValues(detectedItem).tags ?? [],
          price: '',
          currency: 'USD',
          purchaseDate: '',
          expirationDate: '',
          warrantyExpiryDate: '',
          brand: toItemEditorValues(detectedItem).brand ?? '',
          model: '',
        };
        await createDetectedItem(detectedItem, values);
      }

      Alert.alert('Items saved', `${selectedDetections.length} item(s) were added to your inventory.`);
      router.replace('/(tabs)/inventory');
    } catch (error) {
      Alert.alert('Batch save failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleStartSequentialEdit = () => {
    if (!selectedIndexes.length) {
      Alert.alert('Select at least one item', 'Choose one or more detections before starting sequential edit.');
      return;
    }

    setEditQueue([...selectedIndexes].sort((a, b) => a - b));
    setEditCursor(0);
    setStage('edit');
  };

  const handleSequentialSubmit = async (values: ItemEditorValues) => {
    if (!currentDetectedItem) {
      return;
    }

    try {
      await createDetectedItem(currentDetectedItem, values);

      const isLastItem = editCursor >= editQueue.length - 1;
      if (isLastItem) {
        Alert.alert('Items saved', `${editQueue.length} item(s) were added to your inventory.`);
        router.replace('/(tabs)/inventory');
        return;
      }

      setEditCursor((previous) => previous + 1);
    } catch (error) {
      Alert.alert('Could not save item', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!user?.id) {
    return null;
  }

  if (!detectedItems.length) {
    return (
      <Screen style={styles.emptyStateContainer}>
        <Stack.Screen
          options={{
            title: 'Batch Add',
            headerLargeTitle: false,
          }}
        />
        <Text style={styles.emptyTitle}>No detections found</Text>
        <Text style={styles.emptyBody}>Return to Add and re-run analysis.</Text>
      </Screen>
    );
  }

  if (stage === 'edit' && currentDetectedItem) {
    return (
      <Screen>
        <Stack.Screen
          options={{
            title: 'Edit Detected Items',
            headerLargeTitle: false,
          }}
        />
        <View style={styles.editHeader}>
          <Text style={styles.title}>Review Item {editCursor + 1} of {editQueue.length}</Text>
          <Text style={styles.subtitle}>Adjust fields before saving this detected item.</Text>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => setStage('select')}
          >
            <Text style={styles.secondaryButtonText}>Back to Selection</Text>
          </Pressable>
        </View>
        <ItemEditorForm
          key={`batch-edit-${currentEditIndex}`}
          mode="create"
          userId={user.id}
          initialValues={toItemEditorValues(currentDetectedItem)}
          onSubmit={handleSequentialSubmit}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Batch Add',
          headerLargeTitle: false,
        }}
      />
      <View style={styles.card}>
        <Text style={styles.title}>Select Items to Save</Text>
        <Text style={styles.subtitle}>Choose detections, then save all at once or edit them one by one.</Text>
        {imageUrl ? <Image source={{ uri: imageUrl }} resizeMode="cover" style={styles.previewImage} /> : null}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {detectedItems.map((detectedItem, index) => {
            const isSelected = selectedIndexes.includes(index);
            return (
              <Pressable
                key={`${detectedItem.name}-${index}`}
                style={({ pressed }) => [
                  styles.itemCard,
                  isSelected && styles.itemCardSelected,
                  pressed && styles.itemCardPressed,
                ]}
                onPress={() => toggleSelected(index)}
              >
                <View style={[styles.selectionDot, isSelected && styles.selectionDotSelected]} />
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{detectedItem.name}</Text>
                  <Text style={styles.itemMeta}>
                    Confidence: {Math.round((detectedItem.confidence || 0) * 100)}%
                  </Text>
                  {detectedItem.category_suggestion ? (
                    <Text style={styles.itemMeta}>Category: {detectedItem.category_suggestion}</Text>
                  ) : null}
                  {detectedItem.brand ? <Text style={styles.itemMeta}>Brand: {detectedItem.brand}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.selectionSummary}>{selectedIndexes.length} selected</Text>
        <Pressable
          onPress={handleBatchSave}
          disabled={!selectedIndexes.length || isSavingBatch}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            (!selectedIndexes.length || isSavingBatch) && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isSavingBatch ? 'Saving...' : `Batch Save Selected (${selectedIndexes.length})`}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleStartSequentialEdit}
          disabled={!selectedIndexes.length || isSavingBatch}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
            (!selectedIndexes.length || isSavingBatch) && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Edit Selected Sequentially</Text>
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
  editHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
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
    marginTop: 12,
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  list: {
    marginTop: 14,
    maxHeight: 320,
  },
  listContent: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    backgroundColor: '#f9f9fb',
    padding: 12,
  },
  itemCardSelected: {
    borderColor: '#0a84ff',
    backgroundColor: '#ecf4ff',
  },
  itemCardPressed: {
    opacity: 0.8,
  },
  selectionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#a9a9b0',
    marginTop: 2,
  },
  selectionDotSelected: {
    borderColor: '#0a84ff',
    backgroundColor: '#0a84ff',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 13,
    color: '#5a5a5f',
  },
  selectionSummary: {
    marginTop: 12,
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#34c759',
  },
  primaryButtonPressed: {
    backgroundColor: '#30b357',
  },
  primaryButtonText: {
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
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0a84ff',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  emptyBody: {
    fontSize: 14,
    color: '#636366',
  },
});
