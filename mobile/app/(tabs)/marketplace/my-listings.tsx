import { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { IOSSegmentedControl, Screen } from '../../../components';
import { useAuth } from '../../../contexts/AuthProvider';
import {
  useCreateMarketplaceListingMutation,
  useMyListingCandidates,
  useMyMarketplaceListings,
  useUpdateMarketplaceListingMutation,
  type MyListingStatusFilter,
  type MyMarketplaceListing,
} from '../../../hooks/useMyListings';
import { Vibration } from 'react-native';
import { iosColors, iosRadius, iosSpacing, iosTypography } from '../../../theme/tokens';
import type { ItemCondition, ListingStatus, PriceType } from '../../../../src/types/database';

const STATUS_TABS: Array<{ key: MyListingStatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'sold', label: 'Sold' },
  { key: 'removed', label: 'Removed' },
];

const CONDITION_OPTIONS: Array<{ value: ItemCondition; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const PRICE_TYPE_OPTIONS: Array<{ value: PriceType; label: string }> = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'free', label: 'Free' },
];

const STATUS_OPTIONS: Array<{ value: ListingStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'removed', label: 'Removed' },
];

type ListingDraft = {
  priceType: PriceType;
  condition: ItemCondition;
  priceText: string;
  description: string;
  status?: ListingStatus;
};

function formatPrice(price: number | null, priceType: PriceType): string {
  if (priceType === 'free') {
    return 'Free';
  }

  if (price === null) {
    return priceType === 'negotiable' ? 'Negotiable' : 'No price';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);

  return priceType === 'negotiable' ? `${formatted} (Negotiable)` : formatted;
}

function formatDateLabel(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently listed';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parsePriceValue(priceText: string, priceType: PriceType): number | null {
  if (priceType === 'free') {
    return null;
  }

  const normalized = priceText.replace(/[$,\s]/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Price must be a valid positive number.');
  }

  return parsed;
}

function getStatusBadgeStyles(status: ListingStatus) {
  switch (status) {
    case 'active':
      return { container: styles.activeBadge, label: styles.activeBadgeText };
    case 'reserved':
      return { container: styles.reservedBadge, label: styles.reservedBadgeText };
    case 'sold':
      return { container: styles.soldBadge, label: styles.soldBadgeText };
    case 'removed':
    default:
      return { container: styles.removedBadge, label: styles.removedBadgeText };
  }
}

export default function MyListingsScreen() {
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<MyListingStatusFilter>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<ListingDraft>({
    priceType: 'fixed',
    condition: 'good',
    priceText: '',
    description: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ListingDraft>({
    priceType: 'fixed',
    condition: 'good',
    priceText: '',
    description: '',
    status: 'active',
  });
  const [editError, setEditError] = useState<string | null>(null);

  const {
    data: listings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMyMarketplaceListings(user?.id, statusFilter);
  const { data: candidates = [], isLoading: candidatesLoading } = useMyListingCandidates(user?.id);
  const createListingMutation = useCreateMarketplaceListingMutation(user?.id);
  const updateListingMutation = useUpdateMarketplaceListingMutation(user?.id);

  const selectedItem = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedItemId) ?? null,
    [candidates, selectedItemId]
  );

  const isCreateBusy = createListingMutation.isPending;

  const openCandidatePicker = () => {
    if (candidates.length === 0) {
      return;
    }

    const labels = candidates.map((candidate) => candidate.name?.trim() || 'Untitled item');
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...labels, 'Cancel'],
        cancelButtonIndex: labels.length,
      },
      (buttonIndex) => {
        if (buttonIndex >= labels.length) {
          return;
        }

        setSelectedItemId(candidates[buttonIndex]?.id ?? null);
      }
    );
  };

  const openPriceTypePicker = (forEdit: boolean) => {
    const labels = PRICE_TYPE_OPTIONS.map((option) => option.label);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...labels, 'Cancel'],
        cancelButtonIndex: labels.length,
      },
      (buttonIndex) => {
        if (buttonIndex >= labels.length) {
          return;
        }

        const value = PRICE_TYPE_OPTIONS[buttonIndex]?.value;
        if (!value) {
          return;
        }

        if (forEdit) {
          setEditDraft((current) => ({
            ...current,
            priceType: value,
            priceText: value === 'free' ? '' : current.priceText,
          }));
          return;
        }

        setCreateDraft((current) => ({
          ...current,
          priceType: value,
          priceText: value === 'free' ? '' : current.priceText,
        }));
      }
    );
  };

  const openConditionPicker = (forEdit: boolean) => {
    const labels = CONDITION_OPTIONS.map((option) => option.label);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...labels, 'Cancel'],
        cancelButtonIndex: labels.length,
      },
      (buttonIndex) => {
        if (buttonIndex >= labels.length) {
          return;
        }

        const value = CONDITION_OPTIONS[buttonIndex]?.value;
        if (!value) {
          return;
        }

        if (forEdit) {
          setEditDraft((current) => ({ ...current, condition: value }));
          return;
        }

        setCreateDraft((current) => ({ ...current, condition: value }));
      }
    );
  };

  const openStatusPicker = () => {
    const labels = STATUS_OPTIONS.map((option) => option.label);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...labels, 'Cancel'],
        cancelButtonIndex: labels.length,
      },
      (buttonIndex) => {
        if (buttonIndex >= labels.length) {
          return;
        }

        const value = STATUS_OPTIONS[buttonIndex]?.value;
        if (!value) {
          return;
        }

        setEditDraft((current) => ({ ...current, status: value }));
      }
    );
  };

  const resetCreateForm = () => {
    setSelectedItemId(null);
    setCreateDraft({
      priceType: 'fixed',
      condition: 'good',
      priceText: '',
      description: '',
    });
    setCreateError(null);
  };

  const handleCreateListing = async () => {
    if (!selectedItemId) {
      setCreateError('Select an inventory item first.');
      return;
    }

    try {
      const price = parsePriceValue(createDraft.priceText, createDraft.priceType);
      setCreateError(null);

      await createListingMutation.mutateAsync({
        itemId: selectedItemId,
        price,
        priceType: createDraft.priceType,
        condition: createDraft.condition,
        description: createDraft.description,
      });

      Vibration.vibrate(5);
      resetCreateForm();
    } catch (mutationError) {
      setCreateError(mutationError instanceof Error ? mutationError.message : 'Could not create listing.');
    }
  };

  const beginEdit = (listing: MyMarketplaceListing) => {
    setEditingListingId(listing.id);
    setEditDraft({
      priceType: listing.priceType,
      condition: listing.condition,
      priceText: listing.price !== null ? listing.price.toString() : '',
      description: listing.description ?? '',
      status: listing.status,
    });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingListingId(null);
    setEditError(null);
  };

  const applyStatusAction = async (listingId: string, status: ListingStatus) => {
    try {
      await updateListingMutation.mutateAsync({
        listingId,
        updates: { status },
      });
      Vibration.vibrate(5);
    } catch (mutationError) {
      setEditError(mutationError instanceof Error ? mutationError.message : 'Could not update listing status.');
    }
  };

  const submitEdit = async () => {
    if (!editingListingId) {
      return;
    }

    try {
      const price = parsePriceValue(editDraft.priceText, editDraft.priceType);
      setEditError(null);

      await updateListingMutation.mutateAsync({
        listingId: editingListingId,
        updates: {
          price,
          priceType: editDraft.priceType,
          condition: editDraft.condition,
          description: editDraft.description,
          status: editDraft.status,
        },
      });

      Vibration.vibrate(5);
      setEditingListingId(null);
    } catch (mutationError) {
      setEditError(mutationError instanceof Error ? mutationError.message : 'Could not update listing.');
    }
  };

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <Stack.Screen options={{ title: 'My Listings' }} />
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading your listings...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Stack.Screen options={{ title: 'My Listings' }} />
        <Text style={styles.errorTitle}>Could not load your listings</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
        <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'My Listings' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Create Listing</Text>
          <Text style={styles.sectionHelper}>Choose an inventory item and publish it to the marketplace.</Text>

          <Pressable
            style={({ pressed }) => [styles.pickerButton, pressed && styles.pickerButtonPressed]}
            onPress={openCandidatePicker}
            disabled={candidatesLoading || candidates.length === 0}
          >
            <Text style={styles.pickerButtonLabel}>Item</Text>
            <Text style={styles.pickerButtonValue}>
              {candidatesLoading
                ? 'Loading items...'
                : selectedItem?.name?.trim() ||
                  (candidates.length === 0 ? 'No eligible items available' : 'Select item')}
            </Text>
          </Pressable>

          <View style={styles.row}> 
            <Pressable
              style={({ pressed }) => [styles.compactPickerButton, pressed && styles.pickerButtonPressed]}
              onPress={() => openPriceTypePicker(false)}
            >
              <Text style={styles.pickerButtonLabel}>Price Type</Text>
              <Text style={styles.pickerButtonValue}>
                {PRICE_TYPE_OPTIONS.find((option) => option.value === createDraft.priceType)?.label ?? 'Fixed'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.compactPickerButton, pressed && styles.pickerButtonPressed]}
              onPress={() => openConditionPicker(false)}
            >
              <Text style={styles.pickerButtonLabel}>Condition</Text>
              <Text style={styles.pickerButtonValue}>
                {CONDITION_OPTIONS.find((option) => option.value === createDraft.condition)?.label ?? 'Good'}
              </Text>
            </Pressable>
          </View>

          {createDraft.priceType !== 'free' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (USD)</Text>
              <TextInput
                value={createDraft.priceText}
                onChangeText={(text) => setCreateDraft((current) => ({ ...current, priceText: text }))}
                keyboardType="decimal-pad"
                autoCapitalize="none"
                style={styles.input}
                placeholder={createDraft.priceType === 'negotiable' ? 'Optional' : 'Required'}
                placeholderTextColor="#8e8e93"
              />
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              value={createDraft.description}
              onChangeText={(text) => setCreateDraft((current) => ({ ...current, description: text }))}
              multiline
              style={[styles.input, styles.multilineInput]}
              placeholder="Optional details for buyers"
              placeholderTextColor="#8e8e93"
            />
          </View>

          {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, (pressed || isCreateBusy) && styles.primaryButtonPressed]}
            onPress={handleCreateListing}
            disabled={isCreateBusy}
          >
            <Text style={styles.primaryButtonText}>{isCreateBusy ? 'Creating...' : 'Create Listing'}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Manage Listings</Text>
          <IOSSegmentedControl
            options={STATUS_TABS}
            selectedKey={statusFilter}
            onChange={setStatusFilter}
          />

          {listings.length === 0 ? (
            <Text style={styles.emptyText}>No listings for this status yet.</Text>
          ) : (
            <View style={styles.listingsContainer}>
              {listings.map((listing) => {
                const editing = editingListingId === listing.id;
                const badgeStyles = getStatusBadgeStyles(listing.status);

                return (
                  <View key={listing.id} style={styles.listingCard}>
                    <View style={styles.listingHeader}>
                      <Image
                        source={{ uri: listing.item.thumbnailUrl ?? listing.item.photoUrl }}
                        style={styles.listingImage}
                        resizeMode="cover"
                      />
                      <View style={styles.listingMain}>
                        <Text style={styles.listingName}>{listing.item.name?.trim() || 'Untitled item'}</Text>
                        <Text style={styles.listingPrice}>{formatPrice(listing.price, listing.priceType)}</Text>
                        <Text style={styles.listingMeta}>{formatDateLabel(listing.createdAt)}</Text>
                      </View>
                      <View style={[styles.badgeBase, badgeStyles.container]}>
                        <Text style={[styles.badgeLabel, badgeStyles.label]}>{listing.status}</Text>
                      </View>
                    </View>

                    {!editing ? (
                      <View style={styles.actionRow}>
                        <Pressable style={styles.secondaryButton} onPress={() => beginEdit(listing)}>
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton} onPress={() => applyStatusAction(listing.id, 'reserved')}>
                          <Text style={styles.secondaryButtonText}>Reserve</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton} onPress={() => applyStatusAction(listing.id, 'sold')}>
                          <Text style={styles.secondaryButtonText}>Mark Sold</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton} onPress={() => applyStatusAction(listing.id, 'removed')}>
                          <Text style={styles.secondaryButtonText}>Remove</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton} onPress={() => applyStatusAction(listing.id, 'active')}>
                          <Text style={styles.secondaryButtonText}>Activate</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.editCard}>
                        <View style={styles.row}>
                          <Pressable
                            style={({ pressed }) => [styles.compactPickerButton, pressed && styles.pickerButtonPressed]}
                            onPress={() => openPriceTypePicker(true)}
                          >
                            <Text style={styles.pickerButtonLabel}>Price Type</Text>
                            <Text style={styles.pickerButtonValue}>
                              {PRICE_TYPE_OPTIONS.find((option) => option.value === editDraft.priceType)?.label ?? 'Fixed'}
                            </Text>
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [styles.compactPickerButton, pressed && styles.pickerButtonPressed]}
                            onPress={() => openConditionPicker(true)}
                          >
                            <Text style={styles.pickerButtonLabel}>Condition</Text>
                            <Text style={styles.pickerButtonValue}>
                              {CONDITION_OPTIONS.find((option) => option.value === editDraft.condition)?.label ?? 'Good'}
                            </Text>
                          </Pressable>
                        </View>

                        <Pressable
                          style={({ pressed }) => [styles.pickerButton, pressed && styles.pickerButtonPressed]}
                          onPress={openStatusPicker}
                        >
                          <Text style={styles.pickerButtonLabel}>Status</Text>
                          <Text style={styles.pickerButtonValue}>
                            {STATUS_OPTIONS.find((option) => option.value === editDraft.status)?.label ?? 'Active'}
                          </Text>
                        </Pressable>

                        {editDraft.priceType !== 'free' ? (
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Price (USD)</Text>
                            <TextInput
                              value={editDraft.priceText}
                              onChangeText={(text) => setEditDraft((current) => ({ ...current, priceText: text }))}
                              keyboardType="decimal-pad"
                              autoCapitalize="none"
                              style={styles.input}
                              placeholder={editDraft.priceType === 'negotiable' ? 'Optional' : 'Required'}
                              placeholderTextColor="#8e8e93"
                            />
                          </View>
                        ) : null}

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Description</Text>
                          <TextInput
                            value={editDraft.description}
                            onChangeText={(text) => setEditDraft((current) => ({ ...current, description: text }))}
                            multiline
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Optional details for buyers"
                            placeholderTextColor="#8e8e93"
                          />
                        </View>

                        {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

                        <View style={styles.actionRow}>
                          <Pressable style={styles.secondaryButton} onPress={cancelEdit}>
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.primaryButton,
                              styles.compactPrimaryButton,
                              (pressed || updateListingMutation.isPending) && styles.primaryButtonPressed,
                            ]}
                            onPress={submitEdit}
                            disabled={updateListingMutation.isPending}
                          >
                            <Text style={styles.primaryButtonText}>
                              {updateListingMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: iosSpacing.lg,
    gap: iosSpacing.md,
    paddingBottom: iosSpacing.xl + iosSpacing.sm,
  },
  sectionCard: {
    backgroundColor: iosColors.surface,
    borderRadius: iosRadius.lg,
    borderWidth: 1,
    borderColor: iosColors.separator,
    padding: iosSpacing.md,
    gap: iosSpacing.sm,
  },
  sectionTitle: {
    ...iosTypography.title,
    fontWeight: '700',
    color: iosColors.textPrimary,
  },
  sectionHelper: {
    ...iosTypography.caption,
    color: iosColors.textSecondary,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: iosSpacing.sm,
  },
  pickerButton: {
    borderRadius: iosRadius.md,
    borderWidth: 1,
    borderColor: iosColors.separatorStrong,
    backgroundColor: iosColors.surfaceMuted,
    paddingHorizontal: iosSpacing.md,
    paddingVertical: 10,
  },
  compactPickerButton: {
    flex: 1,
    borderRadius: iosRadius.md,
    borderWidth: 1,
    borderColor: iosColors.separatorStrong,
    backgroundColor: iosColors.surfaceMuted,
    paddingHorizontal: iosSpacing.md,
    paddingVertical: 10,
  },
  pickerButtonPressed: {
    backgroundColor: iosColors.pressed,
  },
  pickerButtonLabel: {
    ...iosTypography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: iosColors.textSecondary,
  },
  pickerButtonValue: {
    marginTop: 2,
    fontSize: 15,
    color: iosColors.textPrimary,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...iosTypography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: iosColors.textSecondary,
  },
  input: {
    backgroundColor: iosColors.surfaceMuted,
    borderWidth: 1,
    borderColor: iosColors.separatorStrong,
    borderRadius: iosRadius.md,
    paddingHorizontal: iosSpacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: iosColors.textPrimary,
  },
  multilineInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: iosColors.tint,
    borderRadius: iosRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: iosSpacing.lg,
  },
  compactPrimaryButton: {
    flex: 1,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: iosColors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  listingsContainer: {
    gap: iosSpacing.sm,
  },
  listingCard: {
    borderWidth: 1,
    borderColor: iosColors.separator,
    borderRadius: iosRadius.lg,
    padding: 10,
    gap: iosSpacing.sm,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosSpacing.sm,
  },
  listingImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: iosColors.separatorStrong,
  },
  listingMain: {
    flex: 1,
    gap: 2,
  },
  listingName: {
    ...iosTypography.body,
    fontWeight: '700',
    color: iosColors.textPrimary,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: iosColors.tint,
  },
  listingMeta: {
    ...iosTypography.footnote,
    color: iosColors.textSecondary,
  },
  badgeBase: {
    borderRadius: 999,
    paddingHorizontal: iosSpacing.sm,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  activeBadge: {
    backgroundColor: iosColors.successBg,
  },
  activeBadgeText: {
    color: iosColors.success,
  },
  reservedBadge: {
    backgroundColor: iosColors.warningBg,
  },
  reservedBadgeText: {
    color: iosColors.warning,
  },
  soldBadge: {
    backgroundColor: iosColors.pressed,
  },
  soldBadgeText: {
    color: iosColors.textPrimary,
  },
  removedBadge: {
    backgroundColor: iosColors.pressed,
  },
  removedBadgeText: {
    color: iosColors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: iosSpacing.sm,
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: iosColors.separatorStrong,
    backgroundColor: iosColors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: iosSpacing.sm,
  },
  secondaryButtonText: {
    ...iosTypography.caption,
    fontWeight: '600',
    color: iosColors.textPrimary,
  },
  editCard: {
    borderTopWidth: 1,
    borderTopColor: iosColors.separator,
    paddingTop: 10,
    gap: iosSpacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: iosColors.textSecondary,
  },
  errorText: {
    color: iosColors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  helperText: {
    marginTop: iosSpacing.sm,
    fontSize: 14,
    color: iosColors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: iosColors.textPrimary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: iosSpacing.md,
    backgroundColor: iosColors.tint,
    borderRadius: 10,
    paddingHorizontal: iosSpacing.lg,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: iosColors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
