/**
 * EditListingModal - modal form to edit a marketplace listing
 */

import { useCallback, useMemo, useState } from 'react';
import { useListings, type ListingWithItem } from '@/hooks/useListings';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import type { ItemCondition, PriceType } from '@/types/database';

export interface EditListingModalProps {
  isOpen: boolean;
  listing: ListingWithItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ListingFormData {
  price: number | null;
  price_type: PriceType;
  condition: ItemCondition | '';
  description: string;
}

const DESCRIPTION_LIMIT = 500;

const priceTypeOptions: Array<{ label: string; value: PriceType }> = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Negotiable', value: 'negotiable' },
  { label: 'Free', value: 'free' },
];

const conditionOptions: Array<{ label: string; value: ItemCondition }> = [
  { label: 'New', value: 'new' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' },
];

/**
 * Internal form component that receives listing as initial data.
 * Re-mounts when listing changes via key prop from parent.
 */
function EditListingForm({
  listing,
  onClose,
  onSuccess,
}: {
  listing: ListingWithItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { updateListing, markAsSold, removeListing } = useListings();
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  // Initialize form data directly from listing (no useEffect needed)
  const [formData, setFormData] = useState<ListingFormData>({
    price: listing.price,
    price_type: listing.price_type,
    condition: listing.condition,
    description: listing.description || '',
  });
  const [formErrors, setFormErrors] = useState<{ price?: string; condition?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isFree = formData.price_type === 'free';
  const descriptionCount = formData.description.length;
  const isActiveListing = listing.status === 'active';

  const canSubmit = useMemo(() => {
    if (isSubmitting || isUpdatingStatus) return false;
    if (!isFree && (formData.price === null || Number.isNaN(formData.price))) return false;
    if (!formData.condition) return false;
    return true;
  }, [formData.condition, formData.price, isFree, isSubmitting, isUpdatingStatus]);

  const handlePriceChange = useCallback((value: string) => {
    if (value === '') {
      setFormData((prev) => ({ ...prev, price: null }));
      return;
    }
    const parsed = Number(value);
    setFormData((prev) => ({ ...prev, price: Number.isNaN(parsed) ? null : parsed }));
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: { price?: string; condition?: string } = {};

    if (!isFree && (formData.price === null || Number.isNaN(formData.price))) {
      nextErrors.price = 'Price is required';
    }

    if (!formData.condition) {
      nextErrors.condition = 'Condition is required';
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const updateSuccess = await updateListing(listing.id, {
      price: isFree ? null : formData.price,
      price_type: formData.price_type,
      condition: formData.condition as ItemCondition,
      description: formData.description.trim() || null,
    });

    if (!updateSuccess) {
      error('Failed to update listing');
      setIsSubmitting(false);
      return;
    }

    success('Listing updated');
    onSuccess();
    onClose();
  }, [error, formData, isFree, listing.id, onClose, onSuccess, success, updateListing]);

  const handleMarkAsSold = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Mark listing as sold?',
      message: 'This will move the listing to Sold and hide it from shoppers.',
      confirmText: 'Mark as Sold',
    });

    if (!confirmed) return;

    setIsUpdatingStatus(true);
    const updateSuccess = await markAsSold(listing.id);

    if (!updateSuccess) {
      error('Failed to update listing');
      setIsUpdatingStatus(false);
      return;
    }

    success('Listing marked as sold');
    onSuccess();
    onClose();
  }, [confirm, error, listing.id, markAsSold, onClose, onSuccess, success]);

  const handleRemoveListing = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Remove listing?',
      message: 'This will remove the listing from the marketplace.',
      confirmText: 'Remove Listing',
      variant: 'danger',
    });

    if (!confirmed) return;

    setIsUpdatingStatus(true);
    const updateSuccess = await removeListing(listing.id);

    if (!updateSuccess) {
      error('Failed to update listing');
      setIsUpdatingStatus(false);
      return;
    }

    success('Listing removed');
    onSuccess();
    onClose();
  }, [confirm, error, listing.id, onClose, onSuccess, removeListing, success]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-xl rounded-t-xl shadow-xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Edit listing</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Item preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <img
              src={listing.item.thumbnail_url || listing.item.photo_url}
              alt={listing.item.name || 'Listing item'}
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm text-gray-500">Listing</p>
              <p className="text-sm font-semibold text-gray-900">{listing.item.name || 'Untitled item'}</p>
            </div>
          </div>

          {/* Price type */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Price type</p>
            <div className="grid grid-cols-3 gap-2">
              {priceTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    formData.price_type === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="price_type"
                    value={option.value}
                    checked={formData.price_type === option.value}
                    onChange={() => setFormData((prev) => ({ ...prev, price_type: option.value }))}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          {!isFree && (
            <div>
              <label htmlFor="listing-price" className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                id="listing-price"
                type="number"
                value={formData.price ?? ''}
                onChange={(event) => handlePriceChange(event.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {formErrors.price && (
                <p className="mt-1 text-xs text-red-600">{formErrors.price}</p>
              )}
            </div>
          )}

          {/* Condition */}
          <div>
            <label htmlFor="listing-condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              id="listing-condition"
              value={formData.condition}
              onChange={(event) => setFormData((prev) => ({
                ...prev,
                condition: event.target.value as ItemCondition,
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="" disabled>
                Select condition
              </option>
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {formErrors.condition && (
              <p className="mt-1 text-xs text-red-600">{formErrors.condition}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="listing-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="listing-description"
              value={formData.description}
              onChange={(event) => {
                const next = event.target.value.slice(0, DESCRIPTION_LIMIT);
                setFormData((prev) => ({ ...prev, description: next }));
              }}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white resize-none"
              placeholder="Add helpful details for buyers"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {descriptionCount}/{DESCRIPTION_LIMIT}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isUpdatingStatus}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {isActiveListing && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleMarkAsSold}
                  disabled={isSubmitting || isUpdatingStatus}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as Sold
                </button>
                <button
                  type="button"
                  onClick={handleRemoveListing}
                  disabled={isSubmitting || isUpdatingStatus}
                  className="flex-1 px-4 py-3 border border-red-400 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove Listing
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Wrapper component that handles conditional rendering and uses key
 * to force form remount when listing changes.
 */
export function EditListingModal({ isOpen, listing, onClose, onSuccess }: EditListingModalProps) {
  if (!isOpen || !listing) {
    return null;
  }

  // Key forces remount when listing changes, resetting form state
  return (
    <EditListingForm
      key={listing.id}
      listing={listing}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
