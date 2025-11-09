import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, Calendar } from "lucide-react";

const Schedule = () => {
  const [selectedDay, setSelectedDay] = useState<"day1" | "day2">("day2");

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
    opening: [
      {
        time: "08:00 - 09:00",
        title: "Registration & Breakfast",
        description: "Check in, grab breakfast, and network with fellow attendees",
        type: "break",
      },
      {
        time: "09:00 - 09:45",
        title: "Opening Keynote",
        description: "Session details coming soon",
        speaker: "Speaker TBC",
        type: "keynote",
      },
    ],
    tracks: [
      {
        time: "09:45 - 10:30",
        beginner: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
        advanced: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
      },
      {
        time: "10:30 - 11:00",
        shared: {
          title: "Coffee Break",
          description: "Network and recharge",
          type: "break",
        },
      },
      {
        time: "11:00 - 11:45",
        beginner: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
        advanced: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
      },
      {
        time: "11:45 - 12:30",
        beginner: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
        advanced: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
      },
      {
        time: "12:30 - 13:30",
        shared: {
          title: "Lunch & Networking",
          description: "Enjoy lunch while connecting with speakers and attendees",
          type: "break",
        },
      },
      {
        time: "13:30 - 14:15",
        beginner: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
        advanced: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
      },
      {
        time: "14:15 - 15:00",
        beginner: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
        advanced: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
      },
      {
        time: "15:00 - 15:30",
        shared: {
          title: "Afternoon Break",
          description: "Refreshments and networking",
          type: "break",
        },
      },
      {
        time: "15:30 - 16:15",
        beginner: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
        advanced: {
          title: "Session Title TBC",
          description: "Session details coming soon",
          speaker: "Speaker TBC",
        },
      },
    ],
    closing: [
      {
        time: "16:15 - 17:00",
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

      <main className="pt-24 md:pt-32 pb-12 md:pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              Event <span className="text-accent">Schedule</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              October 15-16th, 2026 | National Space Centre, Leicester
            </p>
          </div>

          {/* Day Selector */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex gap-4 p-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
              <button
                onClick={() => setSelectedDay("day1")}
                className={`flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 ${
                  selectedDay === "day1"
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm opacity-80">Day 1</div>
                  <div>Workshops</div>
                </div>
              </button>
              <button
                onClick={() => setSelectedDay("day2")}
                className={`flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 ${
                  selectedDay === "day2"
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm opacity-80">Day 2</div>
                  <div>Conference</div>
                </div>
              </button>
            </div>
          </div>

          {/* Day 1 - Workshops */}
          {selectedDay === "day1" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">
                  Workshop Day - <span className="text-accent">October 15th, 2026</span>
                </h2>
                <p className="text-muted-foreground">
                  Choose your track: Beginner or Advanced
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {day1Workshops.map((workshop, index) => (
                  <Card
                    key={index}
                    className="backdrop-blur-sm border-primary bg-primary/10 hover:scale-102 transition-all duration-300"
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
            </div>
          )}

          {/* Day 2 - Conference */}
          {selectedDay === "day2" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">
                  Conference Day - <span className="text-accent">October 16th, 2026</span>
                </h2>
                <p className="text-muted-foreground">
                  Dual track sessions with shared keynotes and networking
                </p>
              </div>

              {/* Opening Sessions (Full Width) */}
              {day2Schedule.opening.map((item, index) => (
                <Card
                  key={`opening-${index}`}
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

              {/* Track Sessions */}
              {day2Schedule.tracks.map((timeSlot, index) => (
                <div key={`slot-${index}`}>
                  {timeSlot.shared ? (
                    // Full Width Shared Session (Breaks)
                    <Card
                      className={`backdrop-blur-sm transition-all duration-300 hover:scale-102 ${getTypeColor(
                        timeSlot.shared.type
                      )}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex items-center gap-2 text-accent font-bold min-w-[140px]">
                            <Clock className="w-5 h-5" />
                            {timeSlot.time}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">{timeSlot.shared.title}</h3>
                            <p className="text-muted-foreground">{timeSlot.shared.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Side-by-side Track Sessions
                    <div>
                      <div className="flex items-center gap-2 text-accent font-bold mb-3 px-2">
                        <Clock className="w-5 h-5" />
                        {timeSlot.time}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Beginner Track */}
                        <Card className="backdrop-blur-sm border-border bg-card/50 hover:scale-102 transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                                <Users className="w-4 h-4" />
                                Beginner Track
                              </span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{timeSlot.beginner.title}</h3>
                            <p className="text-accent font-semibold mb-2">
                              {timeSlot.beginner.speaker}
                            </p>
                            <p className="text-muted-foreground">{timeSlot.beginner.description}</p>
                          </CardContent>
                        </Card>

                        {/* Advanced Track */}
                        <Card className="backdrop-blur-sm border-secondary bg-secondary/20 hover:scale-102 transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <span className="inline-flex items-center gap-2 text-sm font-bold text-secondary">
                                <Users className="w-4 h-4" />
                                Advanced Track
                              </span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{timeSlot.advanced.title}</h3>
                            <p className="text-accent font-semibold mb-2">
                              {timeSlot.advanced.speaker}
                            </p>
                            <p className="text-muted-foreground">{timeSlot.advanced.description}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Closing Sessions (Full Width) */}
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
          )}

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
