import type { Service, ServiceCategory } from "@/types/admin";

export type AddressType = "home" | "office" | "other";

export interface Address {
  id: string;
  userId: string;
  label: string;
  addressType: AddressType;
  region: string;
  district: string;
  town: string;
  streetAndHouseNumber?: string | null;
  landmark?: string | null;
  digitalAddress?: string | null;
  directions?: string | null;
  contactName: string;
  contactPhone: string;
  country: string;
  lat?: number | null;
  lng?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GhanaRegion {
  name: string;
  capital: string;
  districts: string[];
}

export type BookingType = "instant" | "request";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";
export type BookingPaymentStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "cash_outstanding"
  | "cash_collected"
  | "paid"
  | "confirmed"
  | "failed"
  | "refunded";
export type BookingPaymentMethod = "online" | "cash";
export type Complexity = "standard" | "moderate" | "complex";

export interface BookingInvite {
  id: string;
  providerId: string;
  providerUserId: string;
  status: string;
  invitedAt: string;
  respondedAt: string | null;
  expiresAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string | null;
  providerUserId: string | null;
  serviceId: string;
  type: BookingType;
  status: BookingStatus;
  paymentStatus?: BookingPaymentStatus;
  paymentMethod?: BookingPaymentMethod;
  paymentOverdue?: boolean;
  paymentConfirmedAt?: string | null;
  paymentDueAt?: string | null;
  paymentAmountExpected?: number;
  scheduledAt: string | null;
  scheduledWindowEnd: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  refundAmount: number | null;
  locationLine1: string;
  locationLine2?: string | null;
  locationCity: string;
  locationState: string;
  locationPostal: string;
  locationLat: number | null;
  locationLng: number | null;
  priceQuote: number;
  basePrice: number;
  complexity: Complexity;
  complexityMultiplier: number;
  travelFee: number;
  surgeAmount: number;
  promoCodeId: string | null;
  promoDiscount: number;
  notes?: string | null;
  description?: string | null;
  durationMins: number;
  reassignCount: number;
  createdAt: string;
  updatedAt: string;
  promoCode?: { code: string } | null;
  invites?: BookingInvite[];
  service?: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    imageUrl?: string | null;
  } | null;
  provider?: {
    id: string;
    name?: string;
    avatarUrl?: string | null;
    bio?: string | null;
    avgRating?: number;
    totalJobs?: number;
    avgResponseTimeMins?: number | null;
    verified?: boolean;
  } | null;
}

export interface PriceBreakdown {
  basePrice: number;
  complexityMultiplier: number;
  complexityAdjusted: number;
  travelFee: number;
  surgeAmount: number;
  promoDiscount: number;
  finalPrice: number;
}

export interface BookingListItem {
  id: string;
  type: BookingType;
  status: BookingStatus;
  scheduledAt: string | null;
  priceQuote: number;
  complexity: Complexity;
  reassignCount: number;
  createdAt: string;
  serviceId: string;
  service?: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    imageUrl?: string | null;
  } | null;
}

export interface CustomerServiceCategory extends ServiceCategory {
  serviceCount?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discountPct?: number | null;
  discountAmt?: number | null;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { usages: number };
}
export interface PaginatedBookings {
  items: Booking[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
export interface PaginatedPromos {
  items: PromoCode[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
export interface BookingTimelineEntry {
  id: string;
  status: string;
  actorId?: string;
  actorRole?: string;
  note?: string | null;
  createdAt: string;
}

export type { Service, ServiceCategory };
