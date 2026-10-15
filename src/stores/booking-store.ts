// src/stores/booking-store.ts — Estado del booking flow (SDD §9.2)
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KmPackage = "basic" | "standard" | "unlimited";
export interface ExtraSelection {
  id: string;
  quantity: number;
}

interface BookingState {
  vehicleId: string | null;
  startDate: string | null; // "YYYY-MM-DD"
  endDate: string | null;
  kmPackage: KmPackage | null;
  extras: ExtraSelection[];

  setVehicle: (vehicleId: string) => void;
  setDates: (start: string, end: string) => void;
  clearDates: () => void;
  setKmPackage: (pkg: KmPackage | null) => void;
  toggleExtra: (id: string) => void;
  reset: () => void;
  nights: () => number;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      vehicleId: null,
      startDate: null,
      endDate: null,
      kmPackage: null,
      extras: [],

      setVehicle: (vehicleId: string) => set({ vehicleId }),
      setDates: (startDate: string, endDate: string) => set({ startDate, endDate }),
      clearDates: () => set({ startDate: null, endDate: null }),
      setKmPackage: (kmPackage: KmPackage | null) => set({ kmPackage }),
      toggleExtra: (id: string) =>
        set((s) => ({
          extras: s.extras.some((e) => e.id === id)
            ? s.extras.filter((e) => e.id !== id)
            : [...s.extras, { id, quantity: 1 }],
        })),
      reset: () =>
        set({ vehicleId: null, startDate: null, endDate: null, kmPackage: null, extras: [] }),

      nights: () => {
        const { startDate, endDate } = get();
        if (!startDate || !endDate) return 0;
        return Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
        );
      },
    }),
    {
      name: "dc-rentals-booking",
      partialize: (s) => ({
        vehicleId: s.vehicleId,
        startDate: s.startDate,
        endDate: s.endDate,
      }),
    }
  )
);
