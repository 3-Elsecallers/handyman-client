import axios from "@/utils/axios";
import { isAxiosError } from "axios";

import type {
  UserDetail,
  ServiceCategory,
  Service,
  ProviderProfile,
  ProviderDocument,
  Review,
  PaginatedUsers,
  PaginatedProviders,
  PaginatedReviews,
  PaginatedAuditLogs,
} from "@/types/admin";

interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

export async function getUsers(params: ListUsersParams = {}) {
  try {
    const response = await axios.get<{ data: PaginatedUsers }>("/admin/users", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.search && { search: params.search }),
        ...(params.role && { role: params.role }),
      },
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getUserDetail(id: string) {
  try {
    const response = await axios.get<{ data: UserDetail }>(
      `/admin/users/${id}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateUserStatus(
  id: string,
  action: "suspend" | "activate",
) {
  try {
    const response = await axios.put<{ data: { userId: string; action: string; updatedAt: string } }>(
      `/admin/users/${id}/status`,
      { action },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getVerificationQueue(params: PaginationParams = {}) {
  try {
    const response = await axios.get<{ data: PaginatedProviders }>(
      "/admin/providers/verify",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
        },
      },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function verifyProvider(id: string, approved: boolean, rejectionNote?: string) {
  try {
    const response = await axios.put<{ data: ProviderProfile }>(
      `/admin/providers/${id}/verify`,
      { approved, rejectionNote },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getCategories() {
  try {
    const response = await axios.get<{ data: ServiceCategory[] }>(
      "/services/categories",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  sortOrder?: number;
}) {
  try {
    const response = await axios.post<{ data: ServiceCategory }>(
      "/admin/services/categories",
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateCategory(
  id: string,
  data: Record<string, unknown>,
) {
  try {
    const response = await axios.put<{ data: ServiceCategory }>(
      `/admin/services/categories/${id}`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getServices(params?: { categoryId?: string }) {
  try {
    const response = await axios.get<{ data: Service[] }>("/services", {
      params: params?.categoryId ? { categoryId: params.categoryId } : {},
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createService(data: {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  durationMins: number;
  imageUrl?: string;
  sortOrder?: number;
}) {
  try {
    const response = await axios.post<{ data: Service }>(
      "/admin/services",
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateService(
  id: string,
  data: Record<string, unknown>,
) {
  try {
    const response = await axios.put<{ data: Service }>(
      `/admin/services/${id}`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getFlaggedReviews(params: PaginationParams = {}) {
  try {
    const response = await axios.get<{ data: PaginatedReviews }>(
      "/admin/reviews/moderation",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
        },
      },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function moderateReview(
  id: string,
  status: "visible" | "flagged" | "removed",
) {
  try {
    const response = await axios.put<{ data: Review }>(
      `/admin/reviews/${id}/moderate`,
      { status },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getAuditLog(params: PaginationParams = {}) {
  try {
    const response = await axios.get<{ data: PaginatedAuditLogs }>(
      "/admin/audit-log",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 50,
        },
      },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProviderDocuments(providerId: string) {
  try {
    const response = await axios.get<{ data: ProviderProfile & { providerDocuments: ProviderDocument[] } }>(
      `/admin/providers/${providerId}/documents`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const response = await axios.get<{ data: { url: string; document: ProviderDocument } }>(
      `/admin/documents/${documentId}/download-url`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}
