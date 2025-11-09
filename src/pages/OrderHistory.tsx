import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, Calendar, CreditCard, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Purchase {
  id: string;
  purchased_at: string;
  event_year: number;
  product_id: string;
  replay_id: string | null;
  stripe_payment_intent: string | null;
  discount_amount: number;
  is_admin_grant: boolean;
  stripe_products: {
    product_name: string;
    product_type: string;
    amount: number;
    currency: string;
  };
  sessions?: {
    title: string;
    video_url: string;
  };
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadPurchases();
  }, []);

  const checkAuthAndLoadPurchases = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await loadPurchases();
  };

  const loadPurchases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("replay_purchases")
        .select(`
          *,
          stripe_products (
            product_name,
            product_type,
            amount,
            currency
          ),
          sessions (
            title,
            video_url
          )
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      setPurchases(data || []);
    } catch (error) {
      console.error("Failed to load purchases:", error);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  const handleAccessReplay = async (replayId: string) => {
    try {
      const { data: session } = await supabase
        .from("sessions")
        .select("video_url")
        .eq("id", replayId)
        .single();

      if (session?.video_url) {
        window.open(session.video_url, "_blank");
      }
    } catch (error) {
      toast.error("Failed to access replay");
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/my-account")}
              className="mb-4"
            >
              ← Back to Account
            </Button>
            <h1 className="text-4xl font-bold mb-2">Order History</h1>
            <p className="text-muted-foreground">
              View all your past purchases and access your content
            </p>
          </div>

          {purchases.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't made any purchases yet. Browse our replays to get started!
                </p>
                <Button onClick={() => navigate("/buy-replays")}>
                  Browse Replays
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">
                          {purchase.stripe_products.product_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(purchase.purchased_at), "PPP")}
                          </span>
                          {purchase.stripe_payment_intent && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              {purchase.stripe_payment_intent.slice(-8)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatCurrency(
                            purchase.stripe_products.amount - (purchase.discount_amount || 0),
                            purchase.stripe_products.currency
                          )}
                        </div>
                        {purchase.discount_amount > 0 && (
                          <div className="text-sm text-muted-foreground line-through">
                            {formatCurrency(
                              purchase.stripe_products.amount,
                              purchase.stripe_products.currency
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {purchase.stripe_products.product_type === "year_bundle"
                              ? "Year Bundle"
                              : purchase.stripe_products.product_type === "individual_replay"
                              ? "Individual Replay"
                              : "Ticket"}
                          </Badge>
                          <Badge variant="outline">
                            {purchase.event_year}
                          </Badge>
                          {purchase.is_admin_grant && (
                            <Badge variant="secondary">Admin Grant</Badge>
                          )}
                        </div>
                        {purchase.sessions && (
                          <p className="text-sm text-muted-foreground">
                            {purchase.sessions.title}
                          </p>
                        )}
                      </div>
                      
                      {purchase.replay_id && (
                        <Button
                          onClick={() => handleAccessReplay(purchase.replay_id!)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Access Replay
                        </Button>
                      )}
                      
                      {purchase.stripe_products.product_type === "ticket" && (
                        <Button
                          variant="outline"
                          onClick={() => navigate("/dashboard")}
                          className="gap-2"
                        >
                          View Ticket Details
                        </Button>
                      )}
                      
                      {purchase.stripe_products.product_type === "year_bundle" && (
                        <Button
                          onClick={() => navigate("/replays")}
                          className="gap-2"
                        >
                          View All Replays
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderHistory;
