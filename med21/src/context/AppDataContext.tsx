import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { HealthcareService, Product, ServiceCategory } from '../types';

export interface AppDataState {
  categories: ServiceCategory[];
  products: Product[];
  services: HealthcareService[];
  loading: boolean;
  error: string | null;
}

const initialState: AppDataState = {
  categories: [],
  products: [],
  services: [],
  loading: true,
  error: null,
};

const AppDataContext = createContext<AppDataState>(initialState);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppDataState>(initialState);

  const fetchData = useCallback(async () => {
    try {
      const [categories, services, products] = await Promise.all([
        api.get<unknown>('/api/categories'),
        api.get<unknown>('/api/services'),
        api.get<unknown>('/api/products'),
      ]);

      const updates: Partial<AppDataState> = { loading: false };

      if (Array.isArray(categories) && categories.length > 0) {
        updates.categories = categories as ServiceCategory[];
      }

      if (Array.isArray(services) && services.length > 0) {
        updates.services = services as HealthcareService[];
      }

      if (Array.isArray(products) && products.length > 0) {
        updates.products = products as Product[];
      }

      setState(prev => ({ ...prev, ...updates }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppDataContext.Provider value={state}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataState {
  return useContext(AppDataContext);
}
