import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';

const items = [
  { id: 'b-102', name: 'Bike Helmet', location: 'Garage Shelf' },
  { id: 'k-204', name: 'Chef Knife', location: 'Kitchen Drawer' },
  { id: 'o-319', name: 'Camping Tent', location: 'Storage Bin' },
];

export default function InventoryScreen() {
  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Items</Text>
        <View style={styles.card}>
          {items.map((item, index) => (
            <Link key={item.id} href={`/(tabs)/inventory/${item.id}`} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  index !== items.length - 1 && styles.rowDivider,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSubtitle}>{item.location}</Text>
                </View>
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
});
