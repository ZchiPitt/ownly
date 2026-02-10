import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import { useInventoryItemDetail, useSoftDeleteItemMutation, useToggleFavoriteItemMutation } from '../../../hooks';

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not set';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(parsed);
}

function formatCurrency(price: number | null, currency: string): string {
  if (price === null) {
    return 'Not set';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price}`;
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useInventoryItemDetail(user?.id, id);
  const toggleFavoriteMutation = useToggleFavoriteItemMutation();
  const softDeleteMutation = useSoftDeleteItemMutation();

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading item details...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load item</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Item not found</Text>
        <Text style={styles.helperText}>This item may have been removed.</Text>
      </Screen>
    );
  }

  const item = data.item;
  const tagsLabel = item.tags.length > 0 ? item.tags.join(', ') : 'None';
  const photoUri = item.photo_url?.trim() ? item.photo_url : null;
  const metadataSummary = !item.ai_metadata
    ? 'None'
    : Object.entries(item.ai_metadata)
        .slice(0, 4)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`;
          }
          if (typeof value === 'object' && value !== null) {
            return `${key}: [object]`;
          }
          return `${key}: ${String(value)}`;
        })
        .join('\n') || 'None';

  const handleToggleFavorite = async () => {
    if (!user?.id) {
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync({
        userId: user.id,
        itemId: item.id,
        currentValue: item.is_favorite,
      });
    } catch (favoriteError) {
      Alert.alert(
        'Could not update favorite',
        favoriteError instanceof Error ? favoriteError.message : 'Please try again.'
      );
    }
  };

  const handleDelete = () => {
    if (!user?.id) {
      return;
    }

    Alert.alert('Delete Item', 'This item will be hidden from inventory. You can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await softDeleteMutation.mutateAsync({
              userId: user.id,
              itemId: item.id,
            });
            router.replace('/(tabs)/inventory');
          } catch (deleteError) {
            Alert.alert(
              'Could not delete item',
              deleteError instanceof Error ? deleteError.message : 'Please try again.'
            );
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: item.name?.trim() || 'Item Detail',
          headerLargeTitle: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.actionsRow}>
          <Link href={`/(tabs)/inventory/edit/${item.id}`} asChild>
            <Pressable style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}>
              <Text style={styles.editButtonText}>Edit Item</Text>
            </Pressable>
          </Link>
          <Pressable
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
            onPress={handleToggleFavorite}
            disabled={toggleFavoriteMutation.isPending}
          >
            <Text style={styles.secondaryActionText}>
              {toggleFavoriteMutation.isPending
                ? 'Updating...'
                : item.is_favorite
                  ? 'Unfavorite'
                  : 'Favorite'}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}
            onPress={handleDelete}
            disabled={softDeleteMutation.isPending}
          >
            <Text style={styles.deleteActionText}>
              {softDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Photo</Text>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.photoFallbackText}>No photo available</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Core Details</Text>
          <DetailRow label="Name" value={item.name?.trim() || 'Untitled item'} />
          <DetailRow label="Description" value={item.description?.trim() || 'Not set'} />
          <DetailRow label="Quantity" value={`${item.quantity}`} />
          <DetailRow label="Price" value={formatCurrency(item.price, item.currency)} />
          <DetailRow label="Category" value={data.categoryName ?? 'Not set'} />
          <DetailRow label="Location" value={data.locationPath ?? 'Not set'} />
          <DetailRow label="Tags" value={tagsLabel} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <DetailRow label="Brand" value={item.brand?.trim() || 'Not set'} />
          <DetailRow label="Model" value={item.model?.trim() || 'Not set'} />
          <DetailRow label="Purchase Date" value={formatDate(item.purchase_date)} />
          <DetailRow label="Expiration Date" value={formatDate(item.expiration_date)} />
          <DetailRow label="Warranty Expiry" value={formatDate(item.warranty_expiry_date)} />
          <DetailRow label="Created" value={formatDate(item.created_at)} />
          <DetailRow label="Updated" value={formatDate(item.updated_at)} />
          <DetailRow label="AI Metadata" value={metadataSummary} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  row: {
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 15,
    color: '#3a3a3c',
    marginTop: 2,
    lineHeight: 20,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#d1d1d6',
  },
  photoFallback: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    fontSize: 14,
    color: '#636366',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: '#636366',
    textAlign: 'center',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#0a84ff',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  editButtonPressed: {
    backgroundColor: '#007aff',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0a84ff',
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryActionPressed: {
    opacity: 0.9,
  },
  secondaryActionText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteAction: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff3b30',
    backgroundColor: '#fff1f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  deleteActionPressed: {
    opacity: 0.9,
  },
  deleteActionText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '700',
  },
});
