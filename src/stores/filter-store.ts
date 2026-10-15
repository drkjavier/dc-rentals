// src/stores/filter-store.ts — Estado de filtros del catálogo (SDD §9.2)
import { create } from "zustand";

export type SortBy = "recommended" | "price_asc" | "price_desc" | "length_desc";

interface FilterState {
  type: string | null;
  sleepCapacity: number | null;
  maxPrice: number | null;
  locationId: string | null;
  petFriendly: boolean | null;
  sortBy: SortBy;

  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  type: null,
  sleepCapacity: null,
  maxPrice: null,
  locationId: null,
  petFriendly: null,
  sortBy: "recommended",

  setFilter: (key, value) => set({ [key]: value } as Partial<FilterState>),
  resetFilters: () =>
    set({
      type: null,
      sleepCapacity: null,
      maxPrice: null,
      locationId: null,
      petFriendly: null,
      sortBy: "recommended",
    }),
}));
