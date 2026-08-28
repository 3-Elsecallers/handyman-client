import axios from "@/utils/axios";
import { isAxiosError } from "axios";

import { getCatalogServices } from "@/api/provider.api";
import type {
  Booking,
  BookingStatus,
  BookingTimelineEntry,
  PaginatedBookings,
  PaginatedPromos,
  PromoCode,
} from "@/types/customer";

export async function listProviderBookings(params?: {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}) {
  try {
    const response = await axios.get<{ data: PaginatedBookings }>(
      "/providers/me/bookings",
      {
        params: {
          ...(params?.status && { status: params.status }),
          ...(params?.page && { page: params.page }),
          ...(params?.limit && { limit: params.limit }),
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

export async function confirmBooking(id: string) {
  try {
    const response = await axios.put<{ data: Booking }>(`/bookings/${id}/confirm`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function declineBooking(id: string) {
  try {
    const response = await axios.put<{ data: Booking }>(`/bookings/${id}/decline`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function startBooking(id: string) {
  try {
    const response = await axios.put<{ data: Booking }>(`/bookings/${id}/start`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function completeBooking(id: string) {
  try {
    const response = await axios.put<{ data: Booking }>(`/bookings/${id}/complete`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listAllBookings(params?: {
  status?: BookingStatus;
  search?: string;
  providerId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const response = await axios.get<{ data: PaginatedBookings }>("/admin/bookings", {
      params: {
        ...(params?.status && { status: params.status }),
        ...(params?.search && { search: params.search }),
        ...(params?.providerId && { providerId: params.providerId }),
        ...(params?.page && { page: params.page }),
        ...(params?.limit && { limit: params.limit }),
      },
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getAdminBooking(id: string) {
  try {
    const response = await axios.get<{ data: Booking }>(`/admin/bookings/${id}`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function resolveDispute(
  id: string,
  input: { resolveTo: "completed" | "cancelled"; note?: string },
) {
  try {
    const response = await axios.put<{ data: Booking }>(
      `/admin/bookings/${id}/resolve`,
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listPromos(params?: { page?: number; limit?: number }) {
  try {
    const response = await axios.get<{ data: PaginatedPromos }>("/admin/promos", {
      params: {
        ...(params?.page && { page: params.page }),
        ...(params?.limit && { limit: params.limit }),
      },
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createPromo(input: {
  code: string;
  description?: string;
  discountPct?: number;
  discountAmt?: number;
  maxUses?: number;
  expiresAt?: string;
}) {
  try {
    const response = await axios.post<{ data: PromoCode }>("/admin/promos", input);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updatePromo(
  id: string,
  input: Partial<Omit<PromoCode, "id" | "code" | "usedCount" | "createdAt">>,
) {
  try {
    const response = await axios.put<{ data: PromoCode }>(`/admin/promos/${id}`, input);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deletePromo(id: string) {
  try {
    const response = await axios.delete<{ data: { message: string } }>(
      `/admin/promos/${id}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function buildServiceNameMap(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const response = await getCatalogServices();
  if (response?.status === 200 && response.data.data) {
    for (const service of response.data.data) {
      map[service.id] = service.name;
    }
  }
  return map;
}
