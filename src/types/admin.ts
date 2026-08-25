export type ProviderStatus = "pending_review" | "active" | "suspended" | "deactivated";
export type ReviewStatus = "visible" | "flagged" | "removed";
export type VerificationStatus = "not_submitted" | "pending_review" | "approved" | "rejected";
export type DocumentCategory = "selfie" | "ghana_card" | "additional";
export type DocumentStatus = "uploaded" | "pending_review" | "approved" | "rejected";

export interface CustomerUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: "customer" | "provider" | "admin";
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
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
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
  rejectionNote: string | null;
  serviceAreaRadiusKm: number;
  lat: number | null;
  lng: number | null;
  services?: ProviderService[];
  providerDocuments?: ProviderDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ProviderService {
  id: string;
  providerId: string;
  serviceId: string;
  customPrice: number | null;
  isActive: boolean;
  createdAt: string;
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
