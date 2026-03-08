'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Region, SolarSystem } from '@/lib/regions';

interface DropdownEntry {
  key: string;
  /** Primary label shown in the dropdown */
  label: string;
  /** Dimmed secondary label (region name for system entries, system names for region entries) */
  subLabel?: string;
  /** The region this entry resolves to */
  region: Region;
  /** True when this entry represents a system rather than a region directly */
  isSystem: boolean;
}

interface RegionSelectorProps {
  label: string;
  placeholder?: string;
  value: Region | null;
  onChange: (region: Region | null) => void;
  regions: Region[];
  systems?: SolarSystem[];
  disabled?: boolean;
  autoFocus?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function RegionSelector({
  label,
  placeholder = 'Search regions or systems...',
  value,
  onChange,
  regions,
  systems = [],
  disabled = false,
  autoFocus = false,
  isFavorite = false,
  onToggleFavorite,
}: RegionSelectorProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Build dropdown entries from both regions and systems
  const dropdownEntries = useMemo((): DropdownEntry[] => {
    if (query === '') {
      // Empty state: show all regions with their notable systems as hint
      return regions.map(r => ({
        key: `r-${r.regionId}`,
        label: r.name,
        subLabel: r.notableSystems?.join(', '),
        region: r,
        isSystem: false,
      }));
    }

    const lowerQuery = query.toLowerCase();
    const entries: DropdownEntry[] = [];
    const addedRegionIds = new Set<number>();

    // Regions matching by name or fuzzy
    regions.forEach(region => {
      const lowerName = region.name.toLowerCase();
      let matched = lowerName.includes(lowerQuery);
      if (!matched) {
        let qi = 0;
        for (let i = 0; i < lowerName.length && qi < lowerQuery.length; i++) {
          if (lowerName[i] === lowerQuery[qi]) qi++;
        }
        matched = qi === lowerQuery.length;
      }
      if (matched) {
        entries.push({
          key: `r-${region.regionId}`,
          label: region.name,
          subLabel: region.notableSystems?.join(', '),
          region,
          isSystem: false,
        });
        addedRegionIds.add(region.regionId);
      }
    });

    // Systems matching by name — each resolves to its parent region
    systems.forEach(system => {
      if (system.systemName.toLowerCase().includes(lowerQuery)) {
        const region = regions.find(r => r.regionId === system.regionId);
        if (region && !addedRegionIds.has(region.regionId)) {
          entries.push({
            key: `s-${system.systemName}`,
            label: system.systemName,
            subLabel: region.name,
            region,
            isSystem: true,
          });
          addedRegionIds.add(region.regionId);
        }
      }
    });

    return entries;
  }, [query, regions, systems]);

  return (
    <div className="w-full">
      <Combobox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            {/* Label */}
            <Combobox.Label className="block text-sm font-medium theme-text-secondary mb-2">
              {label}
            </Combobox.Label>

            {/* Input + Star Button row */}
            <div className="flex items-center gap-2">
              {/* Input Field */}
              <div className="relative flex-1">
                <Combobox.Input
                  ref={inputRef}
                  className="w-full rounded-lg border theme-border theme-bg-secondary py-2 pl-3 pr-10 theme-text-primary placeholder:text-gray-500
                    focus:border-eve-blue focus:outline-none focus:ring-2 focus:ring-eve-blue focus:ring-offset-2 focus:ring-offset-gray-900
                    focus-visible:ring-2 focus-visible:ring-eve-blue focus-visible:ring-offset-2
                    disabled:cursor-not-allowed disabled:opacity-50
                    sm:text-sm transition-colors"
                  placeholder={placeholder}
                  displayValue={(region: Region | null) => region?.name ?? ''}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' && !open) {
                      event.preventDefault();
                      inputRef.current?.click();
                    }
                    if (event.key === 'Escape') {
                      setQuery('');
                    }
                  }}
                />

                <Combobox.Button
                  className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-2
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-eve-blue focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  aria-label="Toggle region dropdown"
                >
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors"
                    aria-hidden="true"
                  />
                </Combobox.Button>
              </div>

              {/* Star Button — only shown when a region is selected */}
              {value && onToggleFavorite && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className="text-lg leading-none text-eve-gold hover:opacity-70 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-eve-blue rounded"
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              )}
            </div>

            {/* Dropdown Options */}
            {dropdownEntries.length > 0 && (
              <Combobox.Options
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border theme-border theme-bg-secondary py-1 text-base shadow-lg
                  focus:outline-none sm:text-sm
                  scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
              >
                {dropdownEntries.map((entry) => (
                  <Combobox.Option
                    key={entry.key}
                    value={entry.region}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                        active ? 'bg-eve-blue/20 theme-text-primary' : 'theme-text-secondary'
                      }`
                    }
                  >
                    {({ active, selected }) => (
                      <>
                        <span className="flex items-baseline gap-2">
                          <span className={`truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {entry.label}
                          </span>
                          {entry.subLabel && (
                            <span className={`text-xs shrink-0 ${entry.isSystem ? 'opacity-60' : 'opacity-40'}`}>
                              {entry.isSystem ? `→ ${entry.subLabel}` : entry.subLabel}
                            </span>
                          )}
                        </span>

                        {selected && (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                              active ? 'theme-text-primary' : 'text-eve-blue'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}

            {/* No Results Message */}
            {query !== '' && dropdownEntries.length === 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border theme-border theme-bg-secondary py-2 px-3 text-sm theme-text-secondary">
                No regions or systems found matching &quot;{query}&quot;
              </div>
            )}
          </div>
        )}
      </Combobox>
    </div>
  );
}
