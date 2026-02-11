import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vibration } from 'react-native';
import { iosColors, iosSpacing, iosTypography } from '../theme/tokens';

type IOSListCellProps = {
  title: string;
  subtitle?: string;
  isLast?: boolean;
  onPress: () => void;
};

export default function IOSListCell({ title, subtitle, isLast, onPress }: IOSListCellProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && styles.rowPressed]}
      onPress={() => {
        Vibration.vibrate(5);
        onPress();
      }}
    >
      <View style={styles.copyWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: 14,
    backgroundColor: iosColors.surface,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: iosColors.separator,
  },
  rowPressed: {
    backgroundColor: iosColors.pressed,
  },
  copyWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...iosTypography.body,
    color: iosColors.textPrimary,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    color: iosColors.textSecondary,
  },
  chevron: {
    marginLeft: iosSpacing.md,
    fontSize: 22,
    color: '#c7c7cc',
  },
});
