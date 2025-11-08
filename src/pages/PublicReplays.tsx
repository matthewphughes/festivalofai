import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReplay, setSelectedReplay] = useState<Replay | null>(null);

  useEffect(() => {
    fetchReplays();
  }, []);

  const fetchReplays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_replays")
      .select("*")
      .eq("published", true)
      .order("event_year", { ascending: false });

    if (error) {
      toast.error("Failed to load replays");
      console.error(error);
    } else {
      setReplays(data || []);
    }
    setLoading(false);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const replays2025 = replays.filter(r => r.event_year === 2025);
  const replays2026 = replays.filter(r => r.event_year === 2026);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Event Replays - Festival of AI</title>
        <meta name="description" content="Watch sessions from previous Festival of AI events. Access expert talks on artificial intelligence, machine learning, and emerging AI technologies." />
        <meta property="og:title" content="Event Replays - Festival of AI" />
        <meta property="og:description" content="Watch sessions from previous Festival of AI events" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://festivalof.ai/replays" />
      </Helmet>

      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Event <span className="text-accent">Replays</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch sessions from previous Festival of AI events. Access expert talks and insights from industry leaders.
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
          <Tabs defaultValue="2026" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="2026">2026 Replays ({replays2026.length})</TabsTrigger>
              <TabsTrigger value="2025">2025 Replays ({replays2025.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="2026" className="mt-6">
              {replays2026.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No 2026 replays available yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {replays2026.map((replay) => (
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
            </TabsContent>

            <TabsContent value="2025" className="mt-6">
              {replays2025.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No 2025 replays available yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {replays2025.map((replay) => (
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
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />

      {/* Video Player Dialog */}
      <Dialog open={!!selectedReplay} onOpenChange={() => setSelectedReplay(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedReplay && (
            <div>
              <div className="aspect-video">
                <iframe
                  src={getYouTubeEmbedUrl(selectedReplay.video_url)}
                  title={selectedReplay.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedReplay.title}</h2>
                {selectedReplay.speaker_name && (
                  <p className="text-accent font-semibold mb-4">{selectedReplay.speaker_name}</p>
                )}
                {selectedReplay.description && (
                  <p className="text-muted-foreground">{selectedReplay.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicReplays;
