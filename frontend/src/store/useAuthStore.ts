import { create } from 'zustand';

interface User {
  accountId: string;
  username: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  profileId?: string;
  fullName?: string;
  email?: string;
  loyaltyPoints?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  updateLoyaltyPoints: (points: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' && localStorage.getItem('brewlite_user')
    ? JSON.parse(localStorage.getItem('brewlite_user')!)
    : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null,

  setAuth: (user, token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brewlite_user', JSON.stringify(user));
      localStorage.setItem('brewlite_token', token);
      if (refreshToken) localStorage.setItem('brewlite_refresh_token', refreshToken);
    }
    set({ user, token });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brewlite_user');
      localStorage.removeItem('brewlite_token');
      localStorage.removeItem('brewlite_refresh_token');
    }
    set({ user: null, token: null });
  },

  updateLoyaltyPoints: (points) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, loyaltyPoints: (state.user.loyaltyPoints || 0) + points };
      if (typeof window !== 'undefined') {
        localStorage.setItem('brewlite_user', JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },
}));
