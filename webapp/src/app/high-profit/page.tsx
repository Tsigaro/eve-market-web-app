'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { OpportunityTable } from '@/components/OpportunityTable';
import { useHighProfitOpportunities } from '@/lib/queries/high-profit-opportunities';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AppVersionBanner } from '@/components/AppVersionBanner';
import { DataFreshness } from '@/components/DataFreshness';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

function HighProfitContent() {
  const {
    data: opportunities,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useHighProfitOpportunities();

  return (
    <div className="min-h-screen theme-bg-primary">
      <AppVersionBanner />

      <header className="border-b theme-border theme-bg-secondary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm theme-text-secondary hover:text-eve-blue transition-colors mb-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Scanner
              </Link>
              <h1 className="text-2xl font-bold theme-text-primary">
                High Profit Opportunities
              </h1>
              <p className="text-sm theme-text-secondary mt-1">
                Items with &gt;100M ISK profit per unit — scanning all region pairs
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="theme-bg-secondary theme-border border rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eve-blue mb-4"></div>
            <p className="theme-text-secondary">Scanning all region pairs...</p>
            <p className="text-xs theme-text-secondary mt-2">
              Fetching opportunities across every region combination — this may take a moment
            </p>
          </div>
        )}

        {error && (
          <div
            className="theme-bg-secondary border border-eve-red rounded-lg p-6"
            role="alert"
          >
            <p className="text-sm text-eve-red font-medium">
              Failed to load opportunities. Please try refreshing.
            </p>
          </div>
        )}

        {!isLoading && !error && opportunities && opportunities.length === 0 && (
          <div className="theme-bg-secondary theme-border border rounded-lg p-12 text-center">
            <h3 className="text-lg font-medium theme-text-primary">
              No high-profit opportunities found
            </h3>
            <p className="mt-2 text-sm theme-text-secondary max-w-md mx-auto">
              No items with &gt;100M ISK profit per unit found across all region pairs with current market data.
            </p>
          </div>
        )}

        {!isLoading && !error && opportunities && opportunities.length > 0 && (
          <section aria-labelledby="high-profit-heading">
            <h2 id="high-profit-heading" className="sr-only">
              High Profit Trading Opportunities
            </h2>
            <p className="text-sm theme-text-secondary mb-4">
              Found{' '}
              <span className="theme-text-primary font-medium">
                {opportunities.length.toLocaleString()}
              </span>{' '}
              opportunities with &gt;100M ISK profit per unit
            </p>
            <OpportunityTable
              data={opportunities}
              onRefresh={() => refetch()}
              isRefreshing={isFetching}
            />
          </section>
        )}
      </main>

      <DataFreshness />
    </div>
  );
}

export default function HighProfitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen theme-bg-primary flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eve-blue mb-4"></div>
            <p className="theme-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <HighProfitContent />
    </Suspense>
  );
}
