import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTintColor: '#0a84ff',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
