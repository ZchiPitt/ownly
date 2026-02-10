import { Stack, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { ItemEditorForm, Screen, type ItemEditorValues } from '../../../components';
import { useAuth } from '../../../contexts';
import { useCreateInventoryItemMutation } from '../../../hooks';

export default function ManualAddScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const createItemMutation = useCreateInventoryItemMutation();

  const handleSubmit = async (values: ItemEditorValues) => {
    if (!user?.id) {
      return;
    }

    try {
      await createItemMutation.mutateAsync({
        userId: user.id,
        values,
      });
      Alert.alert('Item created', `${values.name.trim() || 'Item'} has been added to your inventory.`);
      router.replace('/(tabs)/inventory');
    } catch (error) {
      Alert.alert('Could not create item', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!user?.id) {
    return null;
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: 'Manual Entry',
          headerLargeTitle: false,
        }}
      />
      <ItemEditorForm mode="create" userId={user.id} onSubmit={handleSubmit} />
    </Screen>
  );
}
