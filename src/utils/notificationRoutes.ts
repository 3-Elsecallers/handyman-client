import type { Notification, NotificationType } from "@/api/communication.api";

export interface NotificationRoute {
  href: string;
  label: string;
}

/** Admin-facing notification types surfaced by the admin dashboard. */
export const ADMIN_NOTIFICATION_TYPES: NotificationType[] = [
  "admin_new_signup",
  "admin_identity_verification_request",
  "admin_service_verification_request",
  "admin_new_booking",
  "admin_booking_cancelled",
];

export const ADMIN_NOTIFICATION_LABELS: Record<string, string> = {
  admin_new_signup: "New Signup",
  admin_identity_verification_request: "Identity Verification",
  admin_service_verification_request: "Service Verification",
  admin_new_booking: "New Booking",
  admin_booking_cancelled: "Booking Cancelled",
};

const stringOf = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;

const bookingHref = (base: string, notification: Notification): string => {
  const bookingId = stringOf(notification.data?.bookingId);
  return bookingId ? `${base}/${bookingId}` : base;
};

/**
 * Resolve an admin notification to the review screen the admin should act on.
 */
export function resolveNotificationRoute(
  notification: Notification,
): NotificationRoute {
  const data = notification.data ?? {};
  const userId = stringOf(data.userId);
  const providerId = stringOf(data.providerId);
  const providerServiceId = stringOf(data.providerServiceId);
  const bookingId = stringOf(data.bookingId);

  switch (notification.type) {
    case "admin_new_signup":
      return {
        href: userId
          ? `/admin/dashboard/users/${userId}`
          : data.role === "provider"
            ? "/admin/dashboard/providers"
            : "/admin/dashboard/customers",
        label: data.role === "provider" ? "View provider signup" : "View customer signup",
      };
    case "admin_identity_verification_request":
      return {
        href: providerId
          ? `/admin/dashboard/providers/${providerId}?tab=identity`
          : "/admin/dashboard/providers?identityStatus=pending_review",
        label: "Review identity",
      };
    case "admin_service_verification_request":
      return {
        href: providerId
          ? `/admin/dashboard/providers/${providerId}?tab=services${
              providerServiceId ? `&service=${providerServiceId}` : ""
            }`
          : "/admin/dashboard/providers?verificationStatus=pending_review",
        label: "Review service",
      };
    case "admin_new_booking":
    case "admin_booking_cancelled":
      return {
        href: bookingId
          ? `/admin/dashboard/bookings/${bookingId}`
          : "/admin/dashboard/bookings",
        label: notification.type === "admin_new_booking" ? "View booking" : "View booking",
      };
    default:
      return {
        href: "/admin/dashboard/notifications",
        label: "View details",
      };
  }
}

/** Notification types surfaced to providers (everything except admin-only types). */
const NON_PROVIDER_TYPES = new Set<NotificationType>([
  "admin_new_signup",
  "admin_identity_verification_request",
  "admin_service_verification_request",
  "admin_new_booking",
  "admin_booking_cancelled",
  "marketing",
]);

export const PROVIDER_NOTIFICATION_LABELS: Record<string, string> = {
  booking_confirmed: "New Booking",
  booking_cancelled: "Booking Cancelled",
  booking_started: "Service Started",
  booking_completed: "Booking Completed",
  new_review: "New Review",
  verification_result: "Verification Result",
  payment_reminder: "Payment Reminder",
  dispute_opened: "Dispute Opened",
};

export const PROVIDER_NOTIFICATION_TYPES: NotificationType[] = (
  Object.keys(PROVIDER_NOTIFICATION_LABELS) as NotificationType[]
).filter((t) => !NON_PROVIDER_TYPES.has(t));

export const CUSTOMER_NOTIFICATION_LABELS: Record<string, string> = {
  booking_confirmed: "Booking Accepted",
  booking_cancelled: "Booking Cancelled",
  booking_started: "Service Started",
  booking_completed: "Service Completed",
  booking_reassigned: "Provider Changed",
  payment_reminder: "Payment Reminder",
  payment_received: "Payment Received",
  dispute_opened: "Dispute Opened",
};

/**
 * Resolve a provider notification to the page the provider should open.
 */
export function resolveProviderNotificationRoute(
  notification: Notification,
): NotificationRoute {
  const data = notification.data ?? {};
  switch (notification.type) {
    case "verification_result":
      return data.kind === "service"
        ? { href: "/provider/dashboard/my-services", label: "View services" }
        : { href: "/provider/dashboard/identity", label: "View identity" };
    case "new_review":
      return { href: "/provider/dashboard/reviews", label: "View reviews" };
    case "booking_confirmed":
    case "booking_cancelled":
    case "booking_started":
    case "booking_completed":
    case "dispute_opened":
    case "payment_reminder":
      return {
        href: bookingHref("/provider/dashboard/bookings", notification),
        label: "View booking",
      };
    default:
      return {
        href: "/provider/dashboard/notifications",
        label: "View details",
      };
  }
}

/**
 * Resolve a customer notification to the page the customer should open.
 */
export function resolveCustomerNotificationRoute(
  notification: Notification,
): NotificationRoute {
  switch (notification.type) {
    case "booking_confirmed":
    case "booking_cancelled":
    case "booking_started":
    case "booking_completed":
    case "booking_reassigned":
    case "payment_reminder":
    case "payment_received":
    case "dispute_opened":
      return {
        href: bookingHref("/customer/dashboard/bookings", notification),
        label: "View booking",
      };
    default:
      return {
        href: "/customer/dashboard/notifications",
        label: "View details",
      };
  }
}