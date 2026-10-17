import { create } from 'zustand';

export interface CartItem {
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
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  applyPromotion: (promo: AppliedPromotion) => void;
  removePromotion: () => void;
  getSubtotal: () => number;
  getTotalCount: () => number;
  getFinalTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => {
  const initialItems: CartItem[] = typeof window !== 'undefined' && localStorage.getItem('brewlite_cart')
    ? JSON.parse(localStorage.getItem('brewlite_cart')!)
    : [];

  const saveToStorage = (items: CartItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brewlite_cart', JSON.stringify(items));
    }
  };

  return {
    items: initialItems,
    promotion: null,

    addItem: (item, quantity = 1) => {
      set((state) => {
        const existingIndex = state.items.findIndex((i) => i.variantId === item.variantId);
        let newItems: CartItem[];

        if (existingIndex > -1) {
          newItems = [...state.items];
          newItems[existingIndex].quantity += quantity;
        } else {
          newItems = [...state.items, { ...item, quantity }];
        }

        saveToStorage(newItems);
        return { items: newItems };
      });
    },

    updateQuantity: (variantId, quantity) => {
      set((state) => {
        let newItems: CartItem[];
        if (quantity <= 0) {
          newItems = state.items.filter((i) => i.variantId !== variantId);
        } else {
          newItems = state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          );
        }
        saveToStorage(newItems);
        return { items: newItems };
      });
    },

    removeItem: (variantId) => {
      set((state) => {
        const newItems = state.items.filter((i) => i.variantId !== variantId);
        saveToStorage(newItems);
        return { items: newItems };
      });
    },

    clearCart: () => {
      saveToStorage([]);
      set({ items: [], promotion: null });
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
