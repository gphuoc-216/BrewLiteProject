import { create } from 'zustand';

export interface CartItem {
  id: string; // Unique line key: `${variantId}:${topping || 'default'}`
  variantId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  size: string;
  price: number;
  topping?: string;
  quantity: number;
}

export interface AppliedPromotion {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  promotion: AppliedPromotion | null;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { id?: string }, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  loadUserCart: (accountKey?: string) => void;
  switchUserCart: (accountKey?: string) => void;
  applyPromotion: (promo: AppliedPromotion) => void;
  removePromotion: () => void;
  getSubtotal: () => number;
  getTotalCount: () => number;
  getFinalTotal: () => number;
}

const getStorageKey = (accountKey?: string): string => {
  if (accountKey) return `brewlite_cart_${accountKey}`;
  if (typeof window === 'undefined') return 'brewlite_cart_guest';
  try {
    const rawUser = localStorage.getItem('brewlite_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      const key = u?.accountId || u?.username;
      if (key) return `brewlite_cart_${key}`;
    }
  } catch {
    // ignore
  }
  return 'brewlite_cart_guest';
};

const readStorageCart = (key: string): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it: Partial<CartItem>) => ({
      ...it,
      id: it.id || `${it.variantId}:${it.topping || 'default'}`,
    })) as CartItem[];
  } catch {
    return [];
  }
};

export const useCartStore = create<CartState>((set, get) => {
  const initialItems: CartItem[] = readStorageCart(getStorageKey());

  const saveToStorage = (items: CartItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey(), JSON.stringify(items));
    }
  };

  return {
    items: initialItems,
    promotion: null,

    addItem: (item, quantity = 1) => {
      const lineId = item.id || `${item.variantId}:${item.topping || 'default'}`;
      set((state) => {
        const existingIndex = state.items.findIndex((i) => i.id === lineId);
        let newItems: CartItem[];

        if (existingIndex > -1) {
          newItems = [...state.items];
          newItems[existingIndex].quantity += quantity;
        } else {
          newItems = [...state.items, { ...item, id: lineId, quantity }];
        }

        saveToStorage(newItems);
        return { items: newItems };
      });
    },

    updateQuantity: (id, quantity) => {
      set((state) => {
        let newItems: CartItem[];
        if (quantity <= 0) {
          newItems = state.items.filter((i) => i.id !== id && i.variantId !== id);
        } else {
          newItems = state.items.map((i) =>
            i.id === id || i.variantId === id ? { ...i, quantity } : i,
          );
        }
        saveToStorage(newItems);
        return { items: newItems };
      });
    },

    removeItem: (id) => {
      set((state) => {
        const newItems = state.items.filter((i) => i.id !== id && i.variantId !== id);
        saveToStorage(newItems);
        return { items: newItems };
      });
    },

    clearCart: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(getStorageKey());
        localStorage.removeItem('brewlite_cart');
      }
      set({ items: [], promotion: null });
    },

    loadUserCart: (accountKey?: string) => {
      const key = getStorageKey(accountKey);
      const items = readStorageCart(key);
      set({ items, promotion: null });
    },

    switchUserCart: (accountKey?: string) => {
      const key = getStorageKey(accountKey);
      const items = readStorageCart(key);
      set({ items, promotion: null });
    },

    applyPromotion: (promo) => {
      set({ promotion: promo });
    },

    removePromotion: () => {
      set({ promotion: null });
    },

    getSubtotal: () => {
      return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    },

    getTotalCount: () => {
      return get().items.reduce((acc, item) => acc + item.quantity, 0);
    },

    getFinalTotal: () => {
      const subtotal = get().getSubtotal();
      const discount = get().promotion ? get().promotion!.discountAmount : 0;
      return Math.max(0, subtotal - discount);
    },
  };
});
