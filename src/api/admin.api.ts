import axios from "@/utils/axios";
import { isAxiosError } from "axios";

import type {
  UserDetail,
  ServiceCategory,
  Service,
  ProviderProfile,
  ProviderDetail,
  ProviderDocument,
  ProviderService,
  ProviderIdentity,
  ProviderServiceChecklist,
  Review,
  PaginatedUsers,
  PaginatedProviders,
  PaginatedReviews,
  PaginatedAuditLogs,
  CategoryVettingRequirement,
  CategoryQuestion,
  ServiceVettingRequirement,
  ServiceQuestion,
  ProviderRequirementChecklist,
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
  identityStatus?: string;
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
          ...(params.identityStatus && { identityStatus: params.identityStatus }),
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

export async function verifyProvider(id: string, approved: boolean, rejectionNote?: string, overrideReason?: string) {
  try {
    const response = await axios.put<{ data: ProviderProfile }>(
      `/admin/providers/${id}/verify`,
      { approved, rejectionNote, overrideReason },
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

export async function reviewProviderDocument(
  documentId: string,
  data: { approved: boolean; rejectionReason?: string },
) {
  try {
    const response = await axios.put<{ data: ProviderDocument }>(
      `/admin/documents/${documentId}/review`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface AdminQualityProvider {
  id: string;
  userId: string;
  avgRating: number;
  totalReviews: number;
  totalJobs: number;
  completionRate: number;
  avgResponseTimeMins: number | null;
  competencyTier: string;
  qualityGrade: string;
  status: string;
  verified: boolean;
  activeFlagCount: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

export async function listProviderQuality(params: PaginationParams & {
  grade?: string;
  tier?: string;
  status?: string;
  flagged?: boolean;
} = {}) {
  try {
    const response = await axios.get<{ data: PaginatedQualityProviders }>(
      `/admin/quality/providers`,
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          grade: params.grade,
          tier: params.tier,
          status: params.status,
          flagged: params.flagged,
        },
      },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface PaginatedQualityProviders {
  providers: AdminQualityProvider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getProviderQuality(providerId: string) {
  try {
    const response = await axios.get<{ data: { scorecard: ScorecardShape; flags: QualityFlag[] } }>(
      `/admin/providers/${providerId}/quality`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function recalculateProviderQuality(providerId: string) {
  try {
    const response = await axios.post<{ data: unknown }>(
      `/admin/providers/${providerId}/quality/recalculate`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function resolveProviderQualityFlag(flagId: string) {
  try {
    const response = await axios.put<{ data: unknown }>(
      `/admin/quality/flags/${flagId}/resolve`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

interface ScorecardShape {
  scorecard: {
    tier: string;
    grade: string;
    probation: { active: boolean; bookingsRemaining: number; endDate: string | null };
    metrics: {
      avgRating: number;
      totalReviews: number;
      totalJobs: number;
      completionRate: number;
      cancellationRate: number;
      disputeRate: number;
      avgResponseTimeMins: number | null;
    };
    tenureDays: number;
  };
}

interface QualityFlag {
  id: string;
  providerId: string;
  code: string;
  message: string;
  severity: string;
  active: boolean;
  resolvedAt: string | null;
  createdAt: string;
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

export async function getCategoryRequirements(categoryId: string) {
  try {
    const response = await axios.get<{ data: CategoryVettingRequirement[] }>(
      `/admin/services/categories/${categoryId}/requirements`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createCategoryRequirement(
  categoryId: string,
  data: {
    type: "document" | "attestation" | "certification";
    name: string;
    description?: string;
    isRequired?: boolean;
    acceptedMimeTypes?: string[];
    maxFileSizeMb?: number;
    sortOrder?: number;
  },
) {
  try {
    const response = await axios.post<{ data: CategoryVettingRequirement }>(
      `/admin/services/categories/${categoryId}/requirements`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateCategoryRequirement(
  requirementId: string,
  data: Record<string, unknown>,
) {
  try {
    const response = await axios.put<{ data: CategoryVettingRequirement }>(
      `/admin/requirements/${requirementId}`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deleteCategoryRequirement(requirementId: string) {
  try {
    const response = await axios.delete<{ data: { id: string; deletedAt: string } }>(
      `/admin/requirements/${requirementId}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getCategoryQuestions(categoryId: string) {
  try {
    const response = await axios.get<{ data: CategoryQuestion[] }>(
      `/admin/services/categories/${categoryId}/questions`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createCategoryQuestion(
  categoryId: string,
  data: {
    question: string;
    type: "yes_no" | "text" | "single_choice" | "multiple_choice";
    options?: string[];
    isRequired?: boolean;
    sortOrder?: number;
  },
) {
  try {
    const response = await axios.post<{ data: CategoryQuestion }>(
      `/admin/services/categories/${categoryId}/questions`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateCategoryQuestion(
  questionId: string,
  data: Record<string, unknown>,
) {
  try {
    const response = await axios.put<{ data: CategoryQuestion }>(
      `/admin/questions/${questionId}`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deleteCategoryQuestion(questionId: string) {
  try {
    const response = await axios.delete<{ data: { id: string; deletedAt: string } }>(
      `/admin/questions/${questionId}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProviderRequirements(providerId: string) {
  try {
    const response = await axios.get<{ data: ProviderRequirementChecklist }>(
      `/admin/providers/${providerId}/requirements`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getServiceRequirements(serviceId: string) {
  try {
    const response = await axios.get<{ data: ServiceVettingRequirement[] }>(
      `/admin/services/${serviceId}/service-requirements`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createServiceRequirement(
  serviceId: string,
  data: {
    type: "document" | "attestation" | "certification";
    name: string;
    description?: string;
    isRequired?: boolean;
    acceptedMimeTypes?: string[];
    maxFileSizeMb?: number;
    sortOrder?: number;
  },
) {
  try {
    const response = await axios.post<{ data: ServiceVettingRequirement }>(
      `/admin/services/${serviceId}/service-requirements`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateServiceRequirement(
  requirementId: string,
  data: Record<string, unknown>,
) {
  try {
    const response = await axios.put<{ data: ServiceVettingRequirement }>(
      `/admin/service-requirements/${requirementId}`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deleteServiceRequirement(requirementId: string) {
  try {
    const response = await axios.delete<{ data: { id: string; deletedAt: string } }>(
      `/admin/service-requirements/${requirementId}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getServiceQuestions(serviceId: string) {
  try {
    const response = await axios.get<{ data: ServiceQuestion[] }>(
      `/admin/services/${serviceId}/service-questions`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createServiceQuestion(
  serviceId: string,
  data: {
    question: string;
    type: "yes_no" | "text" | "single_choice" | "multiple_choice";
    options?: string[];
    isRequired?: boolean;
    sortOrder?: number;
  },
) {
  try {
    const response = await axios.post<{ data: ServiceQuestion }>(
      `/admin/services/${serviceId}/service-questions`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateServiceQuestion(
  questionId: string,
  data: Record<string, unknown>,
) {
  try {
    const response = await axios.put<{ data: ServiceQuestion }>(
      `/admin/service-questions/${questionId}`,
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deleteServiceQuestion(questionId: string) {
  try {
    const response = await axios.delete<{ data: { id: string; deletedAt: string } }>(
      `/admin/service-questions/${questionId}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProviderIdentity(providerId: string) {
  try {
    const response = await axios.get<{ data: ProviderIdentity }>(
      `/admin/providers/${providerId}/identity`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function reviewIdentity(
  providerId: string,
  approved: boolean,
  rejectionNote?: string,
) {
  try {
    const response = await axios.put<{ data: ProviderProfile }>(
      `/admin/providers/${providerId}/identity/verify`,
      { approved, rejectionNote },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProviderServiceList(providerId: string) {
  try {
    const response = await axios.get<{ data: ProviderService[] }>(
      `/admin/providers/${providerId}/services`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProviderServiceChecklist(providerId: string, providerServiceId: string) {
  try {
    const response = await axios.get<{ data: ProviderServiceChecklist }>(
      `/admin/providers/${providerId}/services/${providerServiceId}/checklist`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function reviewProviderService(
  providerId: string,
  providerServiceId: string,
  approved: boolean,
  rejectionNote?: string,
) {
  try {
    const response = await axios.put<{ data: ProviderService }>(
      `/admin/providers/${providerId}/services/${providerServiceId}/verify`,
      { approved, rejectionNote },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}
