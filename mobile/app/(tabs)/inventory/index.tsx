import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import { useInventoryItems } from '../../../hooks/useInventoryItems';

type InventoryRow = {
  id: string;
  name: string | null;
  location_id: string | null;
};

function InventoryItemRow({ item }: { item: InventoryRow }) {
  return (
    <Link href={`/(tabs)/inventory/${item.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{item.name?.trim() ? item.name : 'Untitled item'}</Text>
          <Text style={styles.rowSubtitle}>{item.location_id ? `Location: ${item.location_id}` : 'No location'}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Link>
  );
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInventoryItems(user?.id);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const handleEndReached = () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage();
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
      <Screen style={styles.centerState}>
        <Text style={styles.emptyTitle}>Your inventory is empty</Text>
        <Text style={styles.helperText}>Add your first item from the Add tab.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InventoryItemRow item={item} />}
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
