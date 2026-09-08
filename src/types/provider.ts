export interface ProviderProfile {
  id: string;
  userId: string;
  paystackAccountCode: string | null;
  bio: string | null;
  avgRating: number;
  totalReviews: number;
  totalJobs: number;
  completionRate: number;
  avgResponseTimeMins: number | null;
  verified: boolean;
  status: "pending_review" | "active" | "suspended" | "deactivated";
  verificationStatus: "not_submitted" | "pending_review" | "approved" | "rejected";
  identityVerified?: boolean;
  identityStatus?: "not_submitted" | "pending_review" | "approved" | "rejected";
  identityRejectionNote?: string | null;
  competencyTier?: string;
  qualityGrade?: string;
  probationaryBookingsRemaining?: number | null;
  rejectionNote: string | null;
  serviceAreaRadiusKm: number;
  lat: number | null;
  lng: number | null;
  services: ProviderServiceEntry[];
  providerDocuments?: ProviderDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ProviderServiceEntry {
  id: string;
  providerId: string;
  serviceId: string;
  customPrice: number | null;
  isActive: boolean;
  status?: "not_submitted" | "pending_review" | "approved" | "rejected";
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
  service: CatalogService;
}

export interface CatalogService {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  durationMins: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: ServiceCategory;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedSlot {
  id: string;
  providerId: string;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdAt: string;
}

export interface ProviderReview {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment: string | null;
  photoUrls: string[];
  status: "visible" | "flagged" | "removed";
  providerResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  stats: {
    avgRating: number;
    totalReviews: number;
    totalJobs: number;
    completionRate: number;
    avgResponseTimeMins: number | null;
    verified: boolean;
    status: string;
  };
  recentReviews: ProviderReview[];
}

export interface PaginatedReviews {
  reviews: ProviderReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DocumentCategory = string;
export type DocumentStatus = "uploaded" | "pending_review" | "approved" | "rejected";

export interface ProviderDocument {
  id: string;
  providerId: string;
  requirementId: string | null;
  category: DocumentCategory;
  s3Key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlItem {
  id: string;
  uploadUrl: string;
  s3Key: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export type VettingRequirementType = "document" | "attestation" | "certification";
export type VettingSubmissionStatus = "not_submitted" | "pending_review" | "approved" | "submitted" | "rejected" | null;

export interface VettingRequirement {
  id: string;
  categoryId: string;
  categoryName: string;
  type: VettingRequirementType;
  name: string;
  description: string | null;
  isRequired: boolean;
  acceptedMimeTypes: string[];
  maxFileSizeMb: number;
  sortOrder: number;
  submissionStatus: VettingSubmissionStatus;
  documentId: string | null;
  mimeType: string | null;
  fileName: string | null;
  rejectionReason: string | null;
  answer: string | null;
  attestationId: string | null;
}

export type VettingQuestionType = "yes_no" | "text" | "single_choice" | "multiple_choice";

export interface VettingQuestion {
  id: string;
  categoryId: string;
  categoryName: string;
  question: string;
  type: VettingQuestionType;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
  answer: string | null;
  answerId: string | null;
}

export interface VettingRequirementsResponse {
  requirements: VettingRequirement[];
  providerVerificationStatus: string | null;
  identityStatus?: string | null;
}

export interface VettingQuestionsResponse {
  questions: VettingQuestion[];
}

export interface AttestationPayload {
  requirementId: string;
  answer: string;
}

export interface QuestionAnswerPayload {
  questionId: string;
  answer: string;
}

export interface ProviderIdentity {
  identityStatus: "not_submitted" | "pending_review" | "approved" | "rejected";
  identityVerified: boolean;
  identityRejectionNote: string | null;
  documents: ProviderDocument[];
}
