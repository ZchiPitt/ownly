import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vibration } from 'react-native';
import { iosColors, iosRadius, iosSpacing, iosTypography } from '../theme/tokens';

type SegmentOption<T extends string> = {
  key: T;
  label: string;
};

type IOSSegmentedControlProps<T extends string> = {
  options: Array<SegmentOption<T>>;
  selectedKey: T;
  onChange: (key: T) => void;
};

export default function IOSSegmentedControl<T extends string>({
  options,
  selectedKey,
  onChange,
}: IOSSegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            style={({ pressed }) => [
              styles.segment,
              isSelected && styles.segmentSelected,
              pressed && !isSelected && styles.segmentPressed,
            ]}
            onPress={() => {
              if (isSelected) {
                return;
              }
              Vibration.vibrate(5);
              onChange(option.key);
            }}
          >
            <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: iosColors.pressed,
    borderRadius: iosRadius.md,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 30,
    borderRadius: iosRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: iosSpacing.xs,
  },
  segmentSelected: {
    backgroundColor: iosColors.surface,
  },
  segmentPressed: {
    backgroundColor: iosColors.surfaceMuted,
  },
  segmentText: {
    ...iosTypography.caption,
    color: iosColors.textSecondary,
  },
  segmentTextSelected: {
    color: iosColors.textPrimary,
    fontWeight: '600',
  },
});
