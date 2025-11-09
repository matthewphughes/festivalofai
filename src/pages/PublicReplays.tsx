import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";


interface Replay {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  event_year: number;
  speaker_name: string | null;
  duration_minutes: number | null;
}

const PublicReplays = () => {
  const navigate = useNavigate();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReplay, setSelectedReplay] = useState<Replay | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    fetchReplays();
  }, []);

  useEffect(() => {
    if (selectedReplay) {
      setPurchaseDialogOpen(true);
    }
  }, [selectedReplay]);

  const fetchReplays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("published", true)
      .not("video_url", "is", null)
      .not("price_id", "is", null)
      .order("event_year", { ascending: false });

    if (error) {
      toast.error("Failed to load replays");
      console.error(error);
    } else {
      setReplays(data || []);
    }
    setLoading(false);
  };

  const handlePurchase = async (eventYear: number, replayId?: string) => {
    try {
      setPurchaseLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to purchase replays");
        navigate("/auth");
        return;
      }

      let priceId: string;

      // Individual replay purchase
      if (replayId) {
        // Map replay IDs to price IDs for individual purchases
        const individualPriceIds: { [key: string]: string } = {
          "71069a53-fc6c-401b-a59b-e9bc0c190d20": "price_1SRGqVEFw97UKMysD1m7vbJz", // AI Agents
          "86b57135-c65d-4b75-830c-75c3406fb66a": "price_1SRGqWEFw97UKMysebRMJ0bs", // AI For Six Figure Success
          "3bb799b9-e878-4685-8939-2e31719e0f2f": "price_1SRGqYEFw97UKMysDoqfvnWh", // All Speaker Q & A
          "abbe186e-9f98-4a3f-b524-b6b09ccb7086": "price_1SRGqZEFw97UKMysehqDpL2D", // An AI Powered Super Day
          "a0a3ebe8-ecd5-4bc2-b954-53b381318231": "price_1SRGqaEFw97UKMysVTjSiNyA", // Building A Success Mindset
          "84600d95-d5bc-42e2-909d-cf17a8345ac1": "price_1SRGqbEFw97UKMysnCW9bw0e", // Digital Dominance with AI
          "d4710e51-8981-489f-ada9-58d97d4d069a": "price_1SRGqcEFw97UKMysqlyO5Gs5", // Smarter Design with Canva AI
          "42e8285c-7ad2-4942-ae97-acc40cd1eb06": "price_1SRGqdEFw97UKMyspQ18Ndq9", // The Empathy Engine
          "b7a6c74d-734b-4ea6-854b-278ca4748062": "price_1SRGqfEFw97UKMyse39YIzuV", // Why AI Replacing You Isn't A Bad Thing
        };

        priceId = individualPriceIds[replayId];
        if (!priceId) {
          toast.error("Invalid replay selection");
          return;
        }
      } else {
        // Year bundle purchase
        const bundlePriceIds: { [key: number]: string } = {
          2025: "price_1SRFvHEFw97UKMyskr6hX5xc", // 2025 Replays Bundle
          2026: "price_1SRFvaEFw97UKMysELPzJJDX", // 2026 Replays Bundle
        };

        priceId = bundlePriceIds[eventYear];
        if (!priceId) {
          toast.error("Invalid event year");
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          price_id: priceId,
          product_type: "replay",
          event_year: eventYear,
          replay_id: replayId
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to create checkout session");
    } finally {
      setPurchaseLoading(false);
      setPurchaseDialogOpen(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Event Replays - Festival of AI</title>
        <meta name="description" content="Watch sessions from previous Festival of AI events. Access expert talks on artificial intelligence, machine learning, and emerging AI technologies." />
        <meta property="og:title" content="Event Replays - Festival of AI" />
        <meta property="og:description" content="Watch sessions from previous Festival of AI events" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://festivalof.ai/buy-replays" />
      </Helmet>

      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Event <span className="text-accent">Replays</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Purchase access to expert sessions from Festival of AI. Choose individual replays or full year bundles.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading replays...</p>
          </div>
        ) : replays.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No replays available yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {replays.map((replay) => (
              <Card
                key={replay.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                onClick={() => setSelectedReplay(replay)}
              >
                <div className="relative aspect-video bg-muted">
                  {replay.thumbnail_url ? (
                    <img
                      src={replay.thumbnail_url}
                      alt={replay.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Play className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {replay.duration_minutes && (
                    <Badge className="absolute bottom-2 right-2 bg-black/70">
                      <Clock className="h-3 w-3 mr-1" />
                      {replay.duration_minutes} min
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{replay.title}</h3>
                  {replay.speaker_name && (
                    <p className="text-sm text-muted-foreground mb-2">{replay.speaker_name}</p>
                  )}
                  {replay.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{replay.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={(open) => {
        setPurchaseDialogOpen(open);
        if (!open) setSelectedReplay(null);
      }}>
        <DialogContent className="max-w-lg">
          {selectedReplay && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedReplay.title}</DialogTitle>
              </DialogHeader>
              <DialogDescription className="space-y-4">
                <div>
                  <p className="text-base mb-2">
                    <span className="font-semibold">{selectedReplay.speaker_name}</span>
                    {selectedReplay.duration_minutes && (
                      <span className="text-muted-foreground ml-2">
                        {selectedReplay.duration_minutes} minutes
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReplay.description || "Full session replay from Festival of AI"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-base">Single Replay</h4>
                        <p className="text-xs text-muted-foreground">This session only</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">£47</div>
                        <div className="text-xs text-muted-foreground">one-time</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePurchase(selectedReplay.event_year, selectedReplay.id)}
                      disabled={purchaseLoading}
                      className="w-full mt-2"
                      size="sm"
                    >
                      {purchaseLoading ? "Processing..." : "Buy This Replay"}
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-base">Full Year Bundle</h4>
                        <p className="text-xs text-muted-foreground">All {selectedReplay.event_year} replays</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">£99</div>
                        <div className="text-xs text-muted-foreground">one-time</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePurchase(selectedReplay.event_year)}
                      disabled={purchaseLoading}
                      variant="outline"
                      className="w-full mt-2"
                      size="sm"
                    >
                      {purchaseLoading ? "Processing..." : "Buy Full Bundle"}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Already purchased? <button onClick={() => navigate("/auth")} className="underline hover:text-foreground">Sign in</button> to watch
                </p>
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicReplays;
