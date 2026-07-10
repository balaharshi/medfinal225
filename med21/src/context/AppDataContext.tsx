import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
      const [catRes, srvRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/services'),
        fetch('/api/products'),
      ]);

      const updates: Partial<AppDataState> = { loading: false };

      if (catRes.ok) {
        const categories = await catRes.json();
        if (Array.isArray(categories) && categories.length > 0) {
          updates.categories = categories;
        }
      }

      if (srvRes.ok) {
        const liveServices = await srvRes.json();
        if (Array.isArray(liveServices) && liveServices.length > 0) {
          updates.services = liveServices;
        }
      }

      if (prodRes.ok) {
        const liveProducts = await prodRes.json();
        if (Array.isArray(liveProducts) && liveProducts.length > 0) {
          updates.products = liveProducts;
        }
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
