import { useQuery } from '@tanstack/react-query';
import type { Opportunity } from '@/components/OpportunityTable';
import { dataUrl } from '@/lib/data-url';
import { getAllRegions } from '@/lib/regions';

const PROFIT_PER_UNIT_THRESHOLD = 100_000_000;

export interface HighProfitOpportunity extends Opportunity {
  buyRegionName: string;
  sellRegionName: string;
}

async function fetchHighProfitOpportunities(): Promise<HighProfitOpportunity[]> {
  // Load available regions — prefer the generated regions.json (matches what was actually fetched)
  let regions: { regionId: number; name: string }[] = [];
  try {
    const res = await fetch(dataUrl('regions.json'));
    if (res.ok) {
      regions = await res.json();
    }
  } catch {
    // fallback below
  }
  if (regions.length === 0) {
    regions = await getAllRegions();
  }

  // Build all directional region pairs (buy → sell)
  const pairs = regions.flatMap((buy) =>
    regions
      .filter((sell) => sell.regionId !== buy.regionId)
      .map((sell) => ({ buy, sell }))
  );

  // Fetch all pairs in parallel — browser will naturally queue excess connections
  const settled = await Promise.allSettled(
    pairs.map(({ buy, sell }) =>
      fetch(dataUrl(`${buy.regionId}-${sell.regionId}.json`))
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  const results: HighProfitOpportunity[] = [];

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    if (outcome.status !== 'fulfilled' || !outcome.value) continue;

    const json = outcome.value;
    const { buy, sell } = pairs[i];
    const opportunities: Opportunity[] = json.opportunities ?? [];

    for (const opp of opportunities) {
      if (opp.profitPerUnit >= PROFIT_PER_UNIT_THRESHOLD) {
        results.push({
          ...opp,
          buyRegionName: json.buyRegionName ?? buy.name,
          sellRegionName: json.sellRegionName ?? sell.name,
        });
      }
    }
  }

  results.sort((a, b) => b.profitPerUnit - a.profitPerUnit);
  return results;
}

export function useHighProfitOpportunities() {
  return useQuery({
    queryKey: ['high-profit-opportunities'],
    queryFn: fetchHighProfitOpportunities,
    staleTime: 5 * 60 * 1000,
  });
}
