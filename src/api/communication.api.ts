import axios from "@/utils/axios";
import { isAxiosError } from "axios";

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder_24h"
  | "booking_reminder_1h"
  | "provider_en_route"
  | "booking_started"
  | "booking_completed"
  | "booking_reassigned"
  | "new_review"
  | "payment_received"
  | "payment_refunded"
  | "payment_reminder"
  | "dispute_opened"
  | "verification_result"
  | "marketing"
  | "admin_new_signup"
  | "admin_identity_verification_request"
  | "admin_service_verification_request"
  | "admin_new_booking"
  | "admin_booking_cancelled";

export type NotificationChannel = "push" | "email" | "sms";
export type NotificationStatus = "pending" | "delivered" | "failed";

export interface Conversation {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "system";
  imageUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  deliveryAttempts: number;
  lastDeliveryAt?: string | null;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  sentAt: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

// ----- Conversations -----

export async function listConversations() {
  try {
    const response = await axios.get<{ data: Conversation[] }>("/conversations");
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function createConversation(input: {
  bookingId: string;
  customerId: string;
  providerId: string;
}) {
  try {
    const response = await axios.post<{ data: Conversation }>("/conversations", input);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getConversation(id: string) {
  try {
    const response = await axios.get<{ data: Conversation }>(`/conversations/${id}`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

// ----- Messages -----

export async function getMessages(conversationId: string, params?: { limit?: number; cursor?: string }) {
  try {
    const response = await axios.get<{
      data: { messages: Message[]; nextCursor: string | null };
    }>(`/conversations/${conversationId}/messages`, { params });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function sendMessage(
  conversationId: string,
  input: { content: string; type?: string; imageUrl?: string },
) {
  try {
    const response = await axios.post<{ data: Message }>(
      `/conversations/${conversationId}/messages`,
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function presignMessageImage(
  conversationId: string,
  input: { filename: string; contentType: string; size: number },
) {
  try {
    const response = await axios.post<{ data: { uploadUrl: string; key: string } }>(
      `/conversations/${conversationId}/messages/presign`,
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function markConversationRead(conversationId: string) {
  try {
    const response = await axios.post<{ data: { marked: boolean } }>(
      `/conversations/${conversationId}/messages/read`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getUnreadMessageCount(conversationId: string) {
  try {
    const response = await axios.get<{ data: { count: number } }>(
      `/conversations/${conversationId}/messages/unread`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

// ----- Notifications -----

export async function listNotifications(params?: {
  limit?: number;
  cursor?: string;
  types?: NotificationType[];
}) {
  try {
    const response = await axios.get<{
      data: { notifications: Notification[]; nextCursor: string | null };
    }>("/notifications", {
      params: {
        limit: params?.limit,
        cursor: params?.cursor,
        ...(params?.types?.length && { types: params.types.join(",") }),
      },
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getUnreadNotificationCount() {
  try {
    const response = await axios.get<{ data: { count: number } }>(
      "/notifications/unread-count",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function markNotificationRead(id: string) {
  try {
    const response = await axios.put<{ data: { marked: boolean } }>(
      `/notifications/${id}/read`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function markAllNotificationsRead() {
  try {
    const response = await axios.put<{ data: { marked: boolean } }>(
      "/notifications/read-all",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function markNotificationsReadByContext(context: {
  providerId?: string;
  providerServiceId?: string;
}) {
  try {
    const response = await axios.put<{ data: { marked: number } }>(
      "/notifications/read-by-context",
      { ...context },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

// ----- Device tokens -----

export async function registerDeviceToken(input: {
  token: string;
  platform: "ios" | "android" | "web";
}) {
  try {
    const response = await axios.post<{ data: { registered: boolean } }>(
      "/notifications/device-token",
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function removeDeviceToken(token: string) {
  try {
    const response = await axios.delete<{ data: { removed: boolean } }>(
      "/notifications/device-token",
      { data: { token } },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}