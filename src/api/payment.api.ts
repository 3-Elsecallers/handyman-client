import axios from "@/utils/axios";
import { isAxiosError } from "axios";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "refunded"
  | "partially_refunded"
  | "failed";

export type PaymentType = "booking" | "tip";
export type PaymentMethod = "online" | "cash";
export type PayoutRequestStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed"
  | "reversed";
export type PayoutMedium = "mobile_money" | "bank";

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string | null;
  providerUserId: string | null;
  type: PaymentType;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  platformFee: number;
  providerEarning: number;
  tipAmount: number;
  paystackRef: string | null;
  paystackAccessCode: string | null;
  authorizationUrl: string | null;
  refundedAmount: number;
  refundReason: string | null;
  createdAt: string;
  updatedAt: string;
  refunds?: Array<{
    id: string;
    amount: number;
    reason: string | null;
    status: string;
    createdAt: string;
  }>;
}

export interface PayoutMethod {
  id: string;
  providerId: string;
  medium: PayoutMedium;
  network: string | null;
  accountName: string | null;
  bankCode: string | null;
  bankName: string | null;
  recipientCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRequest {
  id: string;
  providerId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutRequestStatus;
  medium: PayoutMedium;
  paystackRef: string | null;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
}

export interface ProviderWallet {
  providerUserId: string;
  providerId: string | null;
  available: number;
  owed: number;
  pendingHold: number;
  paidOut: number;
  pendingWithdrawals: PayoutRequest[];
  currency: string;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  counterpartyId: string | null;
  type: string;
  credit: number;
  debit: number;
  currency: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

export interface LedgerAccount {
  id: string;
  type: string;
  ownerId: string | null;
  currency: string;
  balance?: number;
}

export async function initializePayment(bookingId: string, paymentMethod?: PaymentMethod) {
  try {
    const response = await axios.post<{ data: Payment }>("/payments/initialize", {
      bookingId,
      ...(paymentMethod ? { paymentMethod } : {}),
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getPayment(id: string) {
  try {
    const response = await axios.get<{ data: Payment }>(`/payments/${id}`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getPaymentByBooking(bookingId: string) {
  try {
    const response = await axios.get<{ data: Payment }>(
      `/payments/by-booking/${bookingId}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function verifyPayment(id: string) {
  try {
    const response = await axios.post<{ data: Payment }>(`/payments/${id}/verify`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function addTip(id: string, amount: number) {
  try {
    const response = await axios.post<{ data: Payment }>(`/payments/${id}/tip`, {
      amount,
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function requestRefund(id: string, amount?: number) {
  try {
    const response = await axios.post<{ data: Payment }>(`/payments/${id}/refund`, {
      ...(amount != null ? { amount } : {}),
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listCustomerPayments() {
  try {
    const response = await axios.get<{
      data: { payments: Payment[]; total: number };
    }>("/payments/customer/payments");
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listAdminPayments(params?: {
  bookingId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const response = await axios.get<{
      data: { payments: Payment[]; total: number; totalPages: number };
    }>("/payments/admin/payments", {
      params: {
        ...(params?.bookingId && { bookingId: params.bookingId }),
        ...(params?.customerId && { customerId: params.customerId }),
        ...(params?.page && { page: params.page }),
        ...(params?.limit && { limit: params.limit }),
      },
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

// ----- Provider wallet -----

export async function confirmPayment(id: string) {
  try {
    const response = await axios.post<{ data: Payment }>(`/payments/${id}/confirm`);
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProviderWallet() {
  try {
    const response = await axios.get<{ data: ProviderWallet }>("/payments/provider/wallet");
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getPayoutMethod() {
  try {
    const response = await axios.get<{ data: PayoutMethod }>(
      "/payments/provider/payout-method",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function savePayoutMethod(input: {
  medium: PayoutMedium;
  network?: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  bankName?: string;
}) {
  try {
    const response = await axios.post<{ data: PayoutMethod }>(
      "/payments/provider/payout-method",
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updatePayoutMethod(input: Partial<{
  medium: PayoutMedium;
  network?: string;
  accountName: string;
  accountNumber: string;
  bankCode?: string;
  bankName?: string;
  isActive?: boolean;
}>) {
  try {
    const response = await axios.put<{ data: PayoutMethod }>(
      "/payments/provider/payout-method",
      input,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function deletePayoutMethod() {
  try {
    const response = await axios.delete<{ data: { message: string } }>(
      "/payments/provider/payout-method",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function withdrawProvider(amount: number) {
  try {
    const response = await axios.post<{ data: { id: string; amount: number; fee: number; netAmount: number; status: string } }>(
      "/payments/provider/withdraw",
      { amount },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listProviderWithdrawals(params?: { page?: number; limit?: number }) {
  try {
    const response = await axios.get<{
      data: { items: PayoutRequest[]; total: number; totalPages: number };
    }>("/payments/provider/withdrawals", {
      params: { ...(params?.page && { page: params.page }), ...(params?.limit && { limit: params.limit }) },
    });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

// ----- Admin -----

export async function getCompanyWallet() {
  try {
    const response = await axios.get<{ data: { balance: number; currency: string } }>(
      "/payments/admin/company/wallet",
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listAdminLedger(params?: {
  accountId?: string;
  refType?: string;
  providerId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const response = await axios.get<{ data: { items: LedgerEntry[]; total: number; totalPages: number } }>(
      "/payments/admin/ledger",
      { params: { ...params } },
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listAdminAccounts() {
  try {
    const response = await axios.get<{ data: LedgerAccount[] }>("/payments/admin/accounts");
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function listAdminWithdrawals(params?: { status?: string; page?: number; limit?: number }) {
  try {
    const response = await axios.get<{
      data: { items: PayoutRequest[]; total: number; totalPages: number };
    }>("/payments/admin/withdrawals", { params: { ...params } });
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}
