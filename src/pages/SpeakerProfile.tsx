import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Linkedin, Twitter, Globe, Youtube, Instagram, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

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

const SpeakerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpeaker();
  }, [slug]);

  const fetchSpeaker = async () => {
    if (!slug) {
      navigate("/speakers");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("speakers")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      toast.error("Speaker not found");
      navigate("/speakers");
      return;
    }

    setSpeaker(data);
    setLoading(false);
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

        {/* Bio Section */}
        {speaker.bio && (
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {speaker.bio}
            </p>
          </Card>
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

      <Footer />
    </div>
  );
};

export default SpeakerProfile;
