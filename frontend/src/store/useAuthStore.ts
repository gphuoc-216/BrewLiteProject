import { create } from 'zustand';
import { fetchApi } from '@/lib/api';

export interface User {
  id?: string;
  accountId: string;
  username: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  status?: string;
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
  updatePoints: (points: number) => void;
  fetchProfile: () => Promise<void>;
}

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('brewlite_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('brewlite_token');
  } catch {
    return null;
  }
};

import { useCartStore } from './useCartStore';

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),

  setAuth: (user, token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brewlite_user', JSON.stringify(user));
      localStorage.setItem('brewlite_token', token);
      if (refreshToken) localStorage.setItem('brewlite_refresh_token', refreshToken);
    }
    set({ user, token });
    try {
      useCartStore.getState().loadUserCart(user.accountId || user.username);
    } catch {
      // ignore
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brewlite_user');
      localStorage.removeItem('brewlite_token');
      localStorage.removeItem('brewlite_refresh_token');
    }
    try {
      useCartStore.getState().switchUserCart('guest');
    } catch {
      // ignore
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

  updatePoints: (points) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, loyaltyPoints: points };
      if (typeof window !== 'undefined') {
        localStorage.setItem('brewlite_user', JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },

  fetchProfile: async () => {
    try {
      const data = await fetchApi<{ fullName?: string; email?: string; loyaltyPoints?: number }>('/auth/profile');
      if (data) {
        set((state) => {
          if (!state.user) return state;
          const updatedUser: User = {
            ...state.user,
            fullName: data.fullName ?? state.user.fullName,
            email: data.email ?? state.user.email,
            loyaltyPoints: typeof data.loyaltyPoints === 'number' ? data.loyaltyPoints : state.user.loyaltyPoints,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('brewlite_user', JSON.stringify(updatedUser));
          }
          return { user: updatedUser };
        });
      }
    } catch {
      // ignore network errors
    }
  },
}));
