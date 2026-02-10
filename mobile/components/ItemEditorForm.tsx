import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ActionSheetIOS,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type CategoryOption = {
  id: string;
  name: string;
  is_system: boolean;
  sort_order: number;
};

type LocationOption = {
  id: string;
  path: string;
};

export type ItemEditorValues = {
  name: string;
  description: string;
  quantity: number;
  categoryId: string | null;
  locationId: string | null;
  tags: string[];
  price: string;
  currency: string;
  purchaseDate: string;
  expirationDate: string;
  warrantyExpiryDate: string;
  brand: string;
  model: string;
};

type ItemEditorFormErrors = Partial<Record<keyof ItemEditorValues, string>>;

type ItemEditorFormProps = {
  mode: 'create' | 'edit';
  userId: string;
  initialValues?: Partial<ItemEditorValues>;
  onSubmit: (values: ItemEditorValues) => void | Promise<void>;
};

const DEFAULT_VALUES: ItemEditorValues = {
  name: '',
  description: '',
  quantity: 1,
  categoryId: null,
  locationId: null,
  tags: [],
  price: '',
  currency: 'USD',
  purchaseDate: '',
  expirationDate: '',
  warrantyExpiryDate: '',
  brand: '',
  model: '',
};

function normalizeValues(values?: Partial<ItemEditorValues>): ItemEditorValues {
  return {
    ...DEFAULT_VALUES,
    ...values,
    name: values?.name?.trim() ?? '',
    description: values?.description?.trim() ?? '',
    quantity: values?.quantity && values.quantity > 0 ? Math.floor(values.quantity) : 1,
    tags: values?.tags ?? [],
    price: values?.price?.trim() ?? '',
    currency: (values?.currency?.trim() ?? 'USD').toUpperCase(),
    purchaseDate: values?.purchaseDate?.trim() ?? '',
    expirationDate: values?.expirationDate?.trim() ?? '',
    warrantyExpiryDate: values?.warrantyExpiryDate?.trim() ?? '',
    brand: values?.brand?.trim() ?? '',
    model: values?.model?.trim() ?? '',
  };
}

function isValidDateString(value: string): boolean {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function validate(values: ItemEditorValues): ItemEditorFormErrors {
  const errors: ItemEditorFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (!Number.isInteger(values.quantity) || values.quantity < 1 || values.quantity > 999) {
    errors.quantity = 'Quantity must be a whole number between 1 and 999.';
  }

  if (values.price) {
    const parsedPrice = Number(values.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'Price must be a valid non-negative number.';
    }
  }

  if (values.currency.length !== 3 || !/^[A-Z]{3}$/.test(values.currency)) {
    errors.currency = 'Currency must use a 3-letter code (for example, USD).';
  }

  if (!isValidDateString(values.purchaseDate)) {
    errors.purchaseDate = 'Use YYYY-MM-DD format.';
  }

  if (!isValidDateString(values.expirationDate)) {
    errors.expirationDate = 'Use YYYY-MM-DD format.';
  }

  if (!isValidDateString(values.warrantyExpiryDate)) {
    errors.warrantyExpiryDate = 'Use YYYY-MM-DD format.';
  }

  return errors;
}

function FieldError({ value }: { value?: string }) {
  if (!value) {
    return null;
  }

  return <Text style={styles.fieldError}>{value}</Text>;
}

export default function ItemEditorForm({ mode, userId, initialValues, onSubmit }: ItemEditorFormProps) {
  const [values, setValues] = useState<ItemEditorValues>(() => normalizeValues(initialValues));
  const [tagsInput, setTagsInput] = useState<string>(() => (initialValues?.tags ?? []).join(', '));
  const [errors, setErrors] = useState<ItemEditorFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['item-form-categories', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, is_system, sort_order')
        .or(`user_id.is.null,user_id.eq.${userId}`);

      if (error) {
        throw error;
      }

      return ((data ?? []) as CategoryOption[]).sort((a, b) => {
        if (a.is_system !== b.is_system) {
          return a.is_system ? -1 : 1;
        }
        if (a.is_system && b.is_system) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });
    },
  });

  const {
    data: locations = [],
    isLoading: isLocationsLoading,
    isError: isLocationsError,
  } = useQuery({
    queryKey: ['item-form-locations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, path')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('path', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as LocationOption[];
    },
  });

  const selectedCategoryName = useMemo(
    () => categories.find((category) => category.id === values.categoryId)?.name ?? 'Not set',
    [categories, values.categoryId]
  );

  const selectedLocationPath = useMemo(
    () => locations.find((location) => location.id === values.locationId)?.path ?? 'Not set',
    [locations, values.locationId]
  );

  const updateField = <T extends keyof ItemEditorValues>(key: T, nextValue: ItemEditorValues[T]) => {
    setValues((previous) => ({ ...previous, [key]: nextValue }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const openCategoryPicker = () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const options = ['No category', ...categories.map((category) => category.name), 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      (buttonIndex) => {
        if (buttonIndex === options.length - 1) {
          return;
        }
        if (buttonIndex === 0) {
          updateField('categoryId', null);
          return;
        }
        const selected = categories[buttonIndex - 1];
        if (selected) {
          updateField('categoryId', selected.id);
        }
      }
    );
  };

  const openLocationPicker = () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const options = ['No location', ...locations.map((location) => location.path), 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      (buttonIndex) => {
        if (buttonIndex === options.length - 1) {
          return;
        }
        if (buttonIndex === 0) {
          updateField('locationId', null);
          return;
        }
        const selected = locations[buttonIndex - 1];
        if (selected) {
          updateField('locationId', selected.id);
        }
      }
    );
  };

  const syncTags = (input: string) => {
    setTagsInput(input);
    const nextTags = input
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    updateField('tags', nextTags);
  };

  const submit = async () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.modeLabel}>{mode === 'create' ? 'Create Item' : 'Edit Item'}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Required</Text>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={values.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Item name"
            placeholderTextColor="#8e8e93"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <FieldError value={errors.name} />

          <Text style={styles.fieldLabel}>Quantity</Text>
          <View style={styles.quantityRow}>
            <Pressable
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              onPress={() => updateField('quantity', Math.max(1, values.quantity - 1))}
            >
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>
            <TextInput
              value={`${values.quantity}`}
              onChangeText={(text) => {
                const parsed = Number(text.replace(/[^0-9]/g, ''));
                updateField('quantity', Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
              }}
              keyboardType="number-pad"
              style={styles.quantityInput}
              maxLength={3}
            />
            <Pressable
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              onPress={() => updateField('quantity', Math.min(999, values.quantity + 1))}
            >
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>
          <FieldError value={errors.quantity} />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            value={values.description}
            onChangeText={(text) => updateField('description', text)}
            placeholder="Optional details"
            placeholderTextColor="#8e8e93"
            style={[styles.input, styles.multilineInput]}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Classification</Text>
          <Pressable
            style={({ pressed }) => [styles.selector, pressed && styles.selectorPressed]}
            onPress={openCategoryPicker}
            disabled={isCategoriesLoading || isCategoriesError}
          >
            <Text style={styles.selectorLabel}>Category</Text>
            <Text style={styles.selectorValue}>{selectedCategoryName}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.selector, pressed && styles.selectorPressed]}
            onPress={openLocationPicker}
            disabled={isLocationsLoading || isLocationsError}
          >
            <Text style={styles.selectorLabel}>Location</Text>
            <Text style={styles.selectorValue}>{selectedLocationPath}</Text>
          </Pressable>
          <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
          <TextInput
            value={tagsInput}
            onChangeText={syncTags}
            placeholder="kitchen, appliance"
            placeholderTextColor="#8e8e93"
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.fieldLabel}>Price</Text>
          <TextInput
            value={values.price}
            onChangeText={(text) => updateField('price', text.trim())}
            placeholder="0.00"
            placeholderTextColor="#8e8e93"
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <FieldError value={errors.price} />

          <Text style={styles.fieldLabel}>Currency</Text>
          <TextInput
            value={values.currency}
            onChangeText={(text) => updateField('currency', text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
            placeholder="USD"
            placeholderTextColor="#8e8e93"
            style={styles.input}
            autoCapitalize="characters"
            maxLength={3}
          />
          <FieldError value={errors.currency} />

          <Text style={styles.fieldLabel}>Purchase Date (YYYY-MM-DD)</Text>
          <TextInput
            value={values.purchaseDate}
            onChangeText={(text) => updateField('purchaseDate', text)}
            placeholder="2026-02-10"
            placeholderTextColor="#8e8e93"
            style={styles.input}
          />
          <FieldError value={errors.purchaseDate} />

          <Text style={styles.fieldLabel}>Expiration Date (YYYY-MM-DD)</Text>
          <TextInput
            value={values.expirationDate}
            onChangeText={(text) => updateField('expirationDate', text)}
            placeholder="2026-12-31"
            placeholderTextColor="#8e8e93"
            style={styles.input}
          />
          <FieldError value={errors.expirationDate} />

          <Text style={styles.fieldLabel}>Warranty Expiry (YYYY-MM-DD)</Text>
          <TextInput
            value={values.warrantyExpiryDate}
            onChangeText={(text) => updateField('warrantyExpiryDate', text)}
            placeholder="2028-02-10"
            placeholderTextColor="#8e8e93"
            style={styles.input}
          />
          <FieldError value={errors.warrantyExpiryDate} />

          <Text style={styles.fieldLabel}>Brand</Text>
          <TextInput
            value={values.brand}
            onChangeText={(text) => updateField('brand', text)}
            placeholder="Brand"
            placeholderTextColor="#8e8e93"
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Model</Text>
          <TextInput
            value={values.model}
            onChangeText={(text) => updateField('model', text)}
            placeholder="Model"
            placeholderTextColor="#8e8e93"
            style={styles.input}
            autoCapitalize="characters"
          />
        </View>

        <Pressable style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]} onPress={submit} disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Item' : 'Save Changes'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a3a3c',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1c1c1e',
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: '#c62828',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f7',
  },
  stepButtonPressed: {
    backgroundColor: '#e5e5ea',
  },
  stepButtonText: {
    fontSize: 22,
    color: '#1c1c1e',
    lineHeight: 24,
  },
  quantityInput: {
    width: 72,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    color: '#1c1c1e',
    backgroundColor: '#ffffff',
  },
  selector: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  selectorPressed: {
    backgroundColor: '#f2f2f7',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectorValue: {
    marginTop: 2,
    fontSize: 15,
    color: '#1c1c1e',
  },
  submitButton: {
    backgroundColor: '#0a84ff',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  submitButtonPressed: {
    backgroundColor: '#007aff',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
