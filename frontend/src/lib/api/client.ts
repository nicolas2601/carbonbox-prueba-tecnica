import axios from "axios";
import { normalizeApiError } from "./ApiError";

export function createApiClient(baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1") {
  const client = axios.create({ baseURL });
  client.interceptors.response.use(response => response, (cause: unknown) => Promise.reject(normalizeApiError(cause)));
  return client;
}

export const api = createApiClient();
