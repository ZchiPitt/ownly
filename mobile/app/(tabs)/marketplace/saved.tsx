import { Link, Stack } from 'expo-router';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListingSaveButton, Screen } from '../../../components';
import { useAuth } from '../../../contexts/AuthProvider';
import {
  useSavedListingIds,
  useSavedMarketplaceListings,
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

function formatDateLabel(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Saved recently';
  }

  return `Saved ${parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export default function SavedListingsScreen() {
  const { user } = useAuth();
  const { data: listings = [], isLoading, isError, error, refetch } = useSavedMarketplaceListings(user?.id);
  const { data: savedListingIds = [] } = useSavedListingIds(user?.id);
  const unsaveListingMutation = useUnsaveMarketplaceListingMutation(user?.id);

  const savedIdSet = new Set(savedListingIds);

  const handleUnsave = async (listingId: string) => {
    try {
      await unsaveListingMutation.mutateAsync({ listingId });
    } catch (saveError) {
      Alert.alert('Could not remove saved listing', saveError instanceof Error ? saveError.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Saved Listings', headerLargeTitle: true }} />

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0a84ff" />
          <Text style={styles.helperText}>Loading saved listings...</Text>
        </View>
      ) : null}

      {!isLoading && isError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Could not load saved listings</Text>
          <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
          <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !isError && listings.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>No saved listings yet</Text>
          <Text style={styles.helperText}>Tap the heart on marketplace listings to save items here.</Text>
          <Link href="/(tabs)/marketplace" asChild>
            <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}>
              <Text style={styles.retryButtonText}>Browse Marketplace</Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {!isLoading && !isError && listings.length > 0 ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {listings.map((listing) => (
            <Link key={listing.id} href={`/(tabs)/marketplace/${listing.id}`} asChild>
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <Image source={{ uri: listing.item.thumbnailUrl ?? listing.item.photoUrl }} style={styles.image} resizeMode="cover" />
                <View style={styles.cardContent}>
                  <Text style={styles.itemName}>{listing.item.name?.trim() || 'Untitled listing'}</Text>
                  <Text style={styles.priceText}>{formatPrice(listing.price, listing.priceType)}</Text>
                  <Text style={styles.metaText}>
                    {CONDITION_LABELS[listing.condition] ?? listing.condition} • {listing.seller.displayName?.trim() || 'Ownly Seller'}
                  </Text>
                  <Text style={styles.subtleText}>{formatDateLabel(listing.savedAt)}</Text>
                </View>
                <View style={styles.trailingActions}>
                  <ListingSaveButton
                    isSaved={savedIdSet.has(listing.id)}
                    disabled={unsaveListingMutation.isPending}
                    onToggle={() => handleUnsave(listing.id)}
                  />
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    padding: 10,
  },
  cardPressed: {
    backgroundColor: '#f2f2f7',
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#d1d1d6',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  priceText: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
    color: '#0a84ff',
  },
  metaText: {
    marginTop: 4,
    fontSize: 13,
    color: '#3a3a3c',
  },
  subtleText: {
    marginTop: 2,
    fontSize: 12,
    color: '#8e8e93',
  },
  trailingActions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chevron: {
    fontSize: 22,
    color: '#c7c7cc',
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
