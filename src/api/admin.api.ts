import axios from "@/utils/axios";
import { isAxiosError } from "axios";

import type {
  UserDetail,
  ServiceCategory,
  Service,
  ProviderProfile,
  ProviderDetail,
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
  status?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface ListProvidersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  verificationStatus?: string;
}

export async function getUsers(params: ListUsersParams = {}) {
  try {
    const response = await axios.get<{ data: PaginatedUsers }>("/admin/users", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.search && { search: params.search }),
        ...(params.role && { role: params.role }),
        ...(params.status && { status: params.status }),
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
    const response = await axios.put<{ data: { id: string; status: string; updatedAt: string } }>(
      `/admin/users/${id}/status`,
      { action },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deleteUser(id: string) {
  try {
    const response = await axios.delete<{ data: { userId: string; deletedAt: string } }>(
      `/admin/users/${id}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getAllProviders(params: ListProvidersParams = {}) {
  try {
    const response = await axios.get<{ data: PaginatedProviders }>(
      "/admin/providers",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
          ...(params.verificationStatus && { verificationStatus: params.verificationStatus }),
        },
      },
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

export async function getVerificationQueueCount() {
  try {
    const response = await axios.get<{ data: { count: number } }>(
      "/admin/providers/verify/count",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProviderDetail(id: string) {
  try {
    const response = await axios.get<{ data: ProviderDetail }>(
      `/admin/providers/${id}`,
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

export async function getCategories(includeInactive = false) {
  try {
    const response = await axios.get<{ data: ServiceCategory[] }>(
      "/services/categories",
      {
        params: includeInactive ? { includeInactive: "true" } : {},
      },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createCategory(data: {
  name: string;
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

export async function deleteCategory(id: string) {
  try {
    const response = await axios.delete<{ data: { id: string; deletedAt: string } }>(
      `/admin/services/categories/${id}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getServices(params?: { categoryId?: string; search?: string; includeInactive?: boolean }) {
  try {
    const response = await axios.get<{ data: Service[] }>("/services", {
      params: {
        ...(params?.categoryId && { categoryId: params.categoryId }),
        ...(params?.search && { search: params.search }),
        ...(params?.includeInactive && { includeInactive: "true" }),
      },
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

export async function deleteService(id: string) {
  try {
    const response = await axios.delete<{ data: { id: string; deletedAt: string } }>(
      `/admin/services/${id}`,
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

export async function getDocumentFile(documentId: string): Promise<string | null> {
  try {
    const response = await axios.get<Blob>(
      `/admin/documents/${documentId}/file`,
      { responseType: "blob" },
    );
    if (response.status === 200) {
      return URL.createObjectURL(response.data);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getProviderReviews(providerId: string, params: PaginationParams = {}) {
  try {
    const response = await axios.get<{ data: PaginatedReviews }>(
      `/admin/providers/${providerId}/reviews`,
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
