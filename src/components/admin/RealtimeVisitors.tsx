import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RealtimeData {
  activeUsers: number;
  usersByPage: Array<{ page: string; users: number }>;
  usersByCountry: Array<{ country: string; users: number }>;
  recentEvents: Array<{ eventName: string; timestamp: string }>;
}

export const RealtimeVisitors = () => {
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRealtimeData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL("https://ppvgibvylsxdybsxufxm.supabase.co/functions/v1/fetch-ga4-data");
      url.searchParams.set("mode", "realtime");

      console.log("Fetching realtime data from:", url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Realtime fetch error:", errorText);
        throw new Error(`Failed to fetch realtime data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Realtime data received:", data);
      setRealtimeData(data);
    } catch (error) {
      console.error("Failed to fetch realtime data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchRealtimeData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Activity className="h-8 w-8 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!realtimeData) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">No real-time data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Users Right Now
          </CardTitle>
          <CardDescription>Currently browsing your site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {realtimeData.activeUsers}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Live visitors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Active Pages
          </CardTitle>
          <CardDescription>What users are viewing</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {realtimeData.usersByPage.length > 0 ? (
              <div className="space-y-2">
                {realtimeData.usersByPage.map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm truncate flex-1">{page.page}</span>
                    <Badge variant="secondary" className="ml-2">
                      {page.users} {page.users === 1 ? 'user' : 'users'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active pages</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest user interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {realtimeData.recentEvents.length > 0 ? (
              <div className="space-y-2">
                {realtimeData.recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm font-medium">{event.eventName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Just now
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent events</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
