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
