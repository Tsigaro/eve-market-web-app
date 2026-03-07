/**
 * Static region data for static-cache architecture
 * These are the EVE Online regions we track for market opportunities
 */

export interface Region {
  regionId: number;
  name: string;
  notableSystems?: string[];
}

export interface TradeHub {
  systemName: string;
  regionId: number;
  regionName: string;
}

// High-volume EVE Online trade hubs
const HIGH_VOLUME_REGIONS: Region[] = [
  { regionId: 10000002, name: 'The Forge', notableSystems: ['Jita'] },
  { regionId: 10000043, name: 'Domain', notableSystems: ['Amarr'] },
  { regionId: 10000042, name: 'Metropolis', notableSystems: ['Hek'] },
  { regionId: 10000032, name: 'Sinq Laison', notableSystems: ['Dodixie'] },
];

// Quick-select trade hub presets (most active markets)
export const TRADE_HUBS: TradeHub[] = [
  { systemName: 'Jita', regionId: 10000002, regionName: 'The Forge' },
  { systemName: 'Amarr', regionId: 10000043, regionName: 'Domain' },
  { systemName: 'Hek', regionId: 10000042, regionName: 'Metropolis' },
  { systemName: 'Dodixie', regionId: 10000032, regionName: 'Sinq Laison' },
  { systemName: 'Rens', regionId: 10000030, regionName: 'Heimatar' },
];

// Additional K-space trading regions (empire + border lowsec)
const ACTIVE_REGIONS: Region[] = [
  // Minmatar
  { regionId: 10000030, name: 'Heimatar', notableSystems: ['Rens'] },        // Rens
  { regionId: 10000028, name: 'Molden Heath' },
  // Caldari
  { regionId: 10000016, name: 'Lonetrek' },
  { regionId: 10000033, name: 'The Citadel' },
  { regionId: 10000069, name: 'Black Rise' },
  // Gallente
  { regionId: 10000037, name: 'Everyshore' },
  { regionId: 10000023, name: 'Essence' },
  { regionId: 10000025, name: 'Placid' },
  { regionId: 10000068, name: 'Verge Vendor' },
  { regionId: 10000048, name: 'Solitude' },
  // Amarr
  { regionId: 10000020, name: 'Tash-Murkon' },
  { regionId: 10000052, name: 'Kador' },
  { regionId: 10000049, name: 'Khanid' },
  { regionId: 10000065, name: 'Kor-Azor' },
  { regionId: 10000067, name: 'Genesis' },
  { regionId: 10000036, name: 'Devoid' },
  { regionId: 10000038, name: 'The Bleak Lands' },
  // Ammatar/Minmatar border
  { regionId: 10000035, name: 'Derelik' },
];

// All trading regions (sorted alphabetically)
const ALL_REGIONS: Region[] = [...HIGH_VOLUME_REGIONS, ...ACTIVE_REGIONS].sort((a, b) =>
  a.name.localeCompare(b.name)
);

/**
 * Get all available trading regions (static list)
 */
export async function getAllRegions(): Promise<Region[]> {
  return ALL_REGIONS;
}

/**
 * Get region by ID
 */
export async function getRegionById(regionId: number): Promise<Region | null> {
  return ALL_REGIONS.find(r => r.regionId === regionId) || null;
}

/**
 * Get region by name (case-insensitive)
 */
export async function getRegionByName(name: string): Promise<Region | null> {
  return ALL_REGIONS.find(r => r.name.toLowerCase() === name.toLowerCase()) || null;
}
