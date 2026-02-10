import { Stack } from 'expo-router';
import { Alert } from 'react-native';

import { ItemEditorForm, Screen, type ItemEditorValues } from '../../../components';
import { useAuth } from '../../../contexts';

export default function ManualAddScreen() {
  const { user } = useAuth();

  const handleSubmit = async (values: ItemEditorValues) => {
    Alert.alert(
      'Form ready',
      `Validated ${values.name.trim()}.\nPersistence wiring is scheduled in US-010.`
    );
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
