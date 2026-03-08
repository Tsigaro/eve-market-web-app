import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegionSelector } from './RegionSelector';
import type { Region } from '@/lib/regions';

const regions: Region[] = [
  { regionId: 10000002, name: 'The Forge', notableSystems: ['Jita'] },
  { regionId: 10000043, name: 'Domain', notableSystems: ['Amarr'] },
];

const selectedRegion = regions[0];

function renderSelector(props: Partial<Parameters<typeof RegionSelector>[0]> = {}) {
  return render(
    <RegionSelector
      label="Buy Market"
      value={null}
      onChange={vi.fn()}
      regions={regions}
      {...props}
    />
  );
}

describe('RegionSelector — star button', () => {
  it('does not render star button when value is null', () => {
    renderSelector({ value: null, onToggleFavorite: vi.fn() });
    expect(screen.queryByRole('button', { name: /favorite/i })).toBeNull();
  });

  it('does not render star button when onToggleFavorite is not provided', () => {
    renderSelector({ value: selectedRegion });
    expect(screen.queryByRole('button', { name: /favorite/i })).toBeNull();
  });

  it('renders hollow star (☆) when value is set, onToggleFavorite provided, and isFavorite is false', () => {
    renderSelector({ value: selectedRegion, onToggleFavorite: vi.fn(), isFavorite: false });
    const btn = screen.getByRole('button', { name: 'Add to favorites' });
    expect(btn).toBeDefined();
    expect(btn.textContent).toBe('☆');
  });

  it('renders filled star (★) when isFavorite is true', () => {
    renderSelector({ value: selectedRegion, onToggleFavorite: vi.fn(), isFavorite: true });
    const btn = screen.getByRole('button', { name: 'Remove from favorites' });
    expect(btn).toBeDefined();
    expect(btn.textContent).toBe('★');
  });

  it('calls onToggleFavorite when star button is clicked', () => {
    const onToggleFavorite = vi.fn();
    renderSelector({ value: selectedRegion, onToggleFavorite, isFavorite: false });
    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
