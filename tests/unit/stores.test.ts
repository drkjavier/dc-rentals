// TDD — EJ-15/17: stores de booking y filtros (SDD §9.2)
import { describe, it, expect, beforeEach } from "vitest";
import { useBookingStore } from "@/stores/booking-store";
import { useFilterStore } from "@/stores/filter-store";

describe("booking-store", () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
  });

  it("calculates nights between dates", () => {
    const { setDates } = useBookingStore.getState();
    setDates("2027-05-10", "2027-05-15");
    expect(useBookingStore.getState().nights()).toBe(5);
  });

  it("returns 0 nights without dates", () => {
    expect(useBookingStore.getState().nights()).toBe(0);
  });

  it("toggles extras on and off", () => {
    const { toggleExtra } = useBookingStore.getState();
    toggleExtra("linen-kit");
    toggleExtra("wifi-hotspot");
    expect(useBookingStore.getState().extras.map((e) => e.id)).toEqual([
      "linen-kit",
      "wifi-hotspot",
    ]);
    toggleExtra("linen-kit");
    expect(useBookingStore.getState().extras.map((e) => e.id)).toEqual(["wifi-hotspot"]);
  });

  it("clearDates keeps the vehicle", () => {
    const store = useBookingStore.getState();
    store.setVehicle("DC-C3-001");
    store.setDates("2027-05-10", "2027-05-15");
    useBookingStore.getState().clearDates();
    expect(useBookingStore.getState().startDate).toBeNull();
    expect(useBookingStore.getState().vehicleId).toBe("DC-C3-001");
  });

  it("reset clears everything", () => {
    const store = useBookingStore.getState();
    store.setVehicle("DC-C3-001");
    store.setDates("2027-05-10", "2027-05-15");
    store.setKmPackage("standard");
    store.reset();
    expect(useBookingStore.getState().startDate).toBeNull();
    expect(useBookingStore.getState().kmPackage).toBeNull();
    expect(useBookingStore.getState().vehicleId).toBeNull();
  });
});

describe("filter-store", () => {
  beforeEach(() => {
    useFilterStore.getState().resetFilters();
  });

  it("sets and resets individual filters", () => {
    const { setFilter } = useFilterStore.getState();
    setFilter("type", "CLASS_C");
    setFilter("sleepCapacity", 6);
    setFilter("petFriendly", true);
    expect(useFilterStore.getState().type).toBe("CLASS_C");
    expect(useFilterStore.getState().sleepCapacity).toBe(6);
    expect(useFilterStore.getState().petFriendly).toBe(true);

    useFilterStore.getState().resetFilters();
    expect(useFilterStore.getState().type).toBeNull();
    expect(useFilterStore.getState().petFriendly).toBeNull();
    expect(useFilterStore.getState().sortBy).toBe("recommended");
  });
});
