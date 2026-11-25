import { httpApi } from "./httpApi";
import { mockApi } from "./mockApi";
/**
 * Composition root: ÚNICO ponto que escolhe a implementação concreta.
 *   EXPO_PUBLIC_USE_MOCK=false -> backend real (via API Gateway)
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== "false";
export const api = USE_MOCK ? mockApi : httpApi;
export { BASE_URL, setToken, setUnauthorizedHandler } from "./http";
export { ApiError } from "./apiClient";
