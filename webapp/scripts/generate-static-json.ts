/**
 * Generate Static JSON Files for Static-Cache Architecture
 *
 * Reads consolidated market data artifacts and generates pre-calculated
 * opportunity JSON files for all region pairs that have sufficient data.
 * Also generates regions.json so the app always shows exactly what was fetched.
 *
 * CRITICAL: Files are written to public/data/ but NEVER committed to git.
 * See .gitignore for enforcement.
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../src/lib/logger';

// Minimum number of orders for a region to be included in the app.
// Regions below this threshold are likely sparse null-sec/low-sec with no real market.
const MIN_ORDERS = 1000;

interface MarketOrder {
  order_id: number;
  type_id: number;
  price: number;
  volume_remain: number;
  location_id: number;
  is_buy_order: boolean;
  issued: string;
}

interface RegionData {
  regionId: number;
  fetchedAt: string;
  orderCount: number;
  orders: MarketOrder[];
}

interface Opportunity {
  typeId: number;
  itemName: string;
  buyPrice: number;
  sellPrice: number;
  profitPerUnit: number;
  buyStation: string;
  sellStation: string;
  roi: number;
  volumeAvailable: number;
  maxProfit: number;
}

interface StaticOpportunityFile {
  lastUpdated: string;
  buyRegion: number;
  sellRegion: number;
  buyRegionName: string;
  sellRegionName: string;
  opportunities: Opportunity[];
}

interface RegionInfo {
  regionId: number;
  name: string;
}

/**
 * Fetch region name from ESI
 */
async function fetchRegionName(regionId: number): Promise<string> {
  try {
    const res = await fetch(`https://esi.evetech.net/latest/universe/regions/${regionId}/`);
    if (!res.ok) return `Region ${regionId}`;
    const data = await res.json() as { name?: string };
    return data.name ?? `Region ${regionId}`;
  } catch {
    return `Region ${regionId}`;
  }
}

/**
 * Fetch item name from ESI
 */
async function fetchTypeName(typeId: number): Promise<string> {
  try {
    const res = await fetch(`https://esi.evetech.net/latest/universe/types/${typeId}/`);
    if (!res.ok) return `Item ${typeId}`;
    const data = await res.json() as { name?: string };
    return data.name ?? `Item ${typeId}`;
  } catch {
    return `Item ${typeId}`;
  }
}

/**
 * Fetch station name from ESI. Returns null for player structures (require OAuth).
 */
async function fetchLocationName(locationId: number): Promise<string | null> {
  if (locationId >= 100_000_000) {
    // Player structure (citadel) — requires OAuth, skip
    return null;
  }
  try {
    const res = await fetch(`https://esi.evetech.net/latest/universe/stations/${locationId}/`);
    if (!res.ok) return `Station ${locationId}`;
    const data = await res.json() as { name?: string };
    return data.name ?? `Station ${locationId}`;
  } catch {
    return `Station ${locationId}`;
  }
}

/**
 * Run async tasks with a concurrency limit
 */
async function resolveInBatches<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn));
  }
}

/**
 * Load all region data from JSON artifacts
 */
function loadRegionData(artifactsDir: string): Map<number, RegionData> {
  const regionDataMap = new Map<number, RegionData>();

  if (!fs.existsSync(artifactsDir)) {
    throw new Error(`Artifacts directory not found: ${artifactsDir}`);
  }

  const allFiles = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.json'));

  // Separate full region files from part files
  const fullFiles = allFiles.filter(f => !f.includes('-part'));
  const partFiles = allFiles.filter(f => f.includes('-part'));

  logger.info({
    event: 'loading_artifacts',
    filesFound: allFiles.length,
    fullFiles: fullFiles.length,
    partFiles: partFiles.length,
  });

  // Load full region files
  for (const file of fullFiles) {
    const filepath = path.join(artifactsDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const data: RegionData = JSON.parse(content);
    regionDataMap.set(data.regionId, data);
    logger.debug({ event: 'artifact_loaded', regionId: data.regionId, orderCount: data.orderCount });
  }

  // Group part files by regionId and merge them
  const partsByRegion = new Map<number, RegionData[]>();
  for (const file of partFiles) {
    const filepath = path.join(artifactsDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const data: RegionData = JSON.parse(content);
    const parts = partsByRegion.get(data.regionId) || [];
    parts.push(data);
    partsByRegion.set(data.regionId, parts);
  }

  // Merge parts into single RegionData per region
  partsByRegion.forEach((parts, regionId) => {
    const mergedOrders = parts.flatMap(p => p.orders);
    const merged: RegionData = {
      regionId,
      fetchedAt: parts[0].fetchedAt,
      orderCount: mergedOrders.length,
      orders: mergedOrders,
    };
    regionDataMap.set(regionId, merged);
    logger.info({ event: 'parts_merged', regionId, parts: parts.length, totalOrders: mergedOrders.length });
  });

  return regionDataMap;
}

type PriceEntry = { price: number; volume: number; location: number };

/**
 * Pre-compute per-region price maps once so large regions (e.g. The Forge 444k orders)
 * are only scanned once regardless of how many pairs they appear in.
 *
 * lowestSell: lowest sell-order price per typeId  → what you pay to BUY in this region
 * highestBuy: highest buy-order price per typeId  → what you GET when SELLING in this region
 */
function buildRegionPriceMaps(data: RegionData): {
  lowestSell: Map<number, PriceEntry>;
  highestBuy: Map<number, PriceEntry>;
} {
  const lowestSell = new Map<number, PriceEntry>();
  const highestBuy = new Map<number, PriceEntry>();

  for (const order of data.orders) {
    const price = Number(order.price);
    const entry: PriceEntry = { price, volume: order.volume_remain, location: Number(order.location_id) };

    if (!order.is_buy_order) {
      // Sell order: track lowest price (cheapest place to buy)
      const existing = lowestSell.get(order.type_id);
      if (!existing || price < existing.price) lowestSell.set(order.type_id, entry);
    } else {
      // Buy order: track highest price (best place to sell)
      const existing = highestBuy.get(order.type_id);
      if (!existing || price > existing.price) highestBuy.set(order.type_id, entry);
    }
  }

  return { lowestSell, highestBuy };
}

/**
 * Calculate opportunities between two regions using pre-computed price maps.
 * O(types_in_buy_region) — no re-scanning raw orders.
 */
function calculateOpportunitiesFromMaps(
  buyRegionMaps: ReturnType<typeof buildRegionPriceMaps>,
  sellRegionMaps: ReturnType<typeof buildRegionPriceMaps>
): Array<Omit<Opportunity, 'itemName' | 'buyStation' | 'sellStation'> & {
  buyLocationId: number;
  sellLocationId: number;
}> {
  const opportunities: Array<Omit<Opportunity, 'itemName' | 'buyStation' | 'sellStation'> & {
    buyLocationId: number;
    sellLocationId: number;
  }> = [];

  // For each item we can BUY in the buy-region, check if we can SELL it at profit in the sell-region
  buyRegionMaps.lowestSell.forEach((buyData, typeId) => {
    const sellData = sellRegionMaps.highestBuy.get(typeId);
    if (!sellData) return;

    const buyPrice = buyData.price;
    const sellPrice = sellData.price;
    const profitPerUnit = sellPrice - buyPrice;
    const roi = (profitPerUnit / buyPrice) * 100;
    const volumeAvailable = Math.min(buyData.volume, sellData.volume);
    const maxProfit = profitPerUnit * volumeAvailable;

    if (roi > 0 && buyPrice > 0 && sellPrice > 0 && isFinite(roi)) {
      opportunities.push({
        typeId,
        buyPrice: Math.round(buyPrice * 100) / 100,
        sellPrice: Math.round(sellPrice * 100) / 100,
        profitPerUnit: Math.round(profitPerUnit * 100) / 100,
        buyLocationId: buyData.location,
        sellLocationId: sellData.location,
        roi: Math.round(roi * 100) / 100,
        volumeAvailable,
        maxProfit: Math.round(maxProfit * 100) / 100,
      });
    }
  });

  opportunities.sort((a, b) => b.roi - a.roi);
  return opportunities;
}

/**
 * Main execution
 */
async function generateStaticJSON() {
  const startTime = Date.now();

  logger.info({ event: 'generate_static_started' });

  const artifactsDir = path.join(process.cwd(), 'market-data-artifacts');
  const outputDir = path.join(process.cwd(), 'public', 'data');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    logger.info({ event: 'output_dir_created', path: outputDir });
  }

  // Load all region data
  const regionDataMap = loadRegionData(artifactsDir);

  // Filter to regions with enough orders to be useful
  const qualifyingRegions = Array.from(regionDataMap.values())
    .filter(r => r.orderCount >= MIN_ORDERS)
    .sort((a, b) => b.orderCount - a.orderCount); // largest markets first

  logger.info({
    event: 'regions_qualified',
    total: regionDataMap.size,
    qualifying: qualifyingRegions.length,
    minOrders: MIN_ORDERS,
  });

  // Fetch region names from ESI in parallel
  console.log(`\nFetching names for ${qualifyingRegions.length} regions from ESI...`);
  const regionInfos: RegionInfo[] = await Promise.all(
    qualifyingRegions.map(async (r) => ({
      regionId: r.regionId,
      name: await fetchRegionName(r.regionId),
    }))
  );

  // Sort alphabetically for the regions.json file
  regionInfos.sort((a, b) => a.name.localeCompare(b.name));

  // Build a name lookup map
  const regionNameMap = new Map(regionInfos.map(r => [r.regionId, r.name]));

  // Write regions.json — this is what the app loads for the region selector
  fs.writeFileSync(
    path.join(outputDir, 'regions.json'),
    JSON.stringify(regionInfos, null, 2)
  );
  console.log(`✅ Wrote regions.json with ${regionInfos.length} regions`);

  // Pre-compute price maps once per region (avoids re-scanning large regions per pair)
  console.log(`\nPre-computing price maps for ${qualifyingRegions.length} regions...`);
  const regionPriceMaps = new Map<number, ReturnType<typeof buildRegionPriceMaps>>();
  for (const regionData of qualifyingRegions) {
    regionPriceMaps.set(regionData.regionId, buildRegionPriceMaps(regionData));
  }

  // Generate opportunity files for all pairs
  const qualifyingIds = qualifyingRegions.map(r => r.regionId);
  let generatedCount = 0;
  let skippedCount = 0;

  // --- Pass 1: collect all unique typeIds and locationIds across top-1000 per pair ---
  console.log('\nPass 1: collecting unique item and station IDs...');
  const allTypeIds = new Set<number>();
  const allLocationIds = new Set<number>();

  for (const buyRegionId of qualifyingIds) {
    for (const sellRegionId of qualifyingIds) {
      if (buyRegionId === sellRegionId) continue;
      const opps = calculateOpportunitiesFromMaps(
        regionPriceMaps.get(buyRegionId)!,
        regionPriceMaps.get(sellRegionId)!
      ).slice(0, 1000);
      for (const opp of opps) {
        allTypeIds.add(opp.typeId);
        allLocationIds.add(opp.buyLocationId);
        allLocationIds.add(opp.sellLocationId);
      }
    }
  }

  console.log(`  → ${allTypeIds.size} unique items, ${allLocationIds.size} unique stations`);

  // --- Resolve names from ESI — items and stations run in parallel, 50 concurrent each ---
  const typeNames = new Map<number, string>();
  const locationNames = new Map<number, string | null>();

  console.log(`\nResolving ${allTypeIds.size} item names + ${allLocationIds.size} station names from ESI (parallel)...`);
  await Promise.all([
    resolveInBatches([...allTypeIds], 50, async (typeId) => {
      typeNames.set(typeId, await fetchTypeName(typeId));
    }),
    resolveInBatches([...allLocationIds], 50, async (locationId) => {
      locationNames.set(locationId, await fetchLocationName(locationId));
    }),
  ]);

  console.log('✅ Names resolved.');

  // --- Pass 2: write output files with resolved names ---
  console.log('\nPass 2: writing opportunity files...');

  for (const buyRegionId of qualifyingIds) {
    for (const sellRegionId of qualifyingIds) {
      if (buyRegionId === sellRegionId) continue;

      const buyMaps = regionPriceMaps.get(buyRegionId)!;
      const sellMaps = regionPriceMaps.get(sellRegionId)!;

      const opportunities = calculateOpportunitiesFromMaps(buyMaps, sellMaps);
      const topOpportunities = opportunities.slice(0, 1000);

      const outputOpportunities: Opportunity[] = topOpportunities
        .filter(opp =>
          locationNames.get(opp.buyLocationId) !== null &&
          locationNames.get(opp.sellLocationId) !== null
        )
        .map(opp => ({
          typeId: opp.typeId,
          itemName: typeNames.get(opp.typeId) ?? `Item ${opp.typeId}`,
          buyPrice: opp.buyPrice,
          sellPrice: opp.sellPrice,
          profitPerUnit: opp.profitPerUnit,
          buyStation: locationNames.get(opp.buyLocationId) ?? `Station ${opp.buyLocationId}`,
          sellStation: locationNames.get(opp.sellLocationId) ?? `Station ${opp.sellLocationId}`,
          roi: opp.roi,
          volumeAvailable: opp.volumeAvailable,
          maxProfit: opp.maxProfit,
        }));

      const output: StaticOpportunityFile = {
        lastUpdated: new Date().toISOString(),
        buyRegion: buyRegionId,
        sellRegion: sellRegionId,
        buyRegionName: regionNameMap.get(buyRegionId) ?? `Region ${buyRegionId}`,
        sellRegionName: regionNameMap.get(sellRegionId) ?? `Region ${sellRegionId}`,
        opportunities: outputOpportunities,
      };

      const filename = `${buyRegionId}-${sellRegionId}.json`;
      fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(output));
      generatedCount++;
    }
  }

  // Generate metadata file
  const metadata = {
    lastGenerated: new Date().toISOString(),
    deploymentVersion: Date.now().toString(),
    regionPairs: generatedCount,
    regions: qualifyingRegions.length,
    skippedPairs: skippedCount,
    version: '1.0.0',
  };

  fs.writeFileSync(
    path.join(outputDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  const duration = Date.now() - startTime;

  logger.info({
    event: 'generate_static_completed',
    filesGenerated: generatedCount,
    filesSkipped: skippedCount,
    durationMs: duration,
    durationSeconds: Math.round(duration / 1000),
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ STATIC JSON GENERATION COMPLETE');
  console.log('='.repeat(70));
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🌍 Regions included: ${qualifyingRegions.length} (≥${MIN_ORDERS} orders)`);
  console.log(`📊 Region pairs generated: ${generatedCount}`);
  console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
  console.log('='.repeat(70));
  console.log('\n⚠️  REMINDER: These files are NOT committed to git (.gitignore)');
  console.log('They are served from GitHub Pages (gh-pages branch).\n');
}

generateStaticJSON().catch((error) => {
  console.error('Fatal error during static JSON generation:', error);
  process.exit(1);
});
