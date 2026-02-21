'use client';

import { create } from 'zustand';
import type { ApplicationData, Product, Flow, Settings } from '@/types';

interface AdminState {
  applications: ApplicationData[];
  products: Product[];
  flows: Flow[];
  settings: Settings | null;
  selectedApplicationId: string | null;
  isLoading: boolean;
  error: string | null;

  setApplications: (apps: ApplicationData[]) => void;
  setProducts: (products: Product[]) => void;
  setFlows: (flows: Flow[]) => void;
  setSettings: (settings: Settings) => void;
  setSelectedApplication: (id: string | null) => void;
  setLoading: (v: boolean) => void;
  setError: (err: string | null) => void;
  updateApplication: (id: string, data: Partial<ApplicationData>) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  removeProduct: (id: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  applications: [],
  products: [],
  flows: [],
  settings: null,
  selectedApplicationId: null,
  isLoading: false,
  error: null,

  setApplications: (apps) => set({ applications: apps }),
  setProducts: (products) => set({ products }),
  setFlows: (flows) => set({ flows }),
  setSettings: (settings) => set({ settings }),
  setSelectedApplication: (id) => set({ selectedApplicationId: id }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (err) => set({ error: err }),
  updateApplication: (id, data) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, ...data } : app
      ),
    })),
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, data) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
}));
