import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  title: string;
  description: string | null;
  event_year: number;
  speaker_id: string | null;
  speaker_name: string | null;
  on_agenda: boolean;
  published: boolean;
  session_date: string | null;
  session_time: string | null;
  session_type: string | null;
  track: string | null;
  agenda_display_order: number | null;
}

const AdminAgendaBuilder = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchSessions();
    }
  }, [selectedYear]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isAdmin = roles?.some(r => r.role === "admin") || false;
    
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/replays");
      return;
    }

    await fetchSessions();
  };

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        speaker:speakers(name)
      `)
      .eq("event_year", selectedYear)
      .order("session_date", { ascending: true, nullsFirst: false })
      .order("session_time", { ascending: true, nullsFirst: false });

    if (error) {
      toast.error("Failed to load sessions");
      console.error(error);
    } else {
      const formattedSessions = (data || []).map((session: any) => ({
        ...session,
        speaker_name: session.speaker?.name || null,
      }));
      setSessions(formattedSessions);
    }
    setLoading(false);
  };

  const toggleAgenda = async (sessionId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("sessions")
      .update({ on_agenda: !currentStatus })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to update agenda status");
      console.error(error);
    } else {
      toast.success(currentStatus ? "Removed from agenda" : "Added to agenda");
      fetchSessions();
    }
  };

  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agenda Builder</h1>
            <p className="text-muted-foreground">Select which sessions appear on the public agenda</p>
          </div>
          <Button onClick={() => navigate("/admin")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sessions for {selectedYear}</CardTitle>
            <CardDescription>
              Toggle sessions to include them in the public agenda. Sessions with dates and times will be displayed in chronological order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No sessions found for {selectedYear}</p>
                <Button onClick={() => navigate("/admin/sessions")}>
                  Create Sessions
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card key={session.id} className={session.on_agenda ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{session.title}</h3>
                            {session.session_type && (
                              <Badge variant="outline">{session.session_type}</Badge>
                            )}
                            {session.track && (
                              <Badge variant="secondary">{session.track}</Badge>
                            )}
                          </div>
                          
                          {session.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {session.speaker_name && (
                              <span>Speaker: {session.speaker_name}</span>
                            )}
                            {session.session_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(session.session_date).toLocaleDateString()}
                              </div>
                            )}
                            {session.session_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {session.session_time}
                              </div>
                            )}
                            <Badge variant={session.published ? "default" : "secondary"}>
                              {session.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={session.on_agenda}
                            onCheckedChange={() => toggleAgenda(session.id, session.on_agenda)}
                          />
                          <span className="text-sm font-medium whitespace-nowrap">
                            {session.on_agenda ? "On Agenda" : "Hidden"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview Agenda</CardTitle>
            <CardDescription>Sessions currently visible on the public agenda</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.filter(s => s.on_agenda).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No sessions selected for the agenda yet
              </p>
            ) : (
              <div className="space-y-2">
                {sessions
                  .filter(s => s.on_agenda)
                  .map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.session_date && new Date(session.session_date).toLocaleDateString()}
                          {session.session_time && ` at ${session.session_time}`}
                          {session.speaker_name && ` • ${session.speaker_name}`}
                        </p>
                      </div>
                      {session.session_type && (
                        <Badge variant="outline">{session.session_type}</Badge>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdminAgendaBuilder;