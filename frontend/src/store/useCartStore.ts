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
  minOrder?: number;
}

interface CartState {
  items: CartItem[];
  promotion: AppliedPromotion | null;
  promotions: AppliedPromotion[];
  loyaltyPointsUsed: number;
  setLoyaltyPointsUsed: (pts: number) => void;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { id?: string }, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  loadUserCart: (accountKey?: string) => void;
  switchUserCart: (accountKey?: string) => void;
  applyPromotion: (promo: AppliedPromotion) => void;
  togglePromotion: (promo: AppliedPromotion) => void;
  removePromotion: (code?: string) => void;
  getPromoDiscount: () => number;
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
    promotions: [],
    loyaltyPointsUsed: 0,

    setLoyaltyPointsUsed: (pts: number) => {
      set({ loyaltyPointsUsed: Math.max(0, pts) });
    },

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
      set({ items: [], promotion: null, promotions: [], loyaltyPointsUsed: 0 });
    },

    loadUserCart: (accountKey?: string) => {
      const key = getStorageKey(accountKey);
      const items = readStorageCart(key);
      set({ items, promotion: null, promotions: [], loyaltyPointsUsed: 0 });
    },

    switchUserCart: (accountKey?: string) => {
      const key = getStorageKey(accountKey);
      const items = readStorageCart(key);
      set({ items, promotion: null, promotions: [], loyaltyPointsUsed: 0 });
    },

    applyPromotion: (promo) => {
      set((state) => {
        const existingIdx = state.promotions.findIndex((p) => p.code.toUpperCase() === promo.code.toUpperCase());
        let updated: AppliedPromotion[];
        if (existingIdx > -1) {
          updated = [...state.promotions];
          updated[existingIdx] = promo;
        } else {
          updated = [...state.promotions, promo];
        }
        return {
          promotions: updated,
          promotion: updated[0] || null,
        };
      });
    },

    togglePromotion: (promo) => {
      set((state) => {
        const exists = state.promotions.some((p) => p.code.toUpperCase() === promo.code.toUpperCase());
        const updated = exists
          ? state.promotions.filter((p) => p.code.toUpperCase() !== promo.code.toUpperCase())
          : [...state.promotions, promo];
        return {
          promotions: updated,
          promotion: updated[0] || null,
        };
      });
    },

    removePromotion: (code?: string) => {
      set((state) => {
        if (!code) {
          return { promotions: [], promotion: null };
        }
        const updated = state.promotions.filter((p) => p.code.toUpperCase() !== code.toUpperCase());
        return {
          promotions: updated,
          promotion: updated[0] || null,
        };
      });
    },

    getPromoDiscount: () => {
      return get().promotions.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
    },

    getSubtotal: () => {
      return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    },

    getTotalCount: () => {
      return get().items.reduce((acc, item) => acc + item.quantity, 0);
    },

    getFinalTotal: () => {
      const subtotal = get().getSubtotal();
      const promoDiscount = get().promotions.length > 0
        ? get().promotions.reduce((sum, p) => sum + (p.discountAmount || 0), 0)
        : (get().promotion ? get().promotion!.discountAmount : 0);
      const pointsDiscount = (get().loyaltyPointsUsed || 0) * 100;
      return Math.max(0, subtotal - promoDiscount - pointsDiscount);
    },
  };
});
