import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Linkedin, Twitter, Globe, Youtube, Instagram, ArrowLeft, Play, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { useCart } from "@/contexts/CartContext";
import VideoModal from "@/components/VideoModal";

interface Replay {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  event_year: number;
  duration_minutes: number | null;
  published: boolean;
}

interface Speaker {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  image_url: string | null;
  years: number[] | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  slug: string;
  replays?: Replay[];
}

interface StripeProduct {
  id: string;
  stripe_price_id: string;
  product_name: string;
  product_type: string;
  amount: number;
  currency: string;
  event_year: number;
  replay_id: string | null;
  active: boolean;
}

const SpeakerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasedYears, setPurchasedYears] = useState<number[]>([]);
  const [purchasedReplayIds, setPurchasedReplayIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");

  useEffect(() => {
    checkAuthAndFetch();
  }, [slug]);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session) {
      await checkPurchasedYears();
    }

    await Promise.all([fetchSpeaker(), fetchStripeProducts()]);
  };

  const fetchStripeProducts = async () => {
    const { data, error } = await supabase
      .from("stripe_products")
      .select("*")
      .eq("active", true);

    if (error) {
      console.error("Error fetching stripe products:", error);
      return;
    }

    setStripeProducts(data || []);
  };

  const checkPurchasedYears = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("replay_purchases")
      .select("event_year, replay_id")
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error fetching purchases:", error);
      return;
    }

    const bundleYears = data
      ?.filter(p => p.replay_id === null)
      .map(p => p.event_year) || [];
    
    const individualReplayIds = data
      ?.filter(p => p.replay_id !== null)
      .map(p => p.replay_id as string) || [];
    
    const years = [...new Set(bundleYears)];
    setPurchasedYears(years);
    setPurchasedReplayIds(individualReplayIds);
  };

  const fetchSpeaker = async () => {
    if (!slug) {
      navigate("/speakers");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("speakers")
      .select(`
        *,
        replays:sessions!speaker_id(id, title, description, video_url, thumbnail_url, event_year, published, duration_minutes)
      `)
      .eq("slug", slug)
      .single();

    if (error || !data) {
      toast.error("Speaker not found");
      navigate("/speakers");
      return;
    }

    // Only show published replays
    const processedSpeaker = {
      ...data,
      replays: (data.replays || []).filter((replay: Replay) => replay.published)
    };

    setSpeaker(processedSpeaker);
    setLoading(false);
  };

  const hasAccessToReplay = (replay: Replay) => {
    return purchasedYears.includes(replay.event_year) || 
           purchasedReplayIds.includes(replay.id);
  };

  const getReplayProduct = (replayId: string) => {
    return stripeProducts.find(
      p => p.product_type === "individual_replay" && p.replay_id === replayId
    );
  };

  const getYearBundleProduct = (eventYear: number) => {
    return stripeProducts.find(
      p => p.product_type === "year_bundle" && p.event_year === eventYear
    );
  };

  const handleAddToCart = async (replay: Replay) => {
    const product = getReplayProduct(replay.id);
    
    if (!product) {
      toast.error("No pricing configured for this replay");
      return;
    }

    await addToCart(product.id);
  };

  const handleAddBundleToCart = async (eventYear: number) => {
    const product = getYearBundleProduct(eventYear);
    
    if (!product) {
      toast.error("No pricing configured for this bundle");
      return;
    }

    await addToCart(product.id);
  };

  const handlePlayVideo = (videoUrl: string, title: string) => {
    setCurrentVideoUrl(videoUrl);
    setCurrentVideoTitle(title);
    setVideoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-24">
          <p className="text-center text-muted-foreground">Loading speaker profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!speaker) return null;

  const metaDescription = speaker.bio
    ? speaker.bio.substring(0, 160)
    : `${speaker.name} - Speaker at Festival of AI`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: speaker.name,
    jobTitle: speaker.title,
    worksFor: speaker.company ? {
      "@type": "Organization",
      name: speaker.company
    } : undefined,
    description: speaker.bio,
    image: speaker.image_url,
    url: `https://festivalof.ai/speakers/${speaker.slug}`,
    sameAs: [
      speaker.linkedin_url,
      speaker.twitter_url,
      speaker.youtube_url,
      speaker.instagram_url,
      speaker.website_url,
    ].filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{speaker.name} - Festival of AI Speaker</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${speaker.name} - Festival of AI`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={speaker.image_url || ""} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://festivalof.ai/speakers/${speaker.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${speaker.name} - Festival of AI`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={speaker.image_url || ""} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <Button
          onClick={() => navigate("/speakers")}
          variant="outline"
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Speakers
        </Button>

        {/* Hero Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            <Card className="overflow-hidden">
              <img
                src={speaker.image_url || "/placeholder.svg"}
                alt={speaker.name}
                className="w-full aspect-square object-cover"
              />
            </Card>
          </div>

          <div className="md:col-span-2 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{speaker.name}</h1>
            {speaker.title && (
              <p className="text-xl text-muted-foreground mb-2">{speaker.title}</p>
            )}
            {speaker.company && (
              <p className="text-lg text-muted-foreground mb-4">{speaker.company}</p>
            )}
            
            {speaker.years && speaker.years.length > 0 && (
              <div className="flex gap-2 mb-6">
                {speaker.years.sort().map((year) => (
                  <Badge key={year} variant="secondary">
                    {year}
                  </Badge>
                ))}
              </div>
            )}

            {speaker.bio && (
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed mb-6">
                {speaker.bio}
              </p>
            )}

            {/* Social Links */}
            <div className="flex gap-4">
              {speaker.linkedin_url && (
                <a
                  href={speaker.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
              {speaker.twitter_url && (
                <a
                  href={speaker.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter/X"
                >
                  <Twitter className="h-6 w-6" />
                </a>
              )}
              {speaker.youtube_url && (
                <a
                  href={speaker.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-6 w-6" />
                </a>
              )}
              {speaker.instagram_url && (
                <a
                  href={speaker.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {speaker.tiktok_url && (
                <a
                  href={speaker.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              {speaker.website_url && (
                <a
                  href={speaker.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Website"
                >
                  <Globe className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Session Replays Section */}
        {speaker.replays && speaker.replays.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Session Replays</h2>
            <div className="space-y-4">
              {speaker.replays.map((replay) => {
                const hasAccess = hasAccessToReplay(replay);
                const replayProduct = getReplayProduct(replay.id);
                const yearBundleProduct = getYearBundleProduct(replay.event_year);
                
                return (
                  <Card key={replay.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row gap-0">
                        {/* Thumbnail */}
                        <div 
                          className="relative md:w-96 flex-shrink-0 group cursor-pointer"
                          onClick={() => hasAccess && handlePlayVideo(replay.video_url, replay.title)}
                        >
                          <div className="aspect-video bg-muted overflow-hidden">
                            {replay.thumbnail_url ? (
                              <img 
                                src={replay.thumbnail_url} 
                                alt={replay.title}
                                loading="lazy"
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                            <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                              <div className="bg-primary rounded-full p-4">
                                <Play className="w-8 h-8 text-primary-foreground fill-current" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h3 className="font-bold text-xl flex-1">{replay.title}</h3>
                              <Badge variant="outline" className="flex-shrink-0">
                                {replay.event_year}
                              </Badge>
                            </div>
                            
                            {replay.description && (
                              <p className="text-muted-foreground mb-4">
                                {replay.description}
                              </p>
                            )}
                            
                            {replay.duration_minutes && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{replay.duration_minutes} minutes</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-6">
                            {hasAccess ? (
                              <Button 
                                size="lg"
                                className="w-full md:w-auto"
                                onClick={() => handlePlayVideo(replay.video_url, replay.title)}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Watch Now
                              </Button>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-3">
                                {replayProduct && (
                                  <Button 
                                    size="lg"
                                    onClick={() => handleAddToCart(replay)}
                                    className="flex-1"
                                  >
                                    Add to Cart - £{(replayProduct.amount / 100).toFixed(2)}
                                  </Button>
                                )}
                                {yearBundleProduct && (
                                  <Button 
                                    size="lg"
                                    variant="outline"
                                    onClick={() => handleAddBundleToCart(replay.event_year)}
                                    className="flex-1"
                                  >
                                    Add {replay.event_year} Pack to Cart - £{(yearBundleProduct.amount / 100).toFixed(2)}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <Card className="bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Get Your Tickets</h2>
          <p className="text-muted-foreground mb-6">
            Don't miss the opportunity to see {speaker.name} speak at Festival of AI
          </p>
          <Link to="/tickets">
            <Button size="lg">
              View Ticket Options
            </Button>
          </Link>
        </Card>
      </main>

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={currentVideoUrl}
        title={currentVideoTitle}
      />

      <Footer />
    </div>
  );
};

export default SpeakerProfile;
