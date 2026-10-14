import { httpClient } from '../shared/http/httpClient';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
export const apiFetch = httpClient;
export default httpClient;
