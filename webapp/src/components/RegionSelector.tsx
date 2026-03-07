'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Region } from '@/lib/regions';

interface RegionSelectorProps {
  label: string;
  placeholder?: string;
  value: Region | null;
  onChange: (region: Region | null) => void;
  regions: Region[];
  disabled?: boolean;
  autoFocus?: boolean;
}

export function RegionSelector({
  label,
  placeholder = 'Search regions...',
  value,
  onChange,
  regions,
  disabled = false,
  autoFocus = false
}: RegionSelectorProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Fuzzy search implementation
  const filteredRegions = useMemo(() => {
    if (query === '') return regions;

    const lowerQuery = query.toLowerCase();

    return regions.filter((region) => {
      const lowerName = region.name.toLowerCase();

      // Exact match or substring match on region name
      if (lowerName.includes(lowerQuery)) return true;

      // Match on notable systems (e.g. "Jita" → The Forge)
      if (region.notableSystems?.some(s => s.toLowerCase().includes(lowerQuery))) return true;

      // Fuzzy match on region name: all query chars appear in order
      let queryIndex = 0;
      for (let i = 0; i < lowerName.length && queryIndex < lowerQuery.length; i++) {
        if (lowerName[i] === lowerQuery[queryIndex]) {
          queryIndex++;
        }
      }
      return queryIndex === lowerQuery.length;
    });
  }, [query, regions]);

  return (
    <div className="w-full">
      <Combobox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            {/* Label */}
            <Combobox.Label className="block text-sm font-medium theme-text-secondary mb-2">
              {label}
            </Combobox.Label>

            {/* Input Field */}
            <div className="relative">
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
                  // Open dropdown on arrow down when closed
                  if (event.key === 'ArrowDown' && !open) {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                  // Close dropdown on Escape
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

            {/* Dropdown Options */}
            {filteredRegions.length > 0 && (
              <Combobox.Options 
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border theme-border theme-bg-secondary py-1 text-base shadow-lg 
                  focus:outline-none sm:text-sm
                  scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
              >
                {filteredRegions.map((region) => (
                  <Combobox.Option
                    key={region.regionId}
                    value={region}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                        active ? 'bg-eve-blue/20 theme-text-primary' : 'theme-text-secondary'
                      }`
                    }
                  >
                    {({ active, selected }) => (
                      <>
                        <span className="flex items-baseline gap-2">
                          <span
                            className={`truncate ${
                              selected ? 'font-semibold' : 'font-normal'
                            }`}
                          >
                            {region.name}
                          </span>
                          {region.notableSystems && region.notableSystems.length > 0 && (
                            <span className="text-xs opacity-50 shrink-0">
                              {region.notableSystems.join(', ')}
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
            {query !== '' && filteredRegions.length === 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border theme-border theme-bg-secondary py-2 px-3 text-sm theme-text-secondary">
                No regions found matching "{query}"
              </div>
            )}
          </div>
        )}
      </Combobox>
    </div>
  );
}
