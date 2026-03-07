'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RegionSelector } from '@/components/RegionSelector';
import { DataFreshness } from '@/components/DataFreshness';
import { FreshDataNotification } from '@/components/FreshDataNotification';
import { NoDataYetBanner } from '@/components/NoDataYetBanner';
import { AppVersionBanner } from '@/components/AppVersionBanner';
import { OpportunityTable } from '@/components/OpportunityTable';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useRegions } from '@/lib/queries/regions';
import { useOpportunities } from '@/lib/queries/opportunities';
import { useQuery } from '@tanstack/react-query';
import type { Region } from '@/lib/regions';
import { TRADE_HUBS } from '@/lib/regions';
import { metadataUrl } from '@/lib/data-url';

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: regions, isLoading } = useRegions();
  const [buyMarket, setBuyMarket] = useState<Region | null>(null);
  const [sellMarket, setSellMarket] = useState<Region | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if metadata exists (data available)
  const { data: metadata } = useQuery({
    queryKey: ['metadata-availability'],
    queryFn: async () => {
      const res = await fetch(metadataUrl(), { cache: 'no-store' });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const hasData = !!metadata;

  // Restore region selections from URL params on mount
  useEffect(() => {
    if (!regions) return;

    const buyRegionId = searchParams.get('buy');
    const sellRegionId = searchParams.get('sell');

    if (buyRegionId && !buyMarket) {
      const region = regions.find(r => r.regionId === parseInt(buyRegionId));
      if (region) setBuyMarket(region);
    }

    if (sellRegionId && !sellMarket) {
      const region = regions.find(r => r.regionId === parseInt(sellRegionId));
      if (region) setSellMarket(region);
    }
  }, [regions, searchParams, buyMarket, sellMarket]);

  // Update URL when regions change
  useEffect(() => {
    const params = new URLSearchParams();

    if (buyMarket) params.set('buy', buyMarket.regionId.toString());
    if (sellMarket) params.set('sell', sellMarket.regionId.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [buyMarket, sellMarket, router]);

  // Swap buy and sell markets
  const handleSwapMarkets = () => {
    const temp = buyMarket;
    setBuyMarket(sellMarket);
    setSellMarket(temp);
    // Force refetch after swap to bypass cache
    setTimeout(() => {
      refetchOpportunities();
    }, 0);
  };

  // Fetch opportunities when both markets are selected
  const opportunitiesParams =
    buyMarket && sellMarket && !validationError
      ? { buyRegion: buyMarket.regionId, sellRegion: sellMarket.regionId }
      : null;

  const {
    data: opportunitiesResponse,
    isLoading: opportunitiesLoading,
    error: opportunitiesError,
    refetch: refetchOpportunities,
    isFetching: opportunitiesFetching,
  } = useOpportunities(opportunitiesParams);

  // Extract opportunities array from response
  const opportunities = opportunitiesResponse?.opportunities || [];

  // Validate market selection
  useEffect(() => {
    if (buyMarket && sellMarket) {
      if (buyMarket.regionId === sellMarket.regionId) {
        setValidationError('Buy and sell markets must be different');
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, [buyMarket, sellMarket]);

  if (isLoading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eve-blue mb-4"></div>
          <p className="theme-text-secondary">Loading regions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      {/* App Version Banner */}
      <AppVersionBanner />

      {/* No Data Yet Banner */}
      <NoDataYetBanner />

      {/* Fresh Data Notification */}
      <FreshDataNotification />

      {/* Header */}
      <header className="border-b theme-border theme-bg-secondary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold theme-text-primary">
                EVE Market Scanner
              </h1>
              <p className="text-sm theme-text-secondary mt-1">
                Find profitable trading opportunities across regions
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Selection Section */}
        <section className="mb-8" aria-labelledby="market-selection-heading">
          <h2 id="market-selection-heading" className="sr-only">
            Market Selection
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Buy Market */}
            <div className="flex-1 w-full space-y-2">
              <RegionSelector
                label="Buy Market"
                placeholder={hasData ? "Select region to buy from..." : "Waiting for market data..."}
                value={buyMarket}
                onChange={setBuyMarket}
                regions={regions ?? []}
                autoFocus
                disabled={!hasData}
              />
              <div className="flex flex-wrap gap-1.5">
                {TRADE_HUBS.map(hub => {
                  const region = regions?.find(r => r.regionId === hub.regionId);
                  const isActive = buyMarket?.regionId === hub.regionId;
                  return (
                    <button
                      key={hub.regionId}
                      onClick={() => region && setBuyMarket(region)}
                      disabled={!hasData || !region}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        isActive
                          ? 'border-eve-blue text-eve-blue bg-eve-blue/10'
                          : 'theme-border theme-text-secondary hover:border-eve-blue hover:text-eve-blue'
                      }`}
                      title={hub.regionName}
                    >
                      {hub.systemName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapMarkets}
              disabled={!hasData || (!buyMarket && !sellMarket)}
              className="theme-bg-secondary theme-border border rounded-lg p-3 hover:bg-eve-blue/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-eve-blue focus:ring-offset-2 theme-bg-primary"
              title="Swap buy and sell markets"
              aria-label="Swap buy and sell markets"
            >
              <ArrowsRightLeftIcon className="h-6 w-6 theme-text-primary" />
            </button>

            {/* Sell Market */}
            <div className="flex-1 w-full space-y-2">
              <RegionSelector
                label="Sell Market"
                placeholder={hasData ? "Select region to sell in..." : "Waiting for market data..."}
                value={sellMarket}
                onChange={setSellMarket}
                regions={regions ?? []}
                disabled={!hasData}
              />
              <div className="flex flex-wrap gap-1.5">
                {TRADE_HUBS.map(hub => {
                  const region = regions?.find(r => r.regionId === hub.regionId);
                  const isActive = sellMarket?.regionId === hub.regionId;
                  return (
                    <button
                      key={hub.regionId}
                      onClick={() => region && setSellMarket(region)}
                      disabled={!hasData || !region}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        isActive
                          ? 'border-eve-blue text-eve-blue bg-eve-blue/10'
                          : 'theme-border theme-text-secondary hover:border-eve-blue hover:text-eve-blue'
                      }`}
                      title={hub.regionName}
                    >
                      {hub.systemName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div 
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-eve-gold/10 border border-eve-gold"
              role="alert"
              aria-live="polite"
            >
              <svg
                className="h-5 w-5 text-eve-gold flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-eve-gold font-medium">
                {validationError}
              </span>
            </div>
          )}

        </section>

        {/* Opportunities Table */}
        {buyMarket && sellMarket && !validationError && (
          <section aria-labelledby="opportunities-heading">
            <h2 id="opportunities-heading" className="sr-only">
              Trading Opportunities
            </h2>
            {opportunitiesLoading && (
              <div className="theme-bg-secondary theme-border border rounded-lg p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eve-blue mb-4"></div>
                <p className="theme-text-secondary">Loading opportunities...</p>
              </div>
            )}

            {opportunitiesError && (
              <div
                className="theme-bg-secondary border border-eve-red rounded-lg p-6"
                role="alert"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="h-6 w-6 text-eve-red flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-eve-red">
                      Unable to load opportunities
                    </h3>
                    <p className="text-sm theme-text-secondary mt-1">
                      The server encountered an error. Please try refreshing in
                      a few minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!opportunitiesLoading &&
              !opportunitiesError &&
              opportunities &&
              opportunities.length === 0 && (
                <div className="theme-bg-secondary theme-border border rounded-lg p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 theme-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium theme-text-primary">
                    No profitable trades found
                  </h3>
                  <p className="mt-2 text-sm theme-text-secondary max-w-md mx-auto">
                    No profitable trades found between {buyMarket.name} and{' '}
                    {sellMarket.name} with current market conditions. Try
                    different regions.
                  </p>
                </div>
              )}

            {!opportunitiesLoading &&
              !opportunitiesError &&
              opportunities &&
              opportunities.length > 0 && (
                <OpportunityTable
                  data={opportunities}
                  regionKey={`${buyMarket?.regionId}-${sellMarket?.regionId}`}
                  onRefresh={() => refetchOpportunities()}
                  isRefreshing={opportunitiesFetching}
                />
              )}
          </section>
        )}

        {/* Empty State */}
        {(!buyMarket || !sellMarket) && (
          <section aria-labelledby="empty-state-heading">
            <h2 id="empty-state-heading" className="sr-only">
              Getting Started
            </h2>
            <div className="theme-bg-secondary theme-border border rounded-lg p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 theme-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium theme-text-primary">
                Select markets to begin
              </h3>
              <p className="mt-2 text-sm theme-text-secondary max-w-md mx-auto">
                Choose a buy market and a sell market to see profitable trading opportunities across EVE regions.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer with Data Freshness */}
      <DataFreshness />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eve-blue mb-4"></div>
          <p className="theme-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
