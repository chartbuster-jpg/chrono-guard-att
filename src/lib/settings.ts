import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: string;
  school_name: string;
  school_lat: number | null;
  school_lng: number | null;
  geofence_radius_m: number;
  qr_expiry_seconds: number;
}

export const getSettings = async (): Promise<AppSettings | null> => {
  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("singleton", true)
    .maybeSingle();
  return (data as AppSettings) || null;
};

export const updateSettings = async (patch: Partial<AppSettings>) => {
  const { error } = await supabase
    .from("app_settings")
    .update(patch)
    .eq("singleton", true);
  return { error };
};

// Haversine distance in meters
export const distanceMeters = (
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

export const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
