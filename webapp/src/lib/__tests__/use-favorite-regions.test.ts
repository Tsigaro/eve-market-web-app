import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavoriteRegions } from '../use-favorite-regions';

const LS_KEY = 'eve-market-favorite-regions';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useFavoriteRegions', () => {
  it('returns empty set when localStorage is empty', () => {
    const { result } = renderHook(() => useFavoriteRegions());
    expect(result.current.favoriteIds.size).toBe(0);
  });

  it('hydrates from existing localStorage value on init', () => {
    localStorage.setItem(LS_KEY, JSON.stringify([10000002, 10000043]));
    const { result } = renderHook(() => useFavoriteRegions());
    expect(result.current.favoriteIds.has(10000002)).toBe(true);
    expect(result.current.favoriteIds.has(10000043)).toBe(true);
    expect(result.current.favoriteIds.size).toBe(2);
  });

  it('returns empty set when localStorage value is corrupt', () => {
    localStorage.setItem(LS_KEY, 'not-valid-json{{{');
    const { result } = renderHook(() => useFavoriteRegions());
    expect(result.current.favoriteIds.size).toBe(0);
  });

  it('toggleFavorite adds a regionId not yet in the set', () => {
    const { result } = renderHook(() => useFavoriteRegions());
    act(() => {
      result.current.toggleFavorite(10000002);
    });
    expect(result.current.favoriteIds.has(10000002)).toBe(true);
  });

  it('toggleFavorite removes a regionId already in the set', () => {
    localStorage.setItem(LS_KEY, JSON.stringify([10000002]));
    const { result } = renderHook(() => useFavoriteRegions());
    act(() => {
      result.current.toggleFavorite(10000002);
    });
    expect(result.current.favoriteIds.has(10000002)).toBe(false);
  });

  it('persists added regionId to localStorage', () => {
    const { result } = renderHook(() => useFavoriteRegions());
    act(() => {
      result.current.toggleFavorite(10000002);
    });
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as number[];
    expect(stored).toContain(10000002);
  });

  it('persists removal to localStorage', () => {
    localStorage.setItem(LS_KEY, JSON.stringify([10000002, 10000043]));
    const { result } = renderHook(() => useFavoriteRegions());
    act(() => {
      result.current.toggleFavorite(10000002);
    });
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as number[];
    expect(stored).not.toContain(10000002);
    expect(stored).toContain(10000043);
  });

  it('isFavorite returns true for saved id', () => {
    localStorage.setItem(LS_KEY, JSON.stringify([10000002]));
    const { result } = renderHook(() => useFavoriteRegions());
    expect(result.current.isFavorite(10000002)).toBe(true);
  });

  it('isFavorite returns false for unsaved id', () => {
    const { result } = renderHook(() => useFavoriteRegions());
    expect(result.current.isFavorite(10000002)).toBe(false);
  });
});
