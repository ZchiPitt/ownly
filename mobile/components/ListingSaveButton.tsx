import type { GestureResponderEvent } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

type ListingSaveButtonProps = {
  isSaved: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export default function ListingSaveButton({ isSaved, disabled = false, onToggle }: ListingSaveButtonProps) {
  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onToggle();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isSaved ? 'Remove listing from saved items' : 'Save listing'}
      accessibilityState={{ selected: isSaved, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        isSaved && styles.buttonSaved,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.icon, isSaved && styles.iconSaved]}>{isSaved ? '♥' : '♡'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSaved: {
    borderColor: '#ff375f',
    backgroundColor: '#fff1f4',
  },
  buttonPressed: {
    backgroundColor: '#f2f2f7',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  icon: {
    fontSize: 16,
    color: '#8e8e93',
    lineHeight: 17,
    fontWeight: '700',
  },
  iconSaved: {
    color: '#ff375f',
  },
});
