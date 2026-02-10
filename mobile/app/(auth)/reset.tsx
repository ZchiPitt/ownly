import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '../../lib/supabase';

const emailRegex = /\S+@\S+\.\S+/;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail
    );

    if (resetError) {
      setError(resetError.message);
      setIsLoading(false);
      return;
    }

    setSuccess('Check your inbox for password reset instructions.');
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          We will email you a reset link.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#8e8e93"
            style={styles.input}
            textContentType="username"
            value={email}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={handleReset}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isLoading ? styles.primaryButtonPressed : null,
            isLoading ? styles.primaryButtonDisabled : null,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Send reset email</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    backgroundColor: '#f6f7fb',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111111',
  },
  subtitle: {
    fontSize: 16,
    color: '#5b5b5b',
    marginTop: 6,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111111',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  error: {
    color: '#d0342c',
    fontSize: 14,
  },
  success: {
    color: '#2f9b51',
    fontSize: 14,
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0a84ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#0a84ff',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 24,
    alignItems: 'center',
  },
});
