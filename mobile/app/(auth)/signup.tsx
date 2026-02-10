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
const minimumPasswordLength = 8;

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < minimumPasswordLength) {
      setError(`Password must be at least ${minimumPasswordLength} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Get started with Ownly.</Text>
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

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            placeholder={`At least ${minimumPasswordLength} characters`}
            placeholderTextColor="#8e8e93"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={password}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            placeholderTextColor="#8e8e93"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={handleSignup}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isLoading ? styles.primaryButtonPressed : null,
            isLoading ? styles.primaryButtonDisabled : null,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Sign in</Text>
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
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#5b5b5b',
  },
});
