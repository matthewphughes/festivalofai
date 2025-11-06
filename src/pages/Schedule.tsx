import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users } from "lucide-react";

const Schedule = () => {
  const [selectedTrack, setSelectedTrack] = useState<"beginner" | "advanced">("beginner");

  const day1Workshops = [
    {
      time: "09:00 - 12:00",
      title: "Beginner Workshop",
      description: "Session details coming soon",
      speaker: "Speaker TBC",
      track: "beginner",
    },
    {
      time: "09:00 - 12:00",
      title: "Advanced Workshop",
      description: "Session details coming soon",
      speaker: "Speaker TBC",
      track: "advanced",
    },
  ];

  const day2Schedule = {
    shared: [
      {
        time: "08:00 - 09:00",
        title: "Registration & Breakfast",
        description: "Check in, grab breakfast, and network with fellow attendees",
        type: "break",
      },
      {
        time: "09:00 - 10:00",
        title: "Opening Keynote",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "keynote",
      },
    ],
    beginner: [
      {
        time: "10:00 - 11:00",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "11:00 - 11:30",
        title: "Coffee Break",
        description: "Network and recharge",
        type: "break",
      },
      {
        time: "11:30 - 12:30",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "12:30 - 13:30",
        title: "Lunch & Networking",
        description: "Enjoy lunch while connecting with speakers and attendees",
        type: "break",
      },
      {
        time: "13:30 - 14:30",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "14:30 - 15:30",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "15:30 - 16:00",
        title: "Afternoon Break",
        description: "Refreshments and networking",
        type: "break",
      },
    ],
    advanced: [
      {
        time: "10:00 - 11:00",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "11:00 - 11:30",
        title: "Coffee Break",
        description: "Network and recharge",
        type: "break",
      },
      {
        time: "11:30 - 12:30",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "12:30 - 13:30",
        title: "Lunch & Networking",
        description: "Enjoy lunch while connecting with speakers and attendees",
        type: "break",
      },
      {
        time: "13:30 - 14:30",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "14:30 - 15:30",
        title: "Session Title TBC",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "session",
      },
      {
        time: "15:30 - 16:00",
        title: "Afternoon Break",
        description: "Refreshments and networking",
        type: "break",
      },
    ],
    closing: [
      {
        time: "16:00 - 17:00",
        title: "Closing Q&A in the Planetarium",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "closing",
      },
      {
        time: "17:00 - 18:00",
        title: "Networking Reception",
        description: "Continue conversations and build connections",
        type: "break",
      },
    ],
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "keynote":
        return "border-accent bg-accent/10";
      case "workshop":
        return "border-primary bg-primary/10";
      case "closing":
        return "border-secondary bg-secondary/10";
      case "break":
        return "border-muted bg-muted/10";
      default:
        return "border-border bg-card/50";
    }
  };

  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Event <span className="text-accent">Schedule</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              October 15-16th, 2026 | National Space Center, Leicester
            </p>
          </div>

          {/* Day Tabs */}
          <Tabs defaultValue="day2" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="day1" className="text-base">
                Day 1 - Workshops
              </TabsTrigger>
              <TabsTrigger value="day2" className="text-base">
                Day 2 - Conference
              </TabsTrigger>
            </TabsList>

            {/* Day 1 - Workshops */}
            <TabsContent value="day1" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">
                  Workshop Day - <span className="text-accent">October 15th</span>
                </h2>
                <p className="text-muted-foreground">
                  Choose your track: Beginner or Advanced
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {day1Workshops.map((workshop, index) => (
                  <Card
                    key={index}
                    className={`backdrop-blur-sm border-primary bg-primary/10 hover:scale-102 transition-all duration-300`}
                  >
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-accent mb-2">
                          <Users className="w-4 h-4" />
                          {workshop.track === "beginner" ? "Beginner Track" : "Advanced Track"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-accent font-bold mb-4">
                        <Clock className="w-5 h-5" />
                        {workshop.time}
                      </div>
                      <h3 className="text-2xl font-bold mb-3">{workshop.title}</h3>
                      <p className="text-accent font-semibold mb-2">
                        {workshop.speaker}
                      </p>
                      <p className="text-muted-foreground">{workshop.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Day 2 - Conference */}
            <TabsContent value="day2" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">
                  Conference Day - <span className="text-accent">October 16th</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select your track for breakout sessions
                </p>

                {/* Track Selector */}
                <div className="inline-flex items-center gap-2 p-1 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
                  <button
                    onClick={() => setSelectedTrack("beginner")}
                    className={`px-6 py-2 rounded-md font-semibold transition-all duration-300 ${
                      selectedTrack === "beginner"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Beginner Track
                  </button>
                  <button
                    onClick={() => setSelectedTrack("advanced")}
                    className={`px-6 py-2 rounded-md font-semibold transition-all duration-300 ${
                      selectedTrack === "advanced"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Advanced Track
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Shared Sessions (Opening) */}
                {day2Schedule.shared.map((item, index) => (
                  <Card
                    key={`shared-${index}`}
                    className={`backdrop-blur-sm transition-all duration-300 hover:scale-102 ${getTypeColor(
                      item.type
                    )}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex items-center gap-2 text-accent font-bold min-w-[140px]">
                          <Clock className="w-5 h-5" />
                          {item.time}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                          {item.speaker && (
                            <p className="text-accent font-semibold mb-2">
                              {item.speaker}
                            </p>
                          )}
                          <p className="text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Track-Specific Sessions */}
                <div className="py-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full font-bold">
                      <Users className="w-4 h-4" />
                      {selectedTrack === "beginner" ? "Beginner Track" : "Advanced Track"}
                    </span>
                  </div>
                  {day2Schedule[selectedTrack].map((item, index) => (
                    <Card
                      key={`track-${index}`}
                      className={`backdrop-blur-sm transition-all duration-300 hover:scale-102 mb-4 ${getTypeColor(
                        item.type
                      )}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex items-center gap-2 text-accent font-bold min-w-[140px]">
                            <Clock className="w-5 h-5" />
                            {item.time}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                            {item.speaker && (
                              <p className="text-accent font-semibold mb-2">
                                {item.speaker}
                              </p>
                            )}
                            <p className="text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Shared Sessions (Closing) */}
                {day2Schedule.closing.map((item, index) => (
                  <Card
                    key={`closing-${index}`}
                    className={`backdrop-blur-sm transition-all duration-300 hover:scale-102 ${getTypeColor(
                      item.type
                    )}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex items-center gap-2 text-accent font-bold min-w-[140px]">
                          <Clock className="w-5 h-5" />
                          {item.time}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                          {item.speaker && (
                            <p className="text-accent font-semibold mb-2">
                              {item.speaker}
                            </p>
                          )}
                          <p className="text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Note */}
          <Card className="mt-12 bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Note:</strong> Schedule is subject to change. All times are in local UK time (BST).
                Detailed session descriptions and speaker information will be announced closer to the event date.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Schedule;
