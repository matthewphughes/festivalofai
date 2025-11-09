import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Twitter, Globe, Youtube, Instagram } from "lucide-react";
import { toast } from "sonner";

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
}


const Speakers = () => {
  const navigate = useNavigate();
  const [yearFilter, setYearFilter] = useState<"all" | "2025" | "2026">("all");
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const fetchSpeakers = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("speakers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load speakers");
    } else {
      setSpeakers(data || []);
    }
    setLoading(false);
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
                  onClick={() => navigate(`/speakers/${speaker.slug}`)}
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
