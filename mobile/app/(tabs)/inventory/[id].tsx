import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import { useInventoryItemDetail } from '../../../hooks';

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
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useInventoryItemDetail(user?.id, id);

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

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: item.name?.trim() || 'Item Detail',
          headerLargeTitle: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
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
});
