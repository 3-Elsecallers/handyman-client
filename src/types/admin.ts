export type ProviderStatus = "pending_review" | "active" | "suspended" | "deactivated";
export type ReviewStatus = "visible" | "flagged" | "removed";
export type VerificationStatus = "not_submitted" | "pending_review" | "approved" | "rejected";
export type DocumentStatus = "uploaded" | "pending_review" | "approved" | "rejected";
export type UserStatus = "active" | "suspended";
export type RequirementType = "document" | "attestation" | "certification";
export type QuestionType = "yes_no" | "text" | "single_choice" | "multiple_choice";

export interface CustomerUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: "customer" | "provider" | "admin";
  status: UserStatus;
  createdAt: string;
}

export interface UserDetail extends CustomerUser {
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  safetyRiskLevel: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  _count?: { services: number };
}

export interface Service {
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

export interface ProviderProfile {
  id: string;
  userId: string;
  bio: string | null;
  avgRating: number;
  totalReviews: number;
  totalJobs: number;
  completionRate: number;
  verified: boolean;
  status: ProviderStatus;
  verificationStatus: VerificationStatus;
  identityVerified?: boolean;
  identityStatus?: VerificationStatus;
  identityRejectionNote?: string | null;
  rejectionNote: string | null;
  competencyTier?: string;
  qualityGrade?: string;
  probationaryBookingsRemaining?: number | null;
  serviceAreaRadiusKm: number;
  lat: number | null;
  lng: number | null;
  services?: ProviderService[];
  providerDocuments?: ProviderDocument[];
  user?: {
    id: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderService {
  id: string;
  providerId: string;
  serviceId: string;
  customPrice: number | null;
  isActive: boolean;
  status?: VerificationStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
  service?: Service;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment: string | null;
  photoUrls: string[];
  status: ReviewStatus;
  providerResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedUsers {
  users: CustomerUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProviders {
  providers: ProviderProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProviderDocument {
  id: string;
  providerId: string;
  requirementId: string | null;
  category: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderDetail extends ProviderProfile {
  user: {
    id: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
  } | null;
  services: ProviderService[];
  providerDocuments: ProviderDocument[];
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  status: string;
  scheduledAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  totalPrice: number | null;
  createdAt: string;
  service?: Service;
  provider?: ProviderProfile;
}

export interface CustomerDetail extends UserDetail {
  bookings?: Booking[];
}

export interface CategoryVettingRequirement {
  id: string;
  categoryId: string;
  type: RequirementType;
  name: string;
  description: string | null;
  isRequired: boolean;
  acceptedMimeTypes: string[];
  maxFileSizeMb: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryQuestion {
  id: string;
  categoryId: string;
  question: string;
  type: QuestionType;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderRequirementChecklist {
  universalDocs: Array<{
    category: string;
    status: string;
    documentId: string;
    fileName: string;
    mimeType?: string;
    rejectionReason: string | null;
  }>;
  requirements: Record<string, Array<{
    id: string;
    type: RequirementType;
    name: string;
    description: string | null;
    isRequired: boolean;
    status: string;
    documentId?: string;
    fileName?: string;
    mimeType?: string;
    rejectionReason?: string | null;
    answer?: string | null;
    attestationId?: string;
  }>>;
  questions: Record<string, Array<{
    id: string;
    question: string;
    type: QuestionType;
    options: string[];
    isRequired: boolean;
    answer: string | null;
  }>>;
  complete: boolean;
  missing: string[];
}

export interface ProviderIdentity {
  identityStatus: VerificationStatus;
  identityVerified: boolean;
  identityRejectionNote: string | null;
  documents: ProviderDocument[];
}

export interface ProviderServiceChecklist {
  serviceId: string;
  providerServiceId: string;
  serviceName: string;
  categoryName: string;
  status: VerificationStatus;
  rejectionNote: string | null;
  identityApproved: boolean;
  requirements: Array<{
    id: string;
    type: RequirementType;
    name: string;
    description: string | null;
    isRequired: boolean;
    status: string;
    documentId?: string;
    fileName?: string;
    mimeType?: string;
    rejectionReason?: string | null;
    answer?: string | null;
    attestationId?: string;
  }>;
  questions: Array<{
    id: string;
    question: string;
    type: QuestionType;
    options: string[];
    isRequired: boolean;
    answer: string | null;
  }>;
}
