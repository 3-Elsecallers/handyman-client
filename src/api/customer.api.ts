import axios from "@/utils/axios";
import { isAxiosError } from "axios";

import type {
  Address,
  Booking,
  BookingStatus,
  BookingType,
  Complexity,
  CustomerServiceCategory,
  GhanaRegion,
  PriceBreakdown,
  Service,
} from "@/types/customer";

export async function listAddresses() {
  try {
    const response = await axios.get<{ data: Address[] }>("/customers/addresses");
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getLocations() {
  try {
    const response = await axios.get<{ data: GhanaRegion[] }>(
      "/customers/addresses/locations",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface CreateAddressInput {
  label: string;
  addressType: Address["addressType"];
  region: string;
  district: string;
  town: string;
  streetAndHouseNumber?: string;
  landmark?: string;
  digitalAddress?: string;
  directions?: string;
  contactName: string;
  contactPhone: string;
  country?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

export async function createAddress(input: CreateAddressInput) {
  try {
    const response = await axios.post<{ data: Address }>("/customers/addresses", {
      ...input,
      country: input.country ?? "GH",
      isDefault: input.isDefault ?? false,
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateAddress(id: string, input: Partial<CreateAddressInput>) {
  try {
    const response = await axios.put<{ data: Address }>(
      `/customers/addresses/${id}`,
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deleteAddress(id: string) {
  try {
    const response = await axios.delete<{ data: { message: string } }>(
      `/customers/addresses/${id}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listCategories() {
  try {
    const response = await axios.get<{ data: CustomerServiceCategory[] }>(
      "/services/categories",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listServices(params?: {
  categoryId?: string;
  search?: string;
}) {
  try {
    const response = await axios.get<{ data: Service[] }>("/services", {
      params: {
        ...(params?.categoryId && { categoryId: params.categoryId }),
        ...(params?.search && { search: params.search }),
      },
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getServiceBySlug(slug: string) {
  try {
    const response = await axios.get<{ data: Service }>(`/services/${slug}`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface ListCustomerBookingsParams {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  items: Booking[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function listCustomerBookings(params: ListCustomerBookingsParams = {}) {
  try {
    const response = await axios.get<{ data: BookingListResponse }>(
      "/customers/bookings",
      {
        params: {
          ...(params.status && { status: params.status }),
          page: params.page ?? 1,
          limit: params.limit ?? 10,
        },
      },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getBooking(id: string) {
  try {
    const response = await axios.get<{ data: Booking }>(`/bookings/${id}`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface BookingProvider {
  providerId: string;
  name?: string;
  avatarUrl?: string;
  bio?: string | null;
  avgRating?: number;
  totalJobs?: number;
  avgResponseTimeMins?: number | null;
  verified?: boolean;
}

export async function getBookingProvider(id: string) {
  try {
    const response = await axios.get<{ data: BookingProvider }>(
      `/bookings/${id}/provider`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface BookingTimelineEntry {
  id: string;
  status: string;
  actorId?: string;
  actorRole?: string;
  note?: string | null;
  createdAt: string;
}

export async function getBookingTimeline(id: string) {
  try {
    const response = await axios.get<{ data: BookingTimelineEntry[] }>(
      `/bookings/${id}/timeline`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

interface LocationInput {
  locationLine1: string;
  locationLine2?: string;
  locationCity: string;
  locationState: string;
  locationPostal: string;
  locationLat: number | null;
  locationLng: number | null;
}

export interface CreateInstantBookingInput extends LocationInput {
  type: "instant";
  serviceId: string;
  providerId: string;
  scheduledAt: string;
  complexity: Complexity;
  promoCode?: string;
  notes?: string;
}

export async function createInstantBooking(input: CreateInstantBookingInput) {
  try {
    const response = await axios.post<{ data: Booking }>("/bookings", input);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface CreateRequestBookingInput extends LocationInput {
  type: "request";
  serviceId: string;
  scheduledWindowStart: string;
  scheduledWindowEnd: string;
  complexity: Complexity;
  description?: string;
}

export async function createRequestBooking(input: CreateRequestBookingInput) {
  try {
    const response = await axios.post<{ data: Booking }>("/bookings", input);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface EstimateInput {
  type?: BookingType;
  serviceId: string;
  providerId?: string;
  scheduledAt?: string;
  complexity: Complexity;
  promoCode?: string;
  locationLat: number | null;
  locationLng: number | null;
}

export async function getBookingEstimate(input: EstimateInput) {
  try {
    const response = await axios.post<{ data: PriceBreakdown }>(
      "/bookings/estimate",
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function cancelBooking(id: string, reason?: string) {
  try {
    const response = await axios.put<{ data: Booking }>(
      `/bookings/${id}/cancel`,
      { reason },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function reassignBooking(id: string) {
  try {
    const response = await axios.post<{ data: Booking }>(
      `/customers/bookings/${id}/reassign`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface ReviewInput {
  rating: number;
  comment?: string;
  photoUrls?: string[];
}

export interface ReviewResult {
  id: string;
  rating: number;
  comment?: string;
}

export async function submitReview(id: string, input: ReviewInput) {
  try {
    const response = await axios.post<{ data: ReviewResult }>(
      `/bookings/${id}/review`,
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}
