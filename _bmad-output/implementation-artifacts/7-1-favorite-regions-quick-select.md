# Story 7.1: Favorite Regions Quick Select

Status: draft

## Story

As a user,
I want to mark regions as favorites and have them appear at the top of the region dropdown,
So that I can quickly select my frequently used regions without scrolling through the full list.

## Acceptance Criteria

**AC1 — Favorites section in dropdown:**
Given the region dropdown is open with an empty search query,
When I have at least one favorite region saved,
Then a "Favorites" section appears at the top of the dropdown list,
And favorite regions are listed there before all other regions,
And a visual separator divides the Favorites section from the full region list below.

**AC2 — Star toggle in dropdown:**
Given the region dropdown is open,
When I hover over any region row,
Then a star icon (☆) appears on the right side of the row,
And if the region is already a favorite, the star is filled (★),
And clicking the star toggles the region's favorite status without closing the dropdown,
And the Favorites section updates immediately to reflect the change.

**AC3 — Persistence:**
Given I have added regions to favorites,
When I refresh the page or open a new session,
Then my favorites are still present,
And favorites are stored in localStorage under key `eve-market-favorite-regions` as an array of regionId numbers.

**AC4 — Favorites shared across selectors:**
Given I have favorite regions set,
When I open either the Buy Market or Sell Market dropdown,
Then both show the same favorites section,
And starring a region in one selector reflects immediately in the other.

**AC5 — Pills row shows favorites:**
Given I have at least one favorite region,
When I view the page,
Then the quick-pick pill buttons below each selector show my favorite regions,
And clicking a pill sets that selector's region (existing behaviour).

**AC6 — Pills fallback:**
Given I have no favorites saved,
When I view the page,
Then the quick-pick pills fall back to the hardcoded TRADE_HUBS list (Jita, Amarr, Hek, Dodixie, Rens),
So new users always see useful quick-picks.

**AC7 — Favorites section hidden when searching:**
Given I am typing a query in the region selector,
When the query is non-empty,
Then the Favorites section is hidden and normal search results are shown (no change to existing search behaviour).

## Technical Design

### New Hook: `useFavoriteRegions`

**File:** `webapp/src/lib/use-favorite-regions.ts`

- SSR-safe: reads localStorage only on client (useEffect / lazy init)
- localStorage key: `eve-market-favorite-regions`
- Stored value: `number[]` of regionIds
- Returns:
  - `favoriteIds: Set<number>`
  - `toggleFavorite: (regionId: number) => void`
  - `isFavorite: (regionId: number) => boolean`

### Updated: `RegionSelector`

**File:** `webapp/src/components/RegionSelector.tsx`

New optional props:
```typescript
favoriteIds?: Set<number>;
onToggleFavorite?: (regionId: number) => void;
```

Dropdown behaviour changes (empty query only):
- If `favoriteIds` has entries: render a Favorites section at top, then a `<hr>` separator, then all regions
- Each row: show star icon button (★ filled / ☆ hollow) on the right; visible on hover of row
- Star click calls `onToggleFavorite(regionId)` and stops propagation (does not select region)

### Updated: `page.tsx` (home page)

**File:** `webapp/src/app/page.tsx`

- Import and call `useFavoriteRegions()`
- Pass `favoriteIds` and `onToggleFavorite` to both `<RegionSelector>` instances
- Replace hardcoded TRADE_HUBS pills with favorites pills; fall back to TRADE_HUBS when `favoriteIds` is empty

## Tasks / Subtasks

- [ ] **Task 1: Create `useFavoriteRegions` hook**
  - [ ] 1.1 Create `webapp/src/lib/use-favorite-regions.ts`
  - [ ] 1.2 Implement SSR-safe localStorage read (lazy initialiser or `useEffect`)
  - [ ] 1.3 Implement `toggleFavorite` — adds if absent, removes if present; writes to localStorage
  - [ ] 1.4 Write unit tests in `webapp/src/lib/__tests__/use-favorite-regions.test.ts`
    - [ ] Returns empty set on first load (no localStorage)
    - [ ] Adds a regionId and persists to localStorage
    - [ ] Removes an existing regionId and persists
    - [ ] Hydrates correctly from existing localStorage value
    - [ ] `isFavorite` returns true/false correctly

- [ ] **Task 2: Update `RegionSelector` to show favorites section and star toggles**
  - [ ] 2.1 Add optional props `favoriteIds` and `onToggleFavorite` to `RegionSelectorProps`
  - [ ] 2.2 When empty query and favorites exist: render favorites section above all regions with a separator
  - [ ] 2.3 Add star icon button per row — filled (★) if favorite, hollow (☆) otherwise
  - [ ] 2.4 Star button click: call `onToggleFavorite`, stop event propagation
  - [ ] 2.5 Hide favorites section when query is non-empty (AC7)
  - [ ] 2.6 Write/update tests in `webapp/src/components/__tests__/RegionSelector.test.tsx`
    - [ ] Renders favorites section when `favoriteIds` is non-empty and query is empty
    - [ ] Does not render favorites section when query is non-empty
    - [ ] Star button calls `onToggleFavorite` with correct regionId
    - [ ] Star button does not trigger region selection
    - [ ] No favorites section rendered when `favoriteIds` is empty or props omitted

- [ ] **Task 3: Update `page.tsx` to wire favorites**
  - [ ] 3.1 Import and call `useFavoriteRegions()` in `HomePageContent`
  - [ ] 3.2 Pass `favoriteIds` and `onToggleFavorite` to both `<RegionSelector>` instances
  - [ ] 3.3 Replace TRADE_HUBS pills with favorites pills; fallback to TRADE_HUBS when no favorites
  - [ ] 3.4 Verify pills behaviour: clicking pill still sets correct region (buy or sell)

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
