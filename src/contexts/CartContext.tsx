import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartItem {
  product_id: string;
  product_name: string;
  amount: number;
  currency: string;
  product_type: string;
  event_year: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("cart_session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("cart_session_id", id);
    }
    return id;
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let cartData;
      
      if (session?.user) {
        // Load user's cart
        const { data } = await supabase
          .from("shopping_cart")
          .select(`
            product_id,
            quantity,
            stripe_products (
              product_name,
              amount,
              currency,
              product_type,
              event_year
            )
          `)
          .eq("user_id", session.user.id);
        
        cartData = data;
      } else {
        // Load guest cart
        const { data } = await supabase
          .from("shopping_cart")
          .select(`
            product_id,
            quantity,
            stripe_products (
              product_name,
              amount,
              currency,
              product_type,
              event_year
            )
          `)
          .eq("session_id", sessionId);
        
        cartData = data;
      }

      if (cartData) {
        const formattedItems = cartData.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          product_name: item.stripe_products.product_name,
          amount: item.stripe_products.amount,
          currency: item.stripe_products.currency,
          product_type: item.stripe_products.product_type,
          event_year: item.stripe_products.event_year,
        }));
        setItems(formattedItems);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if product already in cart
      const existingItem = items.find(item => item.product_id === productId);
      if (existingItem) {
        toast.info("Item already in cart");
        return;
      }

      // Get product details
      const { data: product } = await supabase
        .from("stripe_products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!product) {
        toast.error("Product not found");
        return;
      }

      // Add to database cart
      const cartItem = {
        product_id: productId,
        quantity: 1,
        user_id: session?.user?.id || null,
        session_id: session?.user ? null : sessionId,
      };

      const { error } = await supabase
        .from("shopping_cart")
        .insert(cartItem);

      if (error) throw error;

      // Update local state
      setItems(prev => [...prev, {
        product_id: productId,
        product_name: product.product_name,
        amount: product.amount,
        currency: product.currency,
        product_type: product.product_type,
        event_year: product.event_year,
        quantity: 1,
      }]);

      toast.success("Added to cart");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("shopping_cart")
        .delete()
        .eq("product_id", productId)
        .eq(session?.user ? "user_id" : "session_id", session?.user?.id || sessionId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.product_id !== productId));
      toast.success("Removed from cart");
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      toast.error("Failed to remove from cart");
    }
  };

  const clearCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("shopping_cart")
        .delete()
        .eq(session?.user ? "user_id" : "session_id", session?.user?.id || sessionId);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const total = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      total,
      itemCount,
      loading,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
