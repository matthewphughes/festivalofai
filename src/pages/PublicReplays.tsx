import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Clock, Edit, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { useCart } from "@/contexts/CartContext";

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  video_url: z.union([z.string().url("Invalid URL").refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: "Must be a YouTube URL" }
  ), z.literal("")]).optional(),
  thumbnail_url: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  event_year: z.number().int().min(2020, "Year must be 2020 or later").max(2030, "Year must be 2030 or earlier"),
  speaker_id: z.string().uuid().optional(),
  duration_minutes: z.number().int().positive("Duration must be a positive number").max(600, "Duration must be less than 600 minutes").nullable().optional(),
  published: z.boolean(),
});


interface Replay {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  event_year: number;
  speaker_id: string | null;
  speaker_name: string | null;
  speaker_slug: string | null;
  duration_minutes: number | null;
}

const PublicReplays = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReplay, setSelectedReplay] = useState<Replay | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchReplays();
    fetchProducts();
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
      .select(`
        *,
        speaker:speakers(name, slug)
      `)
      .eq("published", true)
      .not("video_url", "is", null)
      .order("event_year", { ascending: false });

    if (error) {
      toast.error("Failed to load replays");
      console.error(error);
    } else {
      const formattedReplays = (data || []).map((session: any) => ({
        ...session,
        speaker_name: session.speaker?.name || null,
        speaker_slug: session.speaker?.slug || null,
      }));
      setReplays(formattedReplays);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("stripe_products")
      .select("*")
      .eq("active", true);

    if (error) {
      console.error("Failed to load products", error);
    } else {
      setProducts(data || []);
    }
  };


  const handleAddToCart = async (replay: Replay) => {
    const product = products.find(p => 
      p.product_type === "individual_replay" && 
      p.replay_id === replay.id
    );

    if (!product) {
      toast.error("No pricing configured for this replay");
      return;
    }

    await addToCart(product.id);
  };

  const handleAddBundleToCart = async (eventYear: number) => {
    const product = products.find(p => 
      p.product_type === "year_bundle" && 
      p.event_year === eventYear
    );

    if (!product) {
      toast.error("No pricing configured for this bundle");
      return;
    }

    await addToCart(product.id);
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
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="relative aspect-video bg-muted cursor-pointer" onClick={() => setSelectedReplay(replay)}>
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
                  <div className="cursor-pointer" onClick={() => setSelectedReplay(replay)}>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{replay.title}</h3>
                    {replay.speaker_name && (
                      <p 
                        className="text-sm text-primary mb-2 hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (replay.speaker_slug) {
                            navigate(`/speakers/${replay.speaker_slug}`);
                          }
                        }}
                      >
                        {replay.speaker_name}
                      </p>
                    )}
                    {replay.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{replay.description}</p>
                    )}
                  </div>
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
                        <div className="text-2xl font-bold">
                          {products.find(p => p.product_type === "individual_replay" && p.replay_id === selectedReplay.id)
                            ? `£${(products.find(p => p.product_type === "individual_replay" && p.replay_id === selectedReplay.id)!.amount / 100).toFixed(2)}`
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">one-time</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAddToCart(selectedReplay)}
                      className="w-full mt-2"
                      size="sm"
                      disabled={!products.find(p => p.product_type === "individual_replay" && p.replay_id === selectedReplay.id)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-base">Full Year Bundle</h4>
                        <p className="text-xs text-muted-foreground">All {selectedReplay.event_year} replays</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {products.find(p => p.product_type === "year_bundle" && p.event_year === selectedReplay.event_year)
                            ? `£${(products.find(p => p.product_type === "year_bundle" && p.event_year === selectedReplay.event_year)!.amount / 100).toFixed(2)}`
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">one-time</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAddBundleToCart(selectedReplay.event_year)}
                      variant="outline"
                      className="w-full mt-2"
                      size="sm"
                      disabled={!products.find(p => p.product_type === "year_bundle" && p.event_year === selectedReplay.event_year)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add Bundle to Cart
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
