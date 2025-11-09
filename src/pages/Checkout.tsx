import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message);
        setLoading(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/thank-you`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        // Payment succeeded, confirm on backend
        const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
        const paymentIntentId = clientSecret?.split("_secret_")[0];

        if (paymentIntentId) {
          const { error: confirmError } = await supabase.functions.invoke("confirm-payment", {
            body: {
              payment_intent_id: paymentIntentId,
              create_account: isGuest && createAccount,
            },
          });

          if (confirmError) {
            toast.error("Payment confirmation failed");
          } else {
            clearCart();
            navigate("/thank-you");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isGuest && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="create-account"
              checked={createAccount}
              onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
            />
            <Label htmlFor="create-account" className="text-sm">
              Create an account to access your purchases
            </Label>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="coupon">Coupon Code (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="coupon"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="DISCOUNT20"
          />
        </div>
        {discount > 0 && (
          <p className="text-sm text-green-600">
            Discount applied: -£{(discount / 100).toFixed(2)}
          </p>
        )}
      </div>

      <PaymentElement />

      <Button type="submit" disabled={!stripe || loading} className="w-full" size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pay £{((total - discount) / 100).toFixed(2)}
      </Button>
    </form>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, loading: cartLoading } = useCart();
  const [clientSecret, setClientSecret] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndCreateIntent();
  }, []);

  const checkAuthAndCreateIntent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsGuest(!session);

      if (items.length === 0) {
        toast.error("Your cart is empty");
        navigate("/buy-replays");
        return;
      }

      // Create payment intent
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          product_ids: items.map(item => item.product_id),
        },
      });

      if (error) throw error;

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast.error(error.message);
      navigate("/buy-replays");
    } finally {
      setLoading(false);
    }
  };

  if (loading || cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate("/buy-replays")}>Browse Replays</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.product_type === "year_bundle" 
                        ? `All ${item.event_year} Replays` 
                        : `${item.event_year} Replay`}
                    </p>
                  </div>
                  <p className="font-semibold">£{(item.amount / 100).toFixed(2)}</p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>£{(total / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Complete your purchase securely</CardDescription>
            </CardHeader>
            <CardContent>
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Checkout;
