"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadCartFromServer, syncCartToServer } from "@/app/actions/cart";
import type { CartItem, Product, Sale } from "@/lib/types";
import { computeDisplayPrice } from "@/lib/pricing";

const STORAGE_KEY = "shahkar-cart";
const CART_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, sale: Sale | null) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
  cartBounce: boolean;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

type StoredCart = {
  items: CartItem[];
  savedAt: number;
};

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCart | CartItem[];
    if (Array.isArray(parsed)) return parsed;
    if (Date.now() - parsed.savedAt > CART_EXPIRY_MS) return [];
    return parsed.items;
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  const payload: StoredCart = { items, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of local) {
    map.set(item.productId, item);
  }

  for (const item of remote) {
    const existing = map.get(item.productId);
    const remoteTime = item.addedAt ? new Date(item.addedAt).getTime() : 0;
    const localTime = existing?.addedAt
      ? new Date(existing.addedAt).getTime()
      : 0;

    if (!existing || remoteTime > localTime) {
      map.set(item.productId, item);
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartBounce, setCartBounce] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function hydrate() {
      const local = loadCart();
      try {
        const remote = await loadCartFromServer();
        if (remote && remote.length) {
          setItems(mergeCarts(local, remote));
        } else {
          setItems(local);
        }
      } catch {
        setItems(local);
      }
      setHydrated(true);
    }
    void hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(items);
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void syncCartToServer(items);
    }, 500);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, hydrated]);

  const triggerBounce = useCallback(() => {
    setCartBounce(true);
    window.setTimeout(() => setCartBounce(false), 300);
  }, []);

  const addItem = useCallback(
    (product: Product, sale: Sale | null): boolean => {
      if (product.stock <= 0) return false;

      const { currentPrice } = computeDisplayPrice(product, sale);
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        const nextQty = (existing?.quantity ?? 0) + 1;
        if (nextQty > product.stock) return prev;

        if (existing) {
          return prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: nextQty, price: currentPrice }
              : i,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: currentPrice,
            image: product.images[0] ?? "",
            quantity: 1,
            addedAt: new Date().toISOString(),
          },
        ];
      });
      triggerBounce();
      return true;
    },
    [triggerBounce],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const replaceCart = useCallback((next: CartItem[]) => setItems(next), []);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
      cartBounce,
      hydrated,
    }),
    [
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
      cartBounce,
      hydrated,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
