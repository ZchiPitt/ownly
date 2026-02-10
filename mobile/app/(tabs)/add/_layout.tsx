import { Stack } from 'expo-router';

export default function AddLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTintColor: '#0a84ff',
      }}
    />
  );
}
