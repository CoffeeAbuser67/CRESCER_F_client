// client/src/store/userStore.ts
import { create } from "zustand";
import { api } from "@/lib/api";
import type { User } from '@/utils/types';


interface UserStore {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  logout: () => set({ user: null, isLoading: false }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // O interceptor em lib/api.ts cuidará do refresh automaticamente se o /me der 401
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },
}));
