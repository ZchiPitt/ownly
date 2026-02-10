import { Link, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import { useInventorySearch } from '../../../hooks';

export default function SearchScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const { data = [], isLoading, isError, error, refetch } = useInventorySearch({
    userId: user?.id,
    query: debouncedQuery,
  });

  const hasInput = query.trim().length > 0;
  const hasDebouncedInput = debouncedQuery.length > 0;
  const resultCountLabel = useMemo(() => {
    if (!hasDebouncedInput) {
      return 'Search by item name, description, category, or location';
    }
    if (isLoading) {
      return 'Searching...';
    }
    if (data.length === 1) {
      return '1 result';
    }
    return `${data.length} results`;
  }, [data.length, hasDebouncedInput, isLoading]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={styles.container}>
        <Text style={styles.label}>Search inventory</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            placeholder='Try "tent" or "kitchen"'
            placeholderTextColor="#8e8e93"
            returnKeyType="search"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <Text style={styles.helperText}>{resultCountLabel}</Text>

        {isError ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Could not search inventory</Text>
            <Text style={styles.errorText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
            <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : !hasInput ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Start typing to search</Text>
            <Text style={styles.emptyText}>Results update automatically after a short pause.</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color="#0a84ff" />
          </View>
        ) : data.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No matching items</Text>
            <Text style={styles.emptyText}>Try a different keyword.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.resultsList}>
            {data.map((item) => (
              <Link key={item.id} href={`/(tabs)/inventory/${item.id}`} asChild>
                <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{item.name?.trim() ? item.name : 'Untitled item'}</Text>
                    <Text numberOfLines={2} style={styles.rowSubtitle}>
                      {item.description?.trim() || item.locationPath || item.categoryName || 'No additional details'}
                    </Text>
                    {(item.categoryName || item.locationPath) && (
                      <Text style={styles.rowMeta}>
                        {[item.categoryName, item.locationPath].filter(Boolean).join(' • ')}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#6e6e73',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  helperText: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: '#6e6e73',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 14,
    color: '#6e6e73',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 6,
    fontSize: 14,
    color: '#6e6e73',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
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
  resultsList: {
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
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
    marginTop: 2,
    fontSize: 13,
    color: '#6e6e73',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#8e8e93',
  },
  chevron: {
    marginLeft: 8,
    fontSize: 22,
    color: '#c7c7cc',
  },
});
