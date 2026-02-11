import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import { iosColors, iosRadius, iosSpacing, iosTypography } from '../../../theme/tokens';

type SettingsSection = 'profile' | 'support';

type SectionContent = {
  title: string;
  subtitle: string;
  details: Array<{ label: string; value: string }>;
  actions?: Array<{ id: string; label: string; onPress: () => void }>;
};

const DEFAULT_CONTENT: Omit<SectionContent, 'actions'> = {
  title: 'Settings',
  subtitle: 'This section is not available yet.',
  details: [
    {
      label: 'Status',
      value: 'Coming soon',
    },
  ],
};

export default function SettingsDetailScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { user } = useAuth();

  const content = useMemo<SectionContent>(() => {
    const normalizedSection = typeof section === 'string' ? section.toLowerCase() : '';

    const supportAction = {
      id: 'contact-support',
      label: 'Contact support',
      onPress: () => {
        void (async () => {
          const supportUrl = 'mailto:support@ownly.app?subject=Ownly%20iOS%20Support';
          const canOpen = await Linking.canOpenURL(supportUrl);
          if (canOpen) {
            await Linking.openURL(supportUrl);
            return;
          }

          Alert.alert('Support email', 'support@ownly.app');
        })();
      },
    };

    const sectionContent: Record<SettingsSection, SectionContent> = {
      profile: {
        title: 'Profile',
        subtitle: 'Account details and sign-in state.',
        details: [
          {
            label: 'Email',
            value: user?.email ?? 'Not signed in',
          },
          {
            label: 'User ID',
            value: user?.id ?? 'Unavailable',
          },
          {
            label: 'Auth provider',
            value: user?.app_metadata?.provider ?? 'email',
          },
        ],
      },
      support: {
        title: 'Support',
        subtitle: 'Get help and share feedback with the Ownly team.',
        details: [
          {
            label: 'Response window',
            value: 'Usually within 1 business day',
          },
          {
            label: 'Support email',
            value: 'support@ownly.app',
          },
        ],
        actions: [supportAction],
      },
    };

    return sectionContent[normalizedSection as SettingsSection] ?? DEFAULT_CONTENT;
  }, [section, user?.app_metadata?.provider, user?.email, user?.id]);

  return (
    <Screen style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>
      </View>

      <View style={styles.detailsCard}>
        {content.details.map((detail, index) => (
          <View key={detail.label} style={[styles.detailRow, index < content.details.length - 1 && styles.detailDivider]}>
            <Text style={styles.detailLabel}>{detail.label}</Text>
            <Text style={styles.detailValue}>{detail.value}</Text>
          </View>
        ))}
      </View>

      {content.actions?.length ? (
        <View style={styles.actionsWrap}>
          {content.actions.map((action) => (
            <Pressable key={action.id} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]} onPress={action.onPress}>
              <Text style={styles.actionButtonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: iosSpacing.lg,
    paddingTop: iosSpacing.md,
    gap: iosSpacing.md,
  },
  headerCard: {
    backgroundColor: iosColors.tintMuted,
    borderRadius: iosRadius.lg,
    borderWidth: 1,
    borderColor: '#dce7ff',
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: iosSpacing.md,
    gap: iosSpacing.xs,
  },
  title: {
    ...iosTypography.title,
    color: iosColors.textPrimary,
  },
  subtitle: {
    ...iosTypography.caption,
    color: iosColors.textSecondary,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: iosColors.surface,
    borderRadius: iosRadius.lg,
    borderWidth: 1,
    borderColor: iosColors.separator,
    overflow: 'hidden',
  },
  detailRow: {
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: iosSpacing.md,
    gap: 4,
  },
  detailDivider: {
    borderBottomWidth: 1,
    borderBottomColor: iosColors.separator,
  },
  detailLabel: {
    ...iosTypography.footnote,
    color: iosColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    ...iosTypography.body,
    color: iosColors.textPrimary,
  },
  actionsWrap: {
    gap: iosSpacing.sm,
  },
  actionButton: {
    backgroundColor: iosColors.tint,
    borderRadius: iosRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.86,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
