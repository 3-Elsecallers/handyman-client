import axios from "@/utils/axios";
import { isAxiosError } from "axios";

import type {
  ProviderProfile,
  ProviderDocument,
  ProviderIdentity,
  UploadUrlItem,
  AvailabilitySlot,
  BlockedSlot,
  DashboardStats,
  PaginatedReviews,
  CatalogService,
  ServiceCategory,
  VettingRequirementsResponse,
  VettingQuestionsResponse,
  AttestationPayload,
  QuestionAnswerPayload,
} from "@/types/provider";

export async function getMyProfile() {
  try {
    const response = await axios.get<{ data: ProviderProfile }>(
      "/providers/me/",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateMyProfile(data: {
  bio?: string;
  lat?: number;
  lng?: number;
  serviceAreaRadiusKm?: number;
}) {
  try {
    const response = await axios.put<{ data: ProviderProfile }>(
      "/providers/me/",
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function uploadDocuments(documentUrls: string[]) {
  try {
    const response = await axios.post<{
      data: { message: string; urls: string[] };
    }>("/providers/me/documents", { documentUrls });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function addService(data: {
  serviceId: string;
  customPrice?: number;
}) {
  try {
    const response = await axios.post<{
      data: ProviderProfile["services"][number];
    }>("/providers/me/services", data);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateService(
  serviceId: string,
  data: { customPrice?: number; isActive?: boolean },
) {
  try {
    const response = await axios.put<{
      data: ProviderProfile["services"][number];
    }>(`/providers/me/services/${serviceId}`, data);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function removeService(serviceId: string) {
  try {
    const response = await axios.delete<{ data: { message: string } }>(
      `/providers/me/services/${serviceId}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getDashboard() {
  try {
    const response = await axios.get<{ data: DashboardStats }>(
      "/providers/me/dashboard",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getAvailability() {
  try {
    const response = await axios.get<{ data: AvailabilitySlot[] }>(
      "/providers/me/availability",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateAvailability(slots: {
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
}) {
  try {
    const response = await axios.put<{ data: AvailabilitySlot[] }>(
      "/providers/me/availability",
      slots,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function addBlockedSlot(data: {
  startAt: string;
  endAt: string;
  reason?: string;
}) {
  try {
    const response = await axios.post<{ data: BlockedSlot }>(
      "/providers/me/blocked-slots",
      data,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function removeBlockedSlot(slotId: string) {
  try {
    const response = await axios.delete<{ data: { message: string } }>(
      `/providers/me/blocked-slots/${slotId}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function respondToReview(reviewId: string, response: string) {
  try {
    const res = await axios.post<{ data: unknown }>(
      `/reviews/${reviewId}/respond`,
      { response },
    );
    return res;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getReviewsForProvider(
  providerId: string,
  page = 1,
  limit = 20,
) {
  try {
    const response = await axios.get<{ data: PaginatedReviews }>(
      `/providers/${providerId}/reviews`,
      { params: { page, limit } },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getCatalogCategories() {
  try {
    const response = await axios.get<{ data: ServiceCategory[] }>(
      "/services/categories",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getCatalogServices(categoryId?: string) {
  try {
    const response = await axios.get<{ data: CatalogService[] }>("/services", {
      params: categoryId ? { categoryId } : {},
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function requestDocumentUploadUrls(files: {
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  requirementId?: string;
}[]) {
  try {
    const response = await axios.post<{ data: UploadUrlItem[] }>(
      "/providers/me/documents/request-urls",
      { files },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function confirmDocumentUploads(documentIds: string[]) {
  try {
    const response = await axios.post<{ data: { message: string } }>(
      "/providers/me/documents/confirm",
      { documents: documentIds.map((id) => ({ id })) },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getMyDocuments() {
  try {
    const response = await axios.get<{ data: ProviderDocument[] }>(
      "/providers/me/documents",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const response = await axios.get<{ data: { url: string; document: ProviderDocument } }>(
      `/providers/me/documents/${documentId}/download-url`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function requestTestUploadUrl() {
  try {
    const response = await axios.post<{
      data: { uploadUrl: string; s3Key: string };
    }>("/providers/me/test/upload-file");
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getTestImage() {
  try {
    const response = await axios.get<Blob>("/providers/me/test/image", {
      responseType: "blob",
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getMyRequirements(serviceId?: string) {
  try {
    const response = await axios.get<{ data: VettingRequirementsResponse }>(
      "/providers/me/requirements",
      { params: serviceId ? { serviceId } : {} },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getMyQuestions(serviceId?: string) {
  try {
    const response = await axios.get<{ data: VettingQuestionsResponse }>(
      "/providers/me/questions",
      { params: serviceId ? { serviceId } : {} },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function submitAttestations(data: {
  attestations: AttestationPayload[];
  questions: QuestionAnswerPayload[];
}, serviceId?: string) {
  try {
    const response = await axios.post<{ data: { message: string } }>(
      "/providers/me/attestations",
      data,
      { params: serviceId ? { serviceId } : {} },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getMyIdentity() {
  try {
    const response = await axios.get<{ data: ProviderIdentity }>(
      "/providers/me/identity",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function submitServiceForReview(providerServiceId: string) {
  try {
    const response = await axios.post<{ data: ProviderProfile["services"][number] }>(
      `/providers/me/services/${providerServiceId}/submit`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getMyScorecard() {
  try {
    const response = await axios.get<{ data: ScorecardData }>("/providers/me/scorecard");
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export interface ProviderQualityFlagData {
  id: string;
  providerId: string;
  code: string;
  message: string;
  severity: string;
  active: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ScorecardData {
  scorecard: {
    tier: string;
    grade: string;
    probation: {
      active: boolean;
      bookingsRemaining: number;
      endDate: string | null;
    };
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
  flags: ProviderQualityFlagData[];
}
