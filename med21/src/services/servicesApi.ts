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

export async function fetchServices(): Promise<BackendService[]> {
  if (cachedServices) return cachedServices;
  const data = await api.get<BackendService[]>('/api/services');
  cachedServices = Array.isArray(data) ? data : [];
  return cachedServices;
}

export function findServiceByTitle(title: string, services: BackendService[]): BackendService | undefined {
  return services.find(s => s.title.toLowerCase() === title.toLowerCase());
}

export function findServiceById(id: string, services: BackendService[]): BackendService | undefined {
  return services.find(s => s.id === id);
}
