// src/hooks/use-availability.ts — Fetch de disponibilidad (SDD §9.1: 60 s cache)
import { useCallback, useEffect, useState } from "react";
import type { CalendarDay } from "@/lib/availability";

interface UseAvailabilityResult {
  days: CalendarDay[];
  isLoading: boolean;
  error: string | null;
}

export function useAvailability(
  vehicleId: string,
  year: number,
  month: number
): UseAvailabilityResult {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        vehicleId,
        year: String(year),
        month: String(month),
        months: "2",
      });
      const res = await fetch(`/api/availability?${params}`);
      if (!res.ok) throw new Error(`availability ${res.status}`);
      const data = await res.json();
      setDays(data.days ?? []);
    } catch {
      // Degradación graceful: sin datos, el island muestra el mes vacío
      setError("unavailable");
      setDays([]);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  return { days, isLoading, error };
}

export default useAvailability;
