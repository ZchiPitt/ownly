import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';

const settingsLinks = [
  { id: 'profile', label: 'Profile', href: '/(tabs)/settings/profile' },
  { id: 'notifications', label: 'Notifications', href: '/(tabs)/settings/notifications' },
  { id: 'support', label: 'Support', href: '/(tabs)/settings/support' },
] as const;

export default function SettingsScreen() {
  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {settingsLinks.map((item, index) => (
            <Link key={item.id} href={item.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  index !== settingsLinks.length - 1 && styles.rowDivider,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.rowTitle}>{item.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#6e6e73',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  rowPressed: {
    backgroundColor: '#f2f2f7',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  chevron: {
    fontSize: 22,
    color: '#c7c7cc',
  },
});
