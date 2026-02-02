import { create } from "zustand";
import { User } from '../utils/types';
import { axiosForInterceptor } from '../utils/axios';

interface UserStore {
    user: User | null;
    sessionChecked: boolean;
    setActiveUser: (user: User | null) => void;
    checkSession: () => Promise<void>; 
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    sessionChecked: false,

    setActiveUser: (user) => set({ user }),

    checkSession: async () => {
        try {
            // *** AJUSTE AQUI *** // Batendo na rota que retorna o usuário atual baseado no cookie
            const response = await axiosForInterceptor.get('/auth/me');
            if (response.data) {
                set({ user: response.data, sessionChecked: true });
            } else {
                throw new Error("No user data");
            }
        } catch (error) {
            console.log("Nenhuma sessão ativa encontrada (401 esperado se não logado).");
            set({ user: null, sessionChecked: true });
        }
    },
}));