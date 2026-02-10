import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActionSheetIOS, ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import { supabase } from '../../../lib/supabase';
import { useInventoryItems, type InventorySortOption } from '../../../hooks/useInventoryItems';

type InventoryRow = {
  id: string;
  name: string | null;
  location_id: string | null;
};

type InventoryCategory = {
  id: string;
  name: string;
  is_system: boolean;
  sort_order: number;
};

type InventoryLocation = {
  id: string;
  path: string;
};

const SORT_OPTIONS: Array<{ key: InventorySortOption; label: string }> = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'name_asc', label: 'Name A-Z' },
  { key: 'name_desc', label: 'Name Z-A' },
  { key: 'expiring', label: 'Expiring Soon' },
  { key: 'viewed', label: 'Recently Viewed' },
];

function InventoryItemRow({ item, locationLabel }: { item: InventoryRow; locationLabel: string }) {
  return (
    <Link href={`/(tabs)/inventory/${item.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{item.name?.trim() ? item.name : 'Untitled item'}</Text>
          <Text style={styles.rowSubtitle}>{locationLabel}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Link>
  );
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<InventorySortOption>('newest');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['inventory-categories', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, is_system, sort_order')
        .or(`user_id.is.null,user_id.eq.${user?.id}`);

      if (error) {
        throw error;
      }

      const allCategories = ((data ?? []) as InventoryCategory[]).sort((a, b) => {
        if (a.is_system !== b.is_system) {
          return a.is_system ? -1 : 1;
        }
        if (a.is_system && b.is_system) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });

      return allCategories;
    },
  });

  const {
    data: locations = [],
    isLoading: isLocationsLoading,
    isError: isLocationsError,
  } = useQuery({
    queryKey: ['inventory-locations', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, path')
        .eq('user_id', user?.id as string)
        .is('deleted_at', null)
        .order('path', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as InventoryLocation[];
    },
  });

  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInventoryItems({
      userId: user?.id,
      sortBy,
      categoryId: selectedCategoryId,
      locationId: selectedLocationId,
    });

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.path])),
    [locations]
  );
  const selectedSort = SORT_OPTIONS.find((option) => option.key === sortBy);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const selectedLocation = locations.find((location) => location.id === selectedLocationId);
  const hasActiveFilters = Boolean(selectedCategoryId || selectedLocationId);

  const handleEndReached = () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage();
  };

  const showSortActionSheet = () => {
    const labels = SORT_OPTIONS.map((option) => option.label);
    const options = [...labels, 'Cancel'];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      (buttonIndex) => {
        if (buttonIndex === options.length - 1) {
          return;
        }
        const nextSort = SORT_OPTIONS[buttonIndex];
        if (nextSort) {
          setSortBy(nextSort.key);
        }
      }
    );
  };

  const showCategoryActionSheet = () => {
    const options = ['All Categories', ...categories.map((category) => category.name), 'Cancel'];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      (buttonIndex) => {
        if (buttonIndex === options.length - 1) {
          return;
        }
        if (buttonIndex === 0) {
          setSelectedCategoryId(null);
          return;
        }
        const nextCategory = categories[buttonIndex - 1];
        if (nextCategory) {
          setSelectedCategoryId(nextCategory.id);
        }
      }
    );
  };

  const showLocationActionSheet = () => {
    const options = ['All Locations', ...locations.map((location) => location.path), 'Cancel'];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      (buttonIndex) => {
        if (buttonIndex === options.length - 1) {
          return;
        }
        if (buttonIndex === 0) {
          setSelectedLocationId(null);
          return;
        }
        const nextLocation = locations[buttonIndex - 1];
        if (nextLocation) {
          setSelectedLocationId(nextLocation.id);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading inventory...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load inventory</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
        <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <View style={styles.controlsRow}>
          <Pressable style={({ pressed }) => [styles.controlChip, pressed && styles.controlChipPressed]} onPress={showSortActionSheet}>
            <Text style={styles.controlChipText}>Sort: {selectedSort?.label ?? 'Newest First'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.controlChip, pressed && styles.controlChipPressed]}
            onPress={showCategoryActionSheet}
            disabled={isCategoriesLoading || isCategoriesError}
          >
            <Text style={styles.controlChipText}>Category: {selectedCategory?.name ?? 'All'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.controlChip, pressed && styles.controlChipPressed]}
            onPress={showLocationActionSheet}
            disabled={isLocationsLoading || isLocationsError}
          >
            <Text style={styles.controlChipText}>Location: {selectedLocation?.path ?? 'All'}</Text>
          </Pressable>
        </View>
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Your inventory is empty</Text>
          <Text style={styles.helperText}>Add your first item from the Add tab.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.controlsRow}>
        <Pressable style={({ pressed }) => [styles.controlChip, pressed && styles.controlChipPressed]} onPress={showSortActionSheet}>
          <Text style={styles.controlChipText}>Sort: {selectedSort?.label ?? 'Newest First'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.controlChip, pressed && styles.controlChipPressed]}
          onPress={showCategoryActionSheet}
          disabled={isCategoriesLoading || isCategoriesError}
        >
          <Text style={styles.controlChipText}>Category: {selectedCategory?.name ?? 'All'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.controlChip, pressed && styles.controlChipPressed]}
          onPress={showLocationActionSheet}
          disabled={isLocationsLoading || isLocationsError}
        >
          <Text style={styles.controlChipText}>Location: {selectedLocation?.path ?? 'All'}</Text>
        </Pressable>
        {hasActiveFilters ? (
          <Pressable
            style={({ pressed }) => [styles.clearChip, pressed && styles.clearChipPressed]}
            onPress={() => {
              setSelectedCategoryId(null);
              setSelectedLocationId(null);
            }}
          >
            <Text style={styles.clearChipText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryItemRow
            item={item}
            locationLabel={
              item.location_id
                ? `Location: ${locationsById.get(item.location_id) ?? item.location_id}`
                : 'No location'
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color="#0a84ff" />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controlChipPressed: {
    backgroundColor: '#f2f2f7',
  },
  controlChipText: {
    color: '#1c1c1e',
    fontSize: 13,
    fontWeight: '600',
  },
  clearChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0a84ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f7ff',
  },
  clearChipPressed: {
    opacity: 0.9,
  },
  clearChipText: {
    color: '#0a84ff',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowPressed: {
    backgroundColor: '#f2f2f7',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#c7c7cc',
    marginLeft: 8,
  },
  separator: {
    height: 10,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    textAlign: 'center',
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
  retryButton: {
    marginTop: 8,
    backgroundColor: '#0a84ff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  footerLoading: {
    paddingVertical: 16,
  },
});
