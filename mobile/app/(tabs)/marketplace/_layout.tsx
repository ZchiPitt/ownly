import { Stack } from 'expo-router';

export default function MarketplaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTintColor: '#0a84ff',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Marketplace' }} />
      <Stack.Screen name="my-listings" options={{ title: 'My Listings' }} />
      <Stack.Screen name="saved" options={{ title: 'Saved Listings' }} />
      <Stack.Screen name="messages/index" options={{ title: 'Messages' }} />
      <Stack.Screen
        name="messages/[listingId]"
        options={{
          title: 'Chat',
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
