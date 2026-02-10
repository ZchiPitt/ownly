import { Link } from 'expo-router';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListingSaveButton, Screen } from '../../../components';
import { useAuth } from '../../../contexts/AuthProvider';
import {
  useMarketplaceFeed,
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

function formatDateLabel(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Listed recently';
  }

  return `Listed ${parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const { data = [], isLoading, isError, error, refetch } = useMarketplaceFeed();
  const { data: savedListingIds = [] } = useSavedListingIds(user?.id);
  const saveListingMutation = useSaveMarketplaceListingMutation(user?.id);
  const unsaveListingMutation = useUnsaveMarketplaceListingMutation(user?.id);

  const savedIds = new Set(savedListingIds);

  const handleToggleSaved = async (listingId: string, shouldSave: boolean) => {
    try {
      if (shouldSave) {
        await saveListingMutation.mutateAsync({ listingId });
      } else {
        await unsaveListingMutation.mutateAsync({ listingId });
      }
    } catch (saveError) {
      Alert.alert('Could not update saved listing', saveError instanceof Error ? saveError.message : 'Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading marketplace...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load listings</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
        <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </Screen>
    );
  }

  if (data.length === 0) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.emptyTitle}>No active listings</Text>
        <Text style={styles.helperText}>Marketplace listings will appear here when sellers post items.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Marketplace Feed</Text>
          <View style={styles.sectionActions}>
            <Link href="/(tabs)/marketplace/saved" asChild>
              <Pressable style={({ pressed }) => [styles.savedButton, pressed && styles.savedButtonPressed]}>
                <Text style={styles.savedButtonText}>Saved</Text>
              </Pressable>
            </Link>
            <Link href="/(tabs)/marketplace/my-listings" asChild>
              <Pressable style={({ pressed }) => [styles.myListingsButton, pressed && styles.myListingsButtonPressed]}>
                <Text style={styles.myListingsButtonText}>My Listings</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.listContainer}>
        {data.map((listing) => (
          <Link key={listing.id} href={`/(tabs)/marketplace/${listing.id}`} asChild>
            <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <Image
                source={{ uri: listing.item.thumbnailUrl ?? listing.item.photoUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.itemName}>{listing.item.name?.trim() || 'Untitled listing'}</Text>
                <Text style={styles.priceText}>{formatPrice(listing.price, listing.priceType)}</Text>
                <Text style={styles.metaText}>
                  {CONDITION_LABELS[listing.condition] ?? listing.condition} • {listing.seller.displayName?.trim() || 'Ownly Seller'}
                </Text>
                <Text style={styles.subtleText}>{formatDateLabel(listing.createdAt)}</Text>
              </View>
              <View style={styles.trailingActions}>
                <ListingSaveButton
                  isSaved={savedIds.has(listing.id)}
                  disabled={saveListingMutation.isPending || unsaveListingMutation.isPending}
                  onToggle={() => handleToggleSaved(listing.id, !savedIds.has(listing.id))}
                />
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#6e6e73',
  },
  savedButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffd1dc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff1f4',
  },
  savedButtonPressed: {
    backgroundColor: '#ffe8ee',
  },
  savedButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d63357',
  },
  myListingsButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  myListingsButtonPressed: {
    backgroundColor: '#f2f2f7',
  },
  myListingsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a84ff',
  },
  listContainer: {
    paddingHorizontal: 16,
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
  trailingActions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
