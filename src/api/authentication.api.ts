import axios from "@/utils/axios";
import { isAxiosError } from "axios";

export interface ISignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "customer" | "provider";
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function signUp(data: ISignUpData) {
  try {
    const response = await axios.post("/auth/register", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
    });

    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function signIn(credentials: { email: string; password: string }) {
  try {
    const response = await axios.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });

    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function updateToken(data: { refreshToken: string }) {
  try {
    const response = await axios.post("/auth/refresh", {
      refreshToken: data.refreshToken,
    });

    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function verifyEmail(data: { token: string }) {
  try {
    const response = await axios.post("/auth/verify-email", {
      token: data.token,
    });

    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function resendVerificationEmail() {
  try {
    const response = await axios.post("/auth/resend-verification");

    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function signOut(data: { refreshToken: string | null }) {
  try {
    const response = await axios.post("/auth/logout", {
      refreshToken: data.refreshToken,
    });

    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}

export async function getProfile() {
  try {
    const response = await axios.get("/customers/me");

    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}
