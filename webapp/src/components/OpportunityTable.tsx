'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 10;

const DEFAULT_COLUMN_WIDTHS = [200, 200, 200, 130, 130, 90, 90, 130, 130];

export interface Opportunity {
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

type SortColumn =
  | 'itemName'
  | 'buyPrice'
  | 'sellPrice'
  | 'profitPerUnit'
  | 'roi'
  | 'volumeAvailable'
  | 'buyStation'
  | 'sellStation'
  | 'maxProfit';

type SortDirection = 'asc' | 'desc';

interface OpportunityTableProps {
  data: Opportunity[];
  /** Changes when the user selects a different region pair; stable across data refreshes. */
  regionKey?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function OpportunityTable({ data, regionKey, onRefresh, isRefreshing = false }: OpportunityTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('roi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Filter state
  const [minMaxProfit, setMinMaxProfit] = useState<string>('');
  const [minROI, setMinROI] = useState<string>('');

  // Debounced filter values
  const [debouncedMinMaxProfit, setDebouncedMinMaxProfit] = useState<string>('');
  const [debouncedMinROI, setDebouncedMinROI] = useState<string>('');

  // Column widths for resizable columns
  const [columnWidths, setColumnWidths] = useState<number[]>(DEFAULT_COLUMN_WIDTHS);

  // Restore table state from localStorage on mount
  useEffect(() => {
    const savedSortColumn = localStorage.getItem('table-sort-column');
    const savedSortDirection = localStorage.getItem('table-sort-direction');
    const savedMinMaxProfit = localStorage.getItem('table-min-max-profit');
    const savedMinROI = localStorage.getItem('table-min-roi');

    if (savedSortColumn) setSortColumn(savedSortColumn as SortColumn);
    if (savedSortDirection) setSortDirection(savedSortDirection as SortDirection);
    if (savedMinMaxProfit) setMinMaxProfit(savedMinMaxProfit);
    if (savedMinROI) setMinROI(savedMinROI);
  }, []);

  // Save table state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('table-sort-column', sortColumn);
    localStorage.setItem('table-sort-direction', sortDirection);
  }, [sortColumn, sortDirection]);

  useEffect(() => {
    localStorage.setItem('table-min-max-profit', minMaxProfit);
  }, [minMaxProfit]);

  useEffect(() => {
    localStorage.setItem('table-min-roi', minROI);
  }, [minROI]);

  // Reset filters only when the region PAIR changes — not on data refreshes
  const regionKeyRef = useRef(regionKey);
  useEffect(() => {
    if (regionKeyRef.current !== regionKey) {
      setMinMaxProfit('');
      setMinROI('');
      setDisplayCount(PAGE_SIZE);
      regionKeyRef.current = regionKey;
    }
  }, [regionKey]);

  // Debounce filter inputs (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinMaxProfit(minMaxProfit);
    }, 300);
    return () => clearTimeout(timer);
  }, [minMaxProfit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinROI(minROI);
    }, 300);
    return () => clearTimeout(timer);
  }, [minROI]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    // Apply filters first
    let filtered = data;

    // Min Max Profit filter (≥ threshold)
    const maxProfitThreshold = parseFloat(debouncedMinMaxProfit);
    if (!isNaN(maxProfitThreshold) && maxProfitThreshold > 0) {
      filtered = filtered.filter(opp => opp.maxProfit >= maxProfitThreshold);
    }

    // Min ROI filter (≥ threshold)
    const roiThreshold = parseFloat(debouncedMinROI);
    if (!isNaN(roiThreshold) && roiThreshold > 0) {
      filtered = filtered.filter(opp => opp.roi >= roiThreshold);
    }

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case 'itemName':
          aVal = a.itemName.toLowerCase();
          bVal = b.itemName.toLowerCase();
          break;
        case 'buyPrice':
          aVal = a.buyPrice;
          bVal = b.buyPrice;
          break;
        case 'sellPrice':
          aVal = a.sellPrice;
          bVal = b.sellPrice;
          break;
        case 'profitPerUnit':
          aVal = a.profitPerUnit;
          bVal = b.profitPerUnit;
          break;
        case 'roi':
          aVal = a.roi;
          bVal = b.roi;
          break;
        case 'volumeAvailable':
          aVal = a.volumeAvailable;
          bVal = b.volumeAvailable;
          break;
        case 'buyStation':
          aVal = a.buyStation;
          bVal = b.buyStation;
          break;
        case 'sellStation':
          aVal = a.sellStation;
          bVal = b.sellStation;
          break;
        case 'maxProfit':
          aVal = a.maxProfit;
          bVal = b.maxProfit;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortColumn, sortDirection, debouncedMinMaxProfit, debouncedMinROI]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'itemName' ? 'asc' : 'desc');
    }
    setDisplayCount(PAGE_SIZE);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colIndex];

    const handleMouseMove = (moveE: MouseEvent) => {
      const delta = moveE.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      setColumnWidths(prev => {
        const next = [...prev];
        next[colIndex] = newWidth;
        return next;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const gridStyle = { gridTemplateColumns: columnWidths.map(w => `${w}px`).join(' ') };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatROI = (roi: number) => {
    return roi.toFixed(2) + '%';
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toLocaleString();
  };

  const headerButtonClass = (column: SortColumn) =>
    `w-full text-left px-0 py-0 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer
    ${sortColumn === column ? 'text-eve-blue' : 'theme-text-secondary hover:theme-text-primary'}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-eve-blue rounded`;

  // Info icon with native tooltip — works inside overflow:hidden containers
  const ColInfo = ({ text }: { text: string }) => (
    <span
      className="inline-flex items-center ml-0.5 text-slate-500 hover:text-slate-300 cursor-help font-normal normal-case tracking-normal align-middle"
      title={text}
      onClick={(e) => e.stopPropagation()}
      aria-label="Column information"
    >
      <InformationCircleIcon className="h-3.5 w-3.5" />
    </span>
  );

  // Resize handle rendered at the right edge of each header cell
  const ResizeHandle = ({ colIndex }: { colIndex: number }) => (
    <div
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none z-10 hover:bg-eve-blue/40 active:bg-eve-blue/60"
      onMouseDown={(e) => handleResizeMouseDown(e, colIndex)}
      aria-hidden="true"
    />
  );

  if (data.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-lg border theme-border theme-bg-secondary">
        <div className="p-12 text-center">
          <p className="theme-text-secondary">No opportunities found</p>
        </div>
      </div>
    );
  }

  const handleClearFilters = () => {
    setMinMaxProfit('');
    setMinROI('');
  };

  const hasActiveFilters = minMaxProfit !== '' || minROI !== '';

  return (
    <div
      className="w-full overflow-hidden rounded-lg border theme-border theme-bg-secondary"
      role="table"
      aria-label="Trading opportunities"
    >
      {/* Filter Controls */}
      <div className="border-b theme-border theme-bg-primary px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Min Max Profit Filter */}
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="min-max-profit" className="block text-xs font-medium theme-text-secondary mb-1">
              Min Max Profit
            </label>
            <div className="relative">
              <input
                id="min-max-profit"
                type="number"
                min="0"
                step="1000"
                value={minMaxProfit}
                onChange={(e) => setMinMaxProfit(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-sm rounded border theme-border theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-eve-blue"
              />
              {minMaxProfit && (
                <button
                  onClick={() => setMinMaxProfit('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear min max profit filter"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Min ROI Filter */}
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="min-roi" className="block text-xs font-medium theme-text-secondary mb-1">
              Min ROI %
            </label>
            <div className="relative">
              <input
                id="min-roi"
                type="number"
                min="0"
                step="1"
                value={minROI}
                onChange={(e) => setMinROI(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-sm rounded border theme-border theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-eve-blue"
              />
              {minROI && (
                <button
                  onClick={() => setMinROI('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear min ROI filter"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-4 py-1.5 text-sm font-medium rounded border theme-border theme-bg-secondary theme-text-primary hover:bg-eve-blue/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-eve-blue flex items-center gap-2"
              aria-label="Refresh data"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-1.5 text-sm font-medium rounded border theme-border theme-bg-secondary theme-text-primary hover:bg-eve-gold/10 transition-colors focus:outline-none focus:ring-2 focus:ring-eve-gold"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="mt-2 text-xs theme-text-secondary">
            Showing {filteredAndSortedData.length.toLocaleString()} of {data.length.toLocaleString()} opportunities
            {debouncedMinMaxProfit && ` • Max Profit ≥ ${parseFloat(debouncedMinMaxProfit).toLocaleString()}`}
            {debouncedMinROI && ` • ROI ≥ ${debouncedMinROI}%`}
          </div>
        )}
      </div>

      {/* Scrollable table area */}
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
        {/* Fixed Table Header with Sortable + Resizable Columns */}
        <div
          className="sticky top-0 z-10 border-b theme-border theme-bg-primary"
          role="rowgroup"
        >
          <div className="grid gap-4 px-4 py-3" style={gridStyle} role="row">
            <div className="relative">
              <button onClick={() => handleSort('itemName')} className={headerButtonClass('itemName')} role="columnheader" aria-sort={sortColumn === 'itemName' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Item <SortIcon column="itemName" />
                <ColInfo text="The item being traded." />
              </button>
              <ResizeHandle colIndex={0} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('buyStation')} className={`${headerButtonClass('buyStation')} text-center`} role="columnheader" aria-sort={sortColumn === 'buyStation' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Buy Station <SortIcon column="buyStation" />
                <ColInfo text="Where you buy the item — the station with the cheapest sell order." />
              </button>
              <ResizeHandle colIndex={1} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('sellStation')} className={`${headerButtonClass('sellStation')} text-center`} role="columnheader" aria-sort={sortColumn === 'sellStation' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Sell Station <SortIcon column="sellStation" />
                <ColInfo text="Where you sell the item after hauling it — the station with the highest buy order." />
              </button>
              <ResizeHandle colIndex={2} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('buyPrice')} className={`${headerButtonClass('buyPrice')} text-right font-mono`} role="columnheader" aria-sort={sortColumn === 'buyPrice' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Buy Price <SortIcon column="buyPrice" />
                <ColInfo text="Price per unit you pay at the buy station (lowest sell order)." />
              </button>
              <ResizeHandle colIndex={3} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('sellPrice')} className={`${headerButtonClass('sellPrice')} text-right font-mono`} role="columnheader" aria-sort={sortColumn === 'sellPrice' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Sell Price <SortIcon column="sellPrice" />
                <ColInfo text="Price per unit you receive at the sell station (highest buy order)." />
              </button>
              <ResizeHandle colIndex={4} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('roi')} className={`${headerButtonClass('roi')} text-right font-mono`} role="columnheader" aria-sort={sortColumn === 'roi' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                ROI% <SortIcon column="roi" />
                <ColInfo text="Return on Investment. Formula: (Sell Price − Buy Price) / Buy Price × 100." />
              </button>
              <ResizeHandle colIndex={5} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('volumeAvailable')} className={`${headerButtonClass('volumeAvailable')} text-right font-mono`} role="columnheader" aria-sort={sortColumn === 'volumeAvailable' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Volume <SortIcon column="volumeAvailable" />
                <ColInfo text="Units available to trade right now, capped by whichever side (buy or sell orders) has less stock." />
              </button>
              <ResizeHandle colIndex={6} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('profitPerUnit')} className={`${headerButtonClass('profitPerUnit')} text-right font-mono`} role="columnheader" aria-sort={sortColumn === 'profitPerUnit' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Profit/Unit <SortIcon column="profitPerUnit" />
                <ColInfo text="ISK profit per unit before taxes and broker fees. Formula: Sell Price − Buy Price." />
              </button>
              <ResizeHandle colIndex={7} />
            </div>

            <div className="relative">
              <button onClick={() => handleSort('maxProfit')} className={`${headerButtonClass('maxProfit')} text-right font-mono`} role="columnheader" aria-sort={sortColumn === 'maxProfit' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Max Profit <SortIcon column="maxProfit" />
                <ColInfo text="Total profit if you trade the full available Volume. Formula: Profit/Unit × Volume. Actual profit will be lower after taxes and broker fees." />
              </button>
              {/* No resize handle on last column */}
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div role="rowgroup">
          {filteredAndSortedData.slice(0, displayCount).map((opportunity, index) => (
            <div
              key={index}
              className={`${index % 2 === 0 ? 'theme-row-even' : 'theme-row-odd'}`}
              role="row"
            >
              <div className="grid gap-4 px-4 py-2 items-start" style={gridStyle}>
                <div className="text-sm theme-text-primary break-words leading-snug" role="cell">
                  {opportunity.itemName}
                </div>
                <div className="text-sm theme-text-secondary text-center break-words leading-snug" role="cell">
                  {opportunity.buyStation}
                </div>
                <div className="text-sm theme-text-secondary text-center break-words leading-snug" role="cell">
                  {opportunity.sellStation}
                </div>
                <div className="text-sm theme-text-secondary text-right font-mono" role="cell">
                  {formatPrice(opportunity.buyPrice)}
                </div>
                <div className="text-sm theme-text-secondary text-right font-mono" role="cell">
                  {formatPrice(opportunity.sellPrice)}
                </div>
                <div className="text-sm text-eve-blue text-right font-mono font-semibold" role="cell">
                  {formatROI(opportunity.roi)}
                </div>
                <div className="text-sm theme-text-secondary text-right font-mono" role="cell">
                  {formatVolume(opportunity.volumeAvailable)}
                </div>
                <div className="text-sm theme-text-success text-right font-mono font-semibold" role="cell">
                  {formatPrice(opportunity.profitPerUnit)}
                </div>
                <div className="text-sm theme-text-success-bold text-right font-mono font-bold" role="cell">
                  {formatPrice(opportunity.maxProfit)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: row count + Load More */}
      <div className="border-t theme-border theme-bg-primary px-4 py-3 flex justify-between items-center gap-4">
        <p className="text-xs theme-text-secondary">
          Showing {Math.min(displayCount, filteredAndSortedData.length).toLocaleString()} of {filteredAndSortedData.length.toLocaleString()} opportunities
        </p>
        {displayCount < filteredAndSortedData.length && (
          <button
            onClick={() => setDisplayCount(c => c + PAGE_SIZE)}
            className="px-4 py-1.5 text-sm font-medium rounded border theme-border theme-bg-secondary theme-text-primary hover:bg-eve-blue/10 transition-colors focus:outline-none focus:ring-2 focus:ring-eve-blue"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
