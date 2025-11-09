import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface CartProps {
  onClose?: () => void;
}

export const Cart = ({ onClose }: CartProps) => {
  const { items, removeFromCart, total, itemCount, loading } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose?.();
    navigate("/checkout");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground">Add some replays to get started!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{item.product_name}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {item.product_type === "year_bundle" 
                    ? `All ${item.event_year} Replays` 
                    : `${item.event_year} Replay`}
                </p>
                <p className="text-sm font-semibold">
                  £{(item.amount / 100).toFixed(2)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromCart(item.product_id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 mt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span>{itemCount}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>£{(total / 100).toFixed(2)}</span>
          </div>
        </div>

        <Button 
          onClick={handleCheckout} 
          className="w-full"
          size="lg"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};
