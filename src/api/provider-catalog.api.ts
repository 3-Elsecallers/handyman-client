import axios from "@/utils/axios";
import { isAxiosError } from "axios";

import type { ProviderProfile } from "@/types/admin";

export async function getProviderProfile(id: string) {
  try {
    const response = await axios.get<{ data: ProviderProfile }>(
      `/providers/${id}`,
    );
    return response;
  } catch (error: unknown) {
    return isAxiosError(error) ? error.response : undefined;
  }
}
