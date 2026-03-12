'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Unit = 'kg' | 'lbs';

const KG_TO_LBS = 2.20462;
const STORAGE_KEY = 'hevy-unit';

interface UnitContextType {
  unit: Unit;
  toggle: () => void;
  toDisplay: (kg: number) => number;
  fmtWeight: (kg: number, decimals?: number) => string;
  fmtVolume: (kg: number) => string;
}

const UnitContext = createContext<UnitContextType | null>(null);

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<Unit>('lbs');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'kg' || stored === 'lbs') setUnit(stored as Unit);
  }, []);

  function toggle() {
    setUnit((prev) => {
      const next: Unit = prev === 'lbs' ? 'kg' : 'lbs';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  function toDisplay(kg: number): number {
    return unit === 'lbs' ? kg * KG_TO_LBS : kg;
  }

  function fmtWeight(kg: number, decimals = 1): string {
    return `${toDisplay(kg).toFixed(decimals)} ${unit}`;
  }

  function fmtVolume(kg: number): string {
    const v = toDisplay(kg);
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${unit}`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k ${unit}`;
    return `${Math.round(v).toLocaleString()} ${unit}`;
  }

  return (
    <UnitContext.Provider value={{ unit, toggle, toDisplay, fmtWeight, fmtVolume }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits(): UnitContextType {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
}
