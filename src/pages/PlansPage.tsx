/**
 * Plans Page
 * Three cards: current tier (Free), Basic, Pro. ChatGPT-style layout.
 * Pro = green theme; Basic = black/white; Free = current plan, no subscribe.
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { SkeletonCard } from '@/components/Skeleton';

const FREE_FEATURES = [
  '500 items in inventory',
  '5 AI requests per day',
];

const BASIC_FEATURES = [
  'Store up to 5k items/photos in Inventory',
  'AI message usage limited to 50 requests per day',
  'Standard item listing and Marketplace access',
  'No identity verification',
];

const PRO_FEATURES = [
  'Unlimited inventory photos/items',
  'Unlimited AI usage quota',
  'Identity verification badge displayed on Marketplace',
  'Access to advanced features (e.g. priority AI responses, richer item insights)',
  'Increased trust and visibility in Marketplace listings',
];

function ChevronLeftIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

type PlanSlug = 'free' | 'basic' | 'pro';

interface PlanCardProps {
  slug: PlanSlug;
  title: string;
  price?: string;
  tagline: string;
  features: string[];
  onSubscribe?: (plan: 'basic' | 'pro') => void;
  checkoutLoading: 'basic' | 'pro' | null;
  isCurrent?: boolean;
}

function PlanCard({ slug, title, price, tagline, features, onSubscribe, checkoutLoading, isCurrent }: PlanCardProps) {
  const isPro = slug === 'pro';
  const isFree = slug === 'free';

  // Pro: slight green background, no border; app (blue) for button
  const cardWrapperClass = isPro
    ? 'rounded-2xl bg-green-50 shadow-sm overflow-hidden'
    : isFree
      ? 'rounded-2xl bg-white border-2 border-gray-200 shadow-sm overflow-hidden'
      : 'rounded-2xl bg-white border-2 border-gray-200 shadow-sm overflow-hidden';

  return (
    <article className={`flex flex-col ${cardWrapperClass}`}>
      <div className="p-6 pb-5 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className={`text-xl font-bold ${isPro ? 'text-green-800' : 'text-gray-900'}`}>{title}</h2>
          {price && <span className={`text-lg font-semibold ${isPro ? 'text-green-800' : 'text-gray-900'}`}>{price}</span>}
        </div>
        <p className="text-sm mt-2 text-gray-500">{tagline}</p>
        <ul className="mt-4 space-y-4 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <CheckIcon className={`mt-0.5 ${isPro ? 'text-green-600' : 'text-gray-500'}`} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto p-6 pt-0 min-h-[52px] flex flex-col justify-end">
        {isCurrent ? (
          <div className="py-3 text-center text-sm font-medium text-gray-500">
            Current Plan
          </div>
        ) : (slug === 'basic' || slug === 'pro') && onSubscribe ? (
          <button
            type="button"
            onClick={() => onSubscribe(slug === 'basic' ? 'basic' : 'pro')}
            disabled={checkoutLoading !== null}
            className={
              isPro
                ? 'w-full min-h-[44px] py-3 rounded-xl font-medium text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'w-full min-h-[44px] py-3 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-90'
            }
            style={isPro ? undefined : { backgroundColor: '#374151', color: '#fff', borderWidth: 1, borderColor: '#1f2937' }}
          >
            {checkoutLoading === (slug === 'basic' ? 'basic' : 'pro') ? 'Redirecting…' : 'Subscribe'}
          </button>
        ) : (
          <div className="py-3 text-center text-sm font-medium text-gray-400">
            —
          </div>
        )}
      </div>
    </article>
  );
}

export function PlansPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<'basic' | 'pro' | null>(null);
  const { plan: currentPlan, isLoading: subscriptionLoading, refetch: refetchSubscription } = useUserSubscription();

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      success('Subscription activated. Thank you!');
      setSearchParams({}, { replace: true });
      refetchSubscription();
    }
  }, [searchParams, setSearchParams, success, refetchSubscription]);

  const handleSubscribe = async (plan: 'basic' | 'pro') => {
    setCheckoutLoading(plan);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        error('Please sign in to subscribe.');
        return;
      }
      const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
      const token = (refreshError ? session : freshSession)?.access_token;
      if (!token) {
        error('Session expired. Please sign in again.');
        return;
      }
      const baseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
      if (!baseUrl) {
        error('App misconfiguration: VITE_SUPABASE_URL is not set.');
        return;
      }
      const res = await fetch(`${baseUrl}/functions/v1/subscriptions-create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan,
          success_url: `${window.location.origin}/plans?subscription=success`,
          cancel_url: `${window.location.origin}/plans`,
        }),
      });
      let data: { url?: string; error?: { message?: string } };
      try {
        data = await res.json();
      } catch {
        error(res.ok ? 'Invalid response from server.' : `Checkout failed (${res.status} ${res.statusText}). Is the function deployed?`);
        return;
      }
      if (!res.ok) {
        const msg = data?.error?.message || `Checkout failed (${res.status}).`;
        error(msg);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      error('No checkout URL returned.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed.';
      error(msg.includes('fetch') ? 'Network error. Is the function deployed and reachable?' : msg);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-4 relative">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="text-center pl-12 pr-4">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Choose a plan that fits you.</p>
        </div>
      </div>

      <div className="px-6 pb-10 sm:px-8 sm:pb-12">
        {/* Spacer so gap below header is always visible */}
        <div className="h-8 sm:h-10 shrink-0" aria-hidden />
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-14 items-stretch pb-12">
            {subscriptionLoading ? (
              <>
                <SkeletonCard showImage={false} lines={5} className="rounded-2xl border-2 border-gray-200" />
                <SkeletonCard showImage={false} lines={5} className="rounded-2xl border-2 border-gray-200" />
                <SkeletonCard showImage={false} lines={5} className="rounded-2xl border-2 border-gray-200" />
              </>
            ) : (
              <>
                <PlanCard
                  slug="free"
                  title="Free Plan"
                  tagline="Get started with core features."
                  features={FREE_FEATURES}
                  checkoutLoading={checkoutLoading}
                  isCurrent={currentPlan === 'free'}
                />
                <PlanCard
                  slug="basic"
                  title="Basic Plan"
                  price="$2.99 / month"
                  tagline="Designed for light or casual users."
                  features={BASIC_FEATURES}
                  onSubscribe={handleSubscribe}
                  checkoutLoading={checkoutLoading}
                  isCurrent={currentPlan === 'basic'}
                />
                <PlanCard
                  slug="pro"
                  title="Pro Plan"
                  price="$9.99 / month"
                  tagline="Designed for power users and frequent sellers."
                  features={PRO_FEATURES}
                  onSubscribe={handleSubscribe}
                  checkoutLoading={checkoutLoading}
                  isCurrent={currentPlan === 'pro'}
                />
              </>
            )}
          </div>
        </div>

        <div className="mx-auto mt-12 w-full max-w-5xl">
          <Link
            to="/settings"
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            <span className="text-base font-medium">Back to Settings</span>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
