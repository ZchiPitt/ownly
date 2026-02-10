import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ActivityIndicator, StyleSheet, Text } from 'react-native';

import { ItemEditorForm, Screen, type ItemEditorValues } from '../../../../components';
import { useAuth } from '../../../../contexts';
import { useInventoryItemDetail } from '../../../../hooks';

export default function EditInventoryItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useInventoryItemDetail(user?.id, id);

  const handleSubmit = async (values: ItemEditorValues) => {
    Alert.alert(
      'Changes validated',
      `Validated ${values.name.trim()}.\nUpdate mutation wiring is scheduled in US-010.`
    );
  };

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading item...</Text>
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
      </Screen>
    );
  }

  const item = data.item;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: 'Edit Item',
          headerLargeTitle: false,
        }}
      />
      <ItemEditorForm
        mode="edit"
        userId={user?.id as string}
        onSubmit={handleSubmit}
        initialValues={{
          name: item.name ?? '',
          description: item.description ?? '',
          quantity: item.quantity,
          categoryId: item.category_id,
          locationId: item.location_id,
          tags: item.tags ?? [],
          price: item.price === null ? '' : `${item.price}`,
          currency: item.currency ?? 'USD',
          purchaseDate: item.purchase_date ?? '',
          expirationDate: item.expiration_date ?? '',
          warrantyExpiryDate: item.warranty_expiry_date ?? '',
          brand: item.brand ?? '',
          model: item.model ?? '',
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
