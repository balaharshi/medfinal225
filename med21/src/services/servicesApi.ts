import { api } from '../lib/api';

export interface BackendService {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  price: number;
  status: string;
  active: boolean;
}

let cachedServices: BackendService[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000;

export async function fetchServices(): Promise<BackendService[]> {
  if (cachedServices && (Date.now() - cacheTimestamp) < CACHE_TTL) return cachedServices;
  const data = await api.get<BackendService[]>('/api/services');
  cachedServices = Array.isArray(data) ? data : [];
  cacheTimestamp = Date.now();
  return cachedServices;
}

export function clearServicesCache(): void {
  cachedServices = null;
  cacheTimestamp = 0;
}

export function findServiceByTitle(title: string, services: BackendService[]): BackendService | undefined {
  return services.find(s => s.title.toLowerCase() === title.toLowerCase());
}

export function findServiceById(id: string, services: BackendService[]): BackendService | undefined {
  return services.find(s => s.id === id);
}
