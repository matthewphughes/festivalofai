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
import { Loader2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { useTheme } from "next-themes";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const CheckoutForm = ({ isGuest, userEmail }: { isGuest: boolean; userEmail: string | null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndCreateIntent();
  }, []);

  const checkAuthAndCreateIntent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsGuest(!session);
      setUserEmail(session?.user?.email || null);

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

  const { theme } = useTheme();
  const logo = theme === "dark" ? logoDark : logoLight;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="py-8 border-b">
          <div className="container mx-auto px-4 flex justify-center">
            <img src={logo} alt="Logo" className="h-16" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <Button onClick={() => navigate("/buy-replays")}>Browse Replays</Button>
          </div>
        </div>
        <footer className="py-6 border-t">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Festival of AI. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header with Logo */}
      <header className="py-8 border-b">
        <div className="container mx-auto px-4 flex justify-center">
          <img src={logo} alt="Logo" className="h-20" />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/buy-replays")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Secure Checkout</h1>
            {isGuest && (
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

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
              {!isGuest && userEmail && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm mb-1">
                    <strong>Purchasing as:</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              )}
              {isGuest && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm mb-2">
                    <strong>Checking out as guest</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => navigate("/auth")}
                    >
                      Sign in here
                    </Button>
                  </p>
                </div>
              )}
              {clientSecret && (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    },
                    ...(userEmail && !isGuest && {
                      defaultValues: {
                        billingDetails: {
                          email: userEmail,
                        }
                      }
                    })
                  }}
                >
                  <CheckoutForm isGuest={isGuest} userEmail={userEmail} />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Minimal Footer */}
      <footer className="py-6 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Festival of AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
