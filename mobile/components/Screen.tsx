import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';

interface ScreenProps {
  children: ReactNode;
  style?: ViewStyle;
}

export default function Screen({ children, style }: ScreenProps) {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
});
