import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem('@GoMarket:Products');

      if (items) setProducts(JSON.parse(items));
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarket:Products',
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);

  const increment = useCallback(async id => {
    setProducts(state =>
      state.map(x => (x.id === id ? { ...x, quantity: x.quantity + 1 } : x)),
    );
  }, []);

  const addToCart = useCallback(
    async product => {
      if (products.findIndex(x => x.id === product.id) !== -1) {
        await increment(product.id);
      } else {
        setProducts(state => [...state, { ...product, quantity: 1 }]);
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async (id: string) => {
      const idx = products.findIndex(x => x.id === id);
      const product = products[idx];

      if (product.quantity > 1) {
        setProducts(state =>
          state.map(x =>
            x.id === id ? { ...x, quantity: x.quantity - 1 } : x,
          ),
        );
      } else {
        setProducts(state => state.filter(x => x.id !== id));
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
