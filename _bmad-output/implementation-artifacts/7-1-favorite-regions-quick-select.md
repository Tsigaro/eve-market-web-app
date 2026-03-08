# Story 7.1: Favorite Regions Quick Select

Status: review

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

### Updated: `RegionSelector`

**File:** `webapp/src/components/RegionSelector.tsx`

New optional props: `isFavorite?: boolean`, `onToggleFavorite?: () => void`

Star button renders to the right of the input when `value` is non-null and `onToggleFavorite` is provided.

### Updated: `page.tsx` (home page)

**File:** `webapp/src/app/page.tsx`

- `useFavoriteRegions()` called once in `HomePageContent`
- Both `<RegionSelector>` instances receive `isFavorite` and `onToggleFavorite`
- Pills row: shows favorites with ✕ when any exist; falls back to TRADE_HUBS when empty

## Tasks / Subtasks

- [x] **Task 1: Create `useFavoriteRegions` hook**
  - [x] 1.1 Create `webapp/src/lib/use-favorite-regions.ts` using design above
  - [x] 1.2 Write unit tests in `webapp/src/lib/__tests__/use-favorite-regions.test.ts`
    - [x] Returns empty set on first load (no localStorage)
    - [x] `toggleFavorite` adds a regionId not yet in the set
    - [x] `toggleFavorite` removes a regionId already in the set
    - [x] State persists to localStorage on each toggle
    - [x] Hydrates correctly from existing localStorage value on init
    - [x] `isFavorite` returns true for saved id, false for unsaved

- [x] **Task 2: Add star button to `RegionSelector`**
  - [x] 2.1 Add optional props `isFavorite` and `onToggleFavorite` to `RegionSelectorProps`
  - [x] 2.2 Render star button (★/☆) to the right of the combobox input when `value` is non-null and `onToggleFavorite` is provided
  - [x] 2.3 Star button must not interfere with combobox open/close or keyboard navigation
  - [x] 2.4 Write tests in `webapp/src/components/RegionSelector.test.tsx`
    - [x] Star button renders when value is set and `onToggleFavorite` is provided
    - [x] Star button does not render when value is null
    - [x] Star button does not render when `onToggleFavorite` is not provided
    - [x] Star button shows ★ when `isFavorite` is true
    - [x] Star button shows ☆ when `isFavorite` is false
    - [x] Clicking star button calls `onToggleFavorite`

- [x] **Task 3: Wire favorites into `page.tsx`**
  - [x] 3.1 Call `useFavoriteRegions()` in `HomePageContent`
  - [x] 3.2 Pass correct `isFavorite` and `onToggleFavorite` to Buy Market `<RegionSelector>`
  - [x] 3.3 Pass correct `isFavorite` and `onToggleFavorite` to Sell Market `<RegionSelector>`
  - [x] 3.4 Replace TRADE_HUBS pills with favorites pills (with ✕) when favorites exist; fall back to TRADE_HUBS when empty
  - [x] 3.5 Verify ✕ on a pill calls `toggleFavorite` and pill disappears immediately
  - [x] 3.6 Verify fallback pills (TRADE_HUBS) still set the correct region on click

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes

- Added Vitest + @testing-library/react + jsdom as devDependencies (no prior test framework existed)
- Created `vitest.config.ts` with jsdom environment, `@/*` alias, and exclusion of pre-existing manual `esi-client.test.ts` script
- Created `src/test-setup.ts` importing `@testing-library/jest-dom`
- Added `test` and `test:watch` scripts to `package.json`
- `useFavoriteRegions`: SSR-safe lazy init, handles corrupt localStorage gracefully
- `RegionSelector`: star button sits outside the Combobox in a flex row alongside the input; does not affect dropdown behaviour
- `page.tsx`: single `useFavoriteRegions()` instance shared by both selectors; favorites pills use split pill design (name button + ✕ button) with rounded-l / rounded-r classes
- All 14 tests pass (9 hook, 5 component)

### File List

**New:**
- `webapp/src/lib/use-favorite-regions.ts`
- `webapp/src/lib/__tests__/use-favorite-regions.test.ts`
- `webapp/src/components/RegionSelector.test.tsx`
- `webapp/vitest.config.ts`
- `webapp/src/test-setup.ts`

**Modified:**
- `webapp/src/components/RegionSelector.tsx`
- `webapp/src/app/page.tsx`
- `webapp/package.json`
