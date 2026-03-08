# Story 7.1: Favorite Regions Quick Select

Status: draft

## Story

As a user,
I want to mark regions as favorites and see them as quick-pick pills below the region selector,
So that I can select my frequently used regions with a single click without searching.

## Acceptance Criteria

**AC1 — Star button next to selector:**
Given a region is selected in a RegionSelector,
When I view the selector,
Then a star button (★ filled / ☆ hollow) appears immediately to the right of the input,
And if the selected region is already a favorite the star is filled (★),
And if it is not yet a favorite the star is hollow (☆),
And clicking the star toggles the region's favorite status.

**AC2 — Favorites pills row:**
Given I have at least one favorite region saved,
When I view the page,
Then the quick-pick pill buttons below each selector show my favorite regions,
And each favorite pill has a small ✕ button to remove it from favorites,
And clicking a pill (not ✕) sets that selector's region as before.

**AC3 — Pills fallback:**
Given I have no favorites saved,
When I view the page,
Then the quick-pick pills fall back to the hardcoded TRADE_HUBS list (Jita, Amarr, Hek, Dodixie, Rens) without ✕ buttons,
So new users always see useful quick-picks.

**AC4 — Persistence:**
Given I have toggled favorite regions,
When I refresh the page or open a new session,
Then my favorites are still present,
And favorites are stored in localStorage under key `eve-market-favorite-regions` as an array of regionId numbers.

**AC5 — Favorites shared across selectors:**
Given I star a region using the Buy Market selector,
When I look at the Sell Market selector pills,
Then the same favorite is reflected there immediately,
Because both selectors share one `useFavoriteRegions` instance in the parent page.

**AC6 — Star button hidden when no region selected:**
Given no region is currently selected in a selector,
When I view that selector,
Then no star button is shown (nothing to favorite).

**AC7 — No changes to dropdown search behaviour:**
The existing search/combobox behaviour of RegionSelector is unchanged.
No favorites section is added inside the dropdown.

## Technical Design

### New Hook: `useFavoriteRegions`

**File:** `webapp/src/lib/use-favorite-regions.ts`

- SSR-safe: reads localStorage only on client (lazy state initialiser with `() =>` function)
- localStorage key: `eve-market-favorite-regions`
- Stored value: `number[]` of regionIds
- Returns:
  - `favoriteIds: Set<number>`
  - `toggleFavorite: (regionId: number) => void`
  - `isFavorite: (regionId: number) => boolean`

```typescript
'use client';

import { useState } from 'react';

const LS_KEY = 'eve-market-favorite-regions';

function readFromStorage(): Set<number> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

export function useFavoriteRegions() {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    return readFromStorage();
  });

  const toggleFavorite = (regionId: number) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      localStorage.setItem(LS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const isFavorite = (regionId: number) => favoriteIds.has(regionId);

  return { favoriteIds, toggleFavorite, isFavorite };
}
```

### Updated: `RegionSelector`

**File:** `webapp/src/components/RegionSelector.tsx`

New optional props:
```typescript
isFavorite?: boolean;          // is the currently selected region a favorite?
onToggleFavorite?: () => void; // called when star button is clicked
```

Render a star button to the right of the input when `value` is non-null and `onToggleFavorite` is provided:
```tsx
{value && onToggleFavorite && (
  <button
    type="button"
    onClick={onToggleFavorite}
    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    className="ml-2 text-eve-gold hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-eve-blue"
  >
    {isFavorite ? '★' : '☆'}
  </button>
)}
```

The star button sits alongside the selector input, not inside the combobox dropdown.

### Updated: `page.tsx` (home page)

**File:** `webapp/src/app/page.tsx`

- Call `useFavoriteRegions()` once at the top of `HomePageContent`
- Pass `isFavorite` and `onToggleFavorite` to both `<RegionSelector>` instances
- Replace the hardcoded TRADE_HUBS pills section with a shared `FavoritesPills` inline block:
  - If `favoriteIds.size > 0`: render one pill per favorite region with a `✕` remove button
  - Else: render TRADE_HUBS pills as before (no ✕)

Pills row shape (favorites active):
```tsx
{favoriteIds.size > 0
  ? [...favoriteIds].map(id => {
      const region = regions?.find(r => r.regionId === id);
      if (!region) return null;
      return (
        <span key={id} className="inline-flex items-center gap-0.5">
          <button onClick={() => setMarket(region)} className="pill-active-classes">
            {region.name}
          </button>
          <button onClick={() => toggleFavorite(id)} aria-label={`Remove ${region.name} from favorites`}
            className="text-xs opacity-50 hover:opacity-100">✕</button>
        </span>
      );
    })
  : TRADE_HUBS.map(hub => /* existing pill render */)}
```

## Tasks / Subtasks

- [ ] **Task 1: Create `useFavoriteRegions` hook**
  - [ ] 1.1 Create `webapp/src/lib/use-favorite-regions.ts` using design above
  - [ ] 1.2 Write unit tests in `webapp/src/lib/__tests__/use-favorite-regions.test.ts`
    - [ ] Returns empty set on first load (no localStorage)
    - [ ] `toggleFavorite` adds a regionId not yet in the set
    - [ ] `toggleFavorite` removes a regionId already in the set
    - [ ] State persists to localStorage on each toggle
    - [ ] Hydrates correctly from existing localStorage value on init
    - [ ] `isFavorite` returns true for saved id, false for unsaved

- [ ] **Task 2: Add star button to `RegionSelector`**
  - [ ] 2.1 Add optional props `isFavorite` and `onToggleFavorite` to `RegionSelectorProps`
  - [ ] 2.2 Render star button (★/☆) to the right of the combobox input when `value` is non-null and `onToggleFavorite` is provided
  - [ ] 2.3 Star button must not interfere with combobox open/close or keyboard navigation
  - [ ] 2.4 Write tests in `webapp/src/components/__tests__/RegionSelector.test.tsx`
    - [ ] Star button renders when value is set and `onToggleFavorite` is provided
    - [ ] Star button does not render when value is null
    - [ ] Star button does not render when `onToggleFavorite` is not provided
    - [ ] Star button shows ★ when `isFavorite` is true
    - [ ] Star button shows ☆ when `isFavorite` is false
    - [ ] Clicking star button calls `onToggleFavorite`

- [ ] **Task 3: Wire favorites into `page.tsx`**
  - [ ] 3.1 Call `useFavoriteRegions()` in `HomePageContent`
  - [ ] 3.2 Pass correct `isFavorite` and `onToggleFavorite` to Buy Market `<RegionSelector>`
  - [ ] 3.3 Pass correct `isFavorite` and `onToggleFavorite` to Sell Market `<RegionSelector>`
  - [ ] 3.4 Replace TRADE_HUBS pills with favorites pills (with ✕) when favorites exist; fall back to TRADE_HUBS when empty
  - [ ] 3.5 Verify ✕ on a pill calls `toggleFavorite` and pill disappears immediately
  - [ ] 3.6 Verify fallback pills (TRADE_HUBS) still set the correct region on click

## Dev Agent Record

### Agent Model Used

_to be filled_

### Completion Notes

_to be filled_

### File List

**New:**
- `webapp/src/lib/use-favorite-regions.ts`
- `webapp/src/lib/__tests__/use-favorite-regions.test.ts`
- `webapp/src/components/__tests__/RegionSelector.test.tsx`

**Modified:**
- `webapp/src/components/RegionSelector.tsx`
- `webapp/src/app/page.tsx`
