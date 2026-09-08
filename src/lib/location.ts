/**
 * Shared location types and helpers used by the LocationAutocomplete
 * component and the forms that consume it.
 */

export interface LocationSelection {
  /** Human-readable address line (e.g. "1 Kwame Nkrumah Ave, Accra, Ghana"). */
  formattedAddress: string;
  /** Street / house number, if inferable. */
  streetAndHouseNumber?: string;
  /** Locality / town. */
  city?: string;
  /** Town / locality (customer address uses `town`). */
  town?: string;
  /** Administrative area level 2 (e.g. district). */
  district?: string;
  /** Administrative area level 1 (e.g. region). */
  region?: string;
  /** Two-letter country code. */
  country?: string;
  lat: number;
  lng: number;
}

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

/** Picks a component by type, preferring long_name. */
function pick(
  components: AddressComponent[],
  type: string,
  preferred: "long" | "short" = "long",
): string | undefined {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return undefined;
  return preferred === "long" ? match.long_name : match.short_name;
}

/**
 * Converts the raw google.maps.places Autocomplete result into a normalized
 * LocationSelection. This keeps the Places SDK types isolated to one helper.
 */
export function toLocationSelection(
  place: {
    address_components?: AddressComponent[];
    formatted_address?: string;
    geometry?: { location?: { lat: () => number; lng: () => number } };
  },
): LocationSelection {
  const components = place.address_components ?? [];

  const streetNumber = pick(components, "street_number");
  const route = pick(components, "route");
  const streetAndHouseNumber = [streetNumber, route]
    .filter(Boolean)
    .join(" ");

  const city =
    pick(components, "locality") ??
    pick(components, "sublocality_level_1") ??
    pick(components, "sublocality") ??
    pick(components, "postal_town");

  const district =
    pick(components, "administrative_area_level_2") ??
    pick(components, "sublocality_level_2");

  const region = pick(components, "administrative_area_level_1");
  const country = pick(components, "country", "short");

  const location = place.geometry?.location;
  const lat = location ? location.lat() : 0;
  const lng = location ? location.lng() : 0;

  return {
    formattedAddress:
      place.formatted_address ??
      [streetAndHouseNumber, city, region, country].filter(Boolean).join(", "),
    streetAndHouseNumber: streetAndHouseNumber || undefined,
    city,
    town: city,
    district,
    region,
    country,
    lat,
    lng,
  };
}

/** Attempts to obtain the user's current coordinates via the Geolocation API. */
export function getCurrentPosition(): Promise<{
  lat: number;
  lng: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied"
              : "Unable to determine your location",
          ),
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}
