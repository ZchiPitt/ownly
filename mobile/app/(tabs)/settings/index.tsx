import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IOSListCell, Screen } from '../../../components';
import { iosColors, iosRadius, iosSpacing, iosTypography } from '../../../theme/tokens';

const settingsLinks = [
  { id: 'profile', label: 'Profile', subtitle: 'Account details and preferences', href: '/(tabs)/settings/profile' },
  { id: 'notifications', label: 'Notifications', subtitle: 'Push and in-app alerts', href: '/(tabs)/settings/notifications' },
  { id: 'support', label: 'Support', subtitle: 'Help center and feedback', href: '/(tabs)/settings/support' },
] as const;

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {settingsLinks.map((item, index) => (
            <IOSListCell
              key={item.id}
              title={item.label}
              subtitle={item.subtitle}
              isLast={index === settingsLinks.length - 1}
              onPress={() => {
                router.push(item.href);
              }}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: iosSpacing.lg,
    paddingTop: iosSpacing.lg,
  },
  sectionTitle: {
    ...iosTypography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: iosColors.textSecondary,
    marginBottom: iosSpacing.sm,
  },
  card: {
    backgroundColor: iosColors.surface,
    borderRadius: iosRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: iosColors.separator,
  },
});
