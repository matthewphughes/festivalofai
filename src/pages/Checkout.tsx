import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe, Stripe } from "@stripe/stripe-js";
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
import { Skeleton } from "@/components/ui/skeleton";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { useTheme } from "next-themes";
import CheckoutProgress from "@/components/checkout/CheckoutProgress";
import { AuthDialog } from "@/components/AuthDialog";

const CheckoutForm = ({ 
  isGuest, 
  userEmail,
  discount,
  setDiscount,
}: { 
  isGuest: boolean; 
  userEmail: string;
  discount: number;
  setDiscount: (discount: number) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const verifyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setVerifyingCoupon(true);

    try {
      const { data: coupon, error } = await supabase
        .from("stripe_coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast.error("Invalid coupon code");
        setVerifyingCoupon(false);
        return;
      }

      // Check if coupon is valid (not expired, not max redemptions)
      const now = new Date();
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        toast.error("This coupon has expired");
        setVerifyingCoupon(false);
        return;
      }

      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        toast.error("This coupon is not yet valid");
        setVerifyingCoupon(false);
        return;
      }

      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        toast.error("This coupon has reached its usage limit");
        setVerifyingCoupon(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = Math.round((total * coupon.discount_value) / 100);
      } else {
        // Fixed amount discount
        discountAmount = coupon.discount_value;
      }

      // Don't allow discount to exceed total
      if (discountAmount > total) {
        discountAmount = total;
      }

      setDiscount(discountAmount);
      setAppliedCoupon(couponCode.toUpperCase());
      toast.success(`Coupon applied! You saved £${(discountAmount / 100).toFixed(2)}`);
    } catch (error: any) {
      console.error("Error verifying coupon:", error);
      toast.error("Failed to verify coupon code");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("Coupon removed");
  };

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
              coupon_code: appliedCoupon,
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
      )}

      <div className="space-y-2">
        <Label htmlFor="coupon">Coupon Code (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="coupon"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="DISCOUNT20"
            disabled={!!appliedCoupon}
            maxLength={50}
          />
          {appliedCoupon ? (
            <Button
              type="button"
              variant="outline"
              onClick={removeCoupon}
              className="whitespace-nowrap"
            >
              Remove
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={verifyCoupon}
              disabled={verifyingCoupon || !couponCode.trim()}
              className="whitespace-nowrap"
            >
              {verifyingCoupon ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Apply Code"
              )}
            </Button>
          )}
        </div>
        {discount > 0 && appliedCoupon && (
          <p className="text-sm text-green-600 font-semibold">
            ✓ Coupon "{appliedCoupon}" applied: -£{(discount / 100).toFixed(2)}
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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [showGuestEmailForm, setShowGuestEmailForm] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    initializeStripe();
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        setIsGuest(false);
        setUserEmail(session.user.email || null);
        setShowAuthDialog(false);
        // Reload payment intent with authenticated user
        if (items.length > 0) {
          createPaymentIntent(session.user.email!);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeStripe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-stripe-publishable-key");
      
      if (error) {
        console.error("Failed to fetch Stripe key:", error);
        setStripeError("Unable to initialize payment system");
        return;
      }

      const { publishableKey } = data;
      
      if (!publishableKey || !publishableKey.startsWith("pk_")) {
        console.error("Invalid Stripe publishable key received:", publishableKey?.substring(0, 7));
        setStripeError("Payment system configuration error");
        return;
      }

      console.log("Initializing Stripe with key:", publishableKey.substring(0, 7));
      setStripePromise(loadStripe(publishableKey));
    } catch (error: any) {
      console.error("Stripe initialization error:", error);
      setStripeError("Unable to initialize payment system");
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isGuestUser = !session;
      setIsGuest(isGuestUser);
      setUserEmail(session?.user?.email || null);

      if (items.length === 0) {
        toast.error("Your cart is empty");
        navigate("/buy-replays");
        return;
      }

      // If user is authenticated, create intent immediately
      if (!isGuestUser) {
        await createPaymentIntent(session.user.email);
      } else {
        // For guests, show email collection form
        setShowGuestEmailForm(true);
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(error.message);
      navigate("/buy-replays");
    }
  };

  const createPaymentIntent = async (email: string) => {
    setCreatingIntent(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          product_ids: items.map(item => item.product_id),
          guest_email: email,
        },
      });

      if (error) throw error;

      setClientSecret(data.clientSecret);
      setShowGuestEmailForm(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setCreatingIntent(false);
    }
  };

  const handleGuestEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestEmail || !guestEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    await createPaymentIntent(guestEmail);
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
          
          <CheckoutProgress 
            currentStep={showGuestEmailForm ? "email" : "payment"} 
            isGuest={isGuest} 
          />
          
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Secure Checkout</h1>
            {isGuest && !showGuestEmailForm && (
              <Button
                variant="outline"
                onClick={() => setShowAuthDialog(true)}
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className={discount > 0 ? "line-through text-muted-foreground" : "font-semibold"}>
                    £{(total / 100).toFixed(2)}
                  </span>
                </div>
                
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">Discount</span>
                      <span className="text-green-600 font-semibold">
                        -£{(discount / 100).toFixed(2)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          £{((total - discount) / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          You save £{(discount / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {discount === 0 && (
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>£{(total / 100).toFixed(2)}</span>
                  </div>
                )}
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
              
              {showGuestEmailForm ? (
                <form onSubmit={handleGuestEmailSubmit} className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <p className="text-sm mb-2">
                      <strong>Guest Checkout</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Already have an account?{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => setShowAuthDialog(true)}
                      >
                        Sign in here
                      </Button>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guest-email">Email Address</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send your purchase confirmation to this email
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={creatingIntent || !guestEmail}
                  >
                    {creatingIntent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue to Payment
                  </Button>
                </form>
              ) : stripeError ? (
                <div className="text-center p-6 bg-destructive/10 rounded-lg">
                  <p className="text-destructive font-semibold mb-2">Payment system unavailable</p>
                  <p className="text-sm text-muted-foreground">
                    {stripeError}. Please contact support if this persists.
                  </p>
                </div>
              ) : clientSecret && stripePromise ? (
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
                  <CheckoutForm 
                    isGuest={isGuest} 
                    userEmail={userEmail || guestEmail}
                    discount={discount}
                    setDiscount={setDiscount}
                  />
                </Elements>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
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

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onSuccess={() => {
          // Auth state change listener will handle the rest
        }}
      />
    </div>
  );
};

export default Checkout;
