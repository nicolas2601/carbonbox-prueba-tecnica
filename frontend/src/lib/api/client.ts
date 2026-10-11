import axios, { type AxiosInstance } from "axios";
import { normalizeApiError } from "./ApiError";

export function createApiClient(baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"): AxiosInstance {
  const client = axios.create({ baseURL, adapter: ["xhr", "fetch"] });
  client.interceptors.response.use(response => response, (cause: unknown) => Promise.reject(normalizeApiError(cause)));
  return client;
}

export const api = createApiClient();
