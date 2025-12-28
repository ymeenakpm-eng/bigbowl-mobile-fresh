

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from 'react';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  total: number;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.name === action.payload.name
      );

      if (existingIndex >= 0) {
        const items = [...state.items];
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + 1,
        };
        return { items, total: calculateTotal(items) };
      }

      const newItem: CartItem = {
        ...action.payload,
        id: Math.random().toString(36).slice(2),
        quantity: 1,
      };

      const items = [...state.items, newItem];
      return { items, total: calculateTotal(items) };
    }

    case 'REMOVE_ITEM': {
      const items = state.items.filter((i) => i.id !== action.payload);
      return { items, total: calculateTotal(items) };
    }

    case 'UPDATE_QUANTITY': {
      const items = state.items
        .map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        )
        .filter((i) => i.quantity > 0);
      return { items, total: calculateTotal(items) };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0 };

    default:
      return state;
  }
};

const calculateTotal = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
  });

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) =>
    dispatch({ type: 'ADD_ITEM', payload: item });

  const removeFromCart = (id: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: id });

  const updateQuantity = (id: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const getCartTotal = () => calculateTotal(state.items);

  const getCartItemCount = () =>
    state.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
    }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
};