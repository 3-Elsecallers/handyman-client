/**
 * Lazily loads the Google Maps JavaScript API (Places library) once and
 * exposes a hook to consume it. Falls back gracefully when no API key is
 * configured, so the rest of the app can degrade to browser geolocation.
 */

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

type LoadState = "loading" | "ready" | "unavailable" | "error";

interface MapsModule {
  places: typeof google.maps.places;
  maps: typeof google.maps;
}

let cached: MapsModule | null = null;
let cachePromise: Promise<MapsModule> | null = null;

function injectScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const callbackName = `__gmaps_cb_${Date.now()}`;
    const existing = document.getElementById("google-maps-script") as HTMLScriptElement | null;
    if (existing) {
      if ((window as unknown as { google?: typeof google }).google) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      API_KEY,
    )}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      resolve();
    };

    script.onerror = (err) => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      reject(new Error("Google Maps failed to load", { cause: err }));
    };

    document.head.appendChild(script);
  });
}

async function loadMaps(): Promise<MapsModule> {
  if (cached) return cached;

  if (!API_KEY) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured");
  }

  if (!cachePromise) {
    cachePromise = (async () => {
      await injectScript();
      const g = (window as unknown as { google?: typeof google }).google;
      if (!g?.maps?.places) {
        throw new Error("Google Maps Places library is unavailable");
      }
      cached = { places: g.maps.places, maps: g.maps };
      return cached;
    })();
    cachePromise.catch(() => {
      cachePromise = null;
    });
  }

  return cachePromise;
}

export function useGoogleMaps(): {
  load: () => Promise<MapsModule>;
  state: LoadState;
  supported: boolean;
} {
  const state: LoadState = API_KEY
    ? "ready"
    : "unavailable";

  return {
    load: () => loadMaps(),
    state,
    supported: Boolean(API_KEY),
  };
}
