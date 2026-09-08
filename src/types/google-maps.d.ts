/**
 * Minimal ambient declarations for the subset of the Google Maps JavaScript
 * API (Places library) used by the client. These mirror the official
 * `@types/google.maps` shapes for the objects we touch. They are scoped so the
 * app does not need a heavy dependency for a small surface area.
 */

declare namespace google.maps {
  namespace event {
    function addListener(
      instance: object,
      eventName: string,
      handler: () => void,
    ): unknown;
    function clearInstanceListeners(instance: object): void;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface PlaceGeometry {
    location?: LatLng;
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  interface Place {
    address_components?: AddressComponent[];
    formatted_address?: string;
    geometry?: PlaceGeometry;
    name?: string;
    place_id?: string;
  }

  namespace places {
    interface AutocompleteOptions {
      componentRestrictions?: { country: string | string[] };
      fields?: string[];
      types?: string[];
    }

    class Autocomplete {
      constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
      getPlace(): Place;
      addListener(eventName: "place_changed", handler: () => void): unknown;
      set(k: string, v: unknown): void;
    }
  }
}

interface Window {
  google?: typeof google;
}
