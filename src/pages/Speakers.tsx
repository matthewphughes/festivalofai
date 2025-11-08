import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Twitter, Globe, Youtube, Instagram, Play, Clock, Lock } from "lucide-react";
import { toast } from "sonner";

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


const Speakers = () => {
  const navigate = useNavigate();
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [yearFilter, setYearFilter] = useState<"all" | "2025" | "2026">("all");
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedYears, setPurchasedYears] = useState<number[]>([]);
  const [purchasedReplayIds, setPurchasedReplayIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session) {
      await checkPurchasedYears();
    }

    await fetchSpeakers();
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

    // Get years from bundle purchases (where replay_id is null)
    const bundleYears = data
      ?.filter(p => p.replay_id === null)
      .map(p => p.event_year) || [];
    
    // Get individual replay IDs
    const individualReplayIds = data
      ?.filter(p => p.replay_id !== null)
      .map(p => p.replay_id as string) || [];
    
    const years = [...new Set(bundleYears)];
    setPurchasedYears(years);
    setPurchasedReplayIds(individualReplayIds);
  };

  const fetchSpeakers = async () => {
    setLoading(true);
    
    // Fetch speakers with their replays
    const { data, error } = await supabase
      .from("speakers")
      .select(`
        *,
        replays:event_replays(
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          event_year,
          duration_minutes,
          published
        )
      `)
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load speakers");
    } else {
      // Filter to only show published replays for non-authenticated users
      const processedSpeakers = (data || []).map(speaker => ({
        ...speaker,
        replays: (speaker.replays || []).filter((replay: Replay) => replay.published)
      }));
      setSpeakers(processedSpeakers);
    }
    setLoading(false);
  };

  const hasAccessToReplay = (replay: Replay) => {
    // Check if user has purchased the year bundle or the individual replay
    return purchasedYears.includes(replay.event_year) || 
           purchasedReplayIds.includes(replay.id);
  };

  const handleBuyReplay = () => {
    if (!isAuthenticated) {
      navigate("/auth?redirect=/speakers");
    } else {
      navigate("/buy-replays");
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const filteredSpeakers = yearFilter === "all" 
    ? speakers 
    : speakers.filter(s => s.years?.includes(parseInt(yearFilter)));

  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Our <span className="text-accent">Speakers</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn from world-class AI practitioners, innovators, and thought leaders who are shaping 
              the future of artificial intelligence.
            </p>
          </div>

          {/* Year Filter */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex gap-2 p-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
              <Button
                onClick={() => setYearFilter("all")}
                variant={yearFilter === "all" ? "default" : "ghost"}
                className={yearFilter === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                All Speakers
              </Button>
              <Button
                onClick={() => setYearFilter("2025")}
                variant={yearFilter === "2025" ? "default" : "ghost"}
                className={yearFilter === "2025" ? "bg-primary text-primary-foreground" : ""}
              >
                2025 Speakers
              </Button>
              <Button
                onClick={() => setYearFilter("2026")}
                variant={yearFilter === "2026" ? "default" : "ghost"}
                className={yearFilter === "2026" ? "bg-primary text-primary-foreground" : ""}
              >
                2026 Speakers
              </Button>
            </div>
          </div>

          {/* Speakers Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading speakers...</p>
            </div>
          ) : filteredSpeakers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No speakers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {filteredSpeakers.map((speaker) => (
                <Card
                  key={speaker.id}
                  className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 hover:scale-105 group cursor-pointer"
                  onClick={() => setSelectedSpeaker(speaker)}
                >
                  <CardContent className="p-6">
                    <div className="relative mb-4 overflow-hidden rounded-lg">
                      <img
                        src={speaker.image_url || "https://via.placeholder.com/400x400?text=No+Image"}
                        alt={speaker.name}
                        className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{speaker.name}</h3>
                    {speaker.title && <p className="text-accent font-semibold mb-3">{speaker.title}</p>}
                    
                    {/* Year Badges */}
                    {speaker.years && speaker.years.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {speaker.years.map((year) => (
                          <Badge key={year} variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                            {year}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Social Icons */}
                    <div className="flex gap-3 mt-4">
                      {speaker.linkedin_url && (
                        <a
                          href={speaker.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {speaker.twitter_url && (
                        <a
                          href={speaker.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {speaker.youtube_url && (
                        <a
                          href={speaker.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Youtube className="w-5 h-5" />
                        </a>
                      )}
                      {speaker.instagram_url && (
                        <a
                          href={speaker.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {speaker.website_url && (
                        <a
                          href={speaker.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Speaker Profile Dialog */}
          <Dialog open={!!selectedSpeaker} onOpenChange={() => setSelectedSpeaker(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={selectedSpeaker?.image_url || "/placeholder.svg"}
                    alt={selectedSpeaker?.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <DialogTitle className="text-2xl">{selectedSpeaker?.name}</DialogTitle>
                    {selectedSpeaker?.title && (
                      <p className="text-muted-foreground">{selectedSpeaker.title}</p>
                    )}
                    {selectedSpeaker?.company && (
                      <p className="text-sm text-muted-foreground">{selectedSpeaker.company}</p>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Years */}
                {selectedSpeaker?.years && selectedSpeaker.years.length > 0 && (
                  <div className="flex gap-2">
                    {selectedSpeaker.years.sort().map((year) => (
                      <Badge key={year} variant="secondary">
                        {year}
                      </Badge>
                    ))}
                  </div>
                )}

                {selectedSpeaker?.bio && (
                  <p className="text-sm text-muted-foreground">
                    {selectedSpeaker.bio}
                  </p>
                )}

                {/* Social Links */}
                <div>
                  <div className="flex gap-4">
                    {selectedSpeaker?.linkedin_url && (
                      <a
                        href={selectedSpeaker.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="h-6 w-6" />
                      </a>
                    )}
                    {selectedSpeaker?.twitter_url && (
                      <a
                        href={selectedSpeaker.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Twitter className="h-6 w-6" />
                      </a>
                    )}
                    {selectedSpeaker?.youtube_url && (
                      <a
                        href={selectedSpeaker.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Youtube className="h-6 w-6" />
                      </a>
                    )}
                    {selectedSpeaker?.instagram_url && (
                      <a
                        href={selectedSpeaker.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Instagram className="h-6 w-6" />
                      </a>
                    )}
                    {selectedSpeaker?.tiktok_url && (
                      <a
                        href={selectedSpeaker.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
                    )}
                    {selectedSpeaker?.website_url && (
                      <a
                        href={selectedSpeaker.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Globe className="h-6 w-6" />
                      </a>
                    )}
                  </div>
                </div>

                {/* View Full Profile Button */}
                <Button
                  className="w-full"
                  onClick={() => {
                    if (selectedSpeaker?.slug) {
                      window.location.href = `/speakers/${selectedSpeaker.slug}`;
                    }
                  }}
                >
                  View Full Profile
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">More Speakers Coming Soon!</h2>
              <p className="text-xl mb-8 text-foreground/80 max-w-2xl mx-auto">
                We're constantly updating our lineup with amazing speakers. 
                Get your ticket now to secure your spot!
              </p>
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6"
              >
                <a href="/tickets">Get Your Ticket</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Speakers;
