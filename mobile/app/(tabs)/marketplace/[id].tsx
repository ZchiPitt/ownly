import { Link, useLocalSearchParams } from 'expo-router';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListingSaveButton, Screen } from '../../../components';
import { useAuth } from '../../../contexts/AuthProvider';
import {
  useMarketplaceListingDetail,
  useSavedListingIds,
  useSaveMarketplaceListingMutation,
  useUnsaveMarketplaceListingMutation,
} from '../../../hooks';

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

function formatPrice(price: number | null, priceType: string): string {
  if (priceType === 'free') {
    return 'Free';
  }

  if (price === null) {
    return priceType === 'negotiable' ? 'Negotiable' : 'Price unavailable';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);

  return priceType === 'negotiable' ? `${formatted} (Negotiable)` : formatted;
}

function formatListingDate(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently listed';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MarketplaceDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const listingId = Array.isArray(id) ? id[0] : id;

  const { data, isLoading, isError, error, refetch } = useMarketplaceListingDetail(listingId);
  const { data: savedListingIds = [] } = useSavedListingIds(user?.id);
  const saveListingMutation = useSaveMarketplaceListingMutation(user?.id);
  const unsaveListingMutation = useUnsaveMarketplaceListingMutation(user?.id);

  const isSaved = listingId ? savedListingIds.includes(listingId) : false;

  const handleToggleSaved = async () => {
    if (!listingId) {
      return;
    }

    try {
      if (isSaved) {
        await unsaveListingMutation.mutateAsync({ listingId });
      } else {
        await saveListingMutation.mutateAsync({ listingId });
      }
    } catch (saveError) {
      Alert.alert('Could not update saved listing', saveError instanceof Error ? saveError.message : 'Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading listing...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load listing</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
        <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.emptyTitle}>Listing not found</Text>
        <Text style={styles.helperText}>This listing may have been sold or removed.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: data.item.photoUrl }} style={styles.image} resizeMode="cover" />

        <View style={styles.card}>
          <Text style={styles.title}>{data.item.name?.trim() || 'Untitled listing'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(data.price, data.priceType)}</Text>
            <ListingSaveButton
              isSaved={isSaved}
              disabled={saveListingMutation.isPending || unsaveListingMutation.isPending}
              onToggle={handleToggleSaved}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Condition</Text>
            <Text style={styles.value}>{CONDITION_LABELS[data.condition] ?? data.condition}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Seller</Text>
            <Text style={styles.value}>{data.seller.displayName?.trim() || 'Ownly Seller'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{data.seller.locationCity?.trim() || 'Not specified'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Seller Rating</Text>
            <Text style={styles.value}>
              {data.seller.sellerRating !== null ? `${data.seller.sellerRating.toFixed(1)} (${data.seller.reviewCount} reviews)` : 'No ratings yet'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Listed</Text>
            <Text style={styles.value}>{formatListingDate(data.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Views</Text>
            <Text style={styles.value}>{data.viewCount}</Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{data.description?.trim() || 'No description provided.'}</Text>

          <Link
            href={{
              pathname: '/(tabs)/marketplace/messages/[listingId]',
              params: { listingId: data.id },
            }}
            asChild
          >
            <Pressable style={({ pressed }) => [styles.messageButton, pressed && styles.messageButtonPressed]}>
              <Text style={styles.messageButtonText}>Message Seller</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    backgroundColor: '#d1d1d6',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a84ff',
  },
  priceRow: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#6e6e73',
  },
  value: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#6e6e73',
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    color: '#3a3a3c',
  },
  messageButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#0a84ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  messageButtonPressed: {
    backgroundColor: '#007aff',
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  helperText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6e6e73',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#0a84ff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    backgroundColor: '#007aff',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
