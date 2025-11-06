import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

const Schedule = () => {
  const schedule = [
    {
      time: "08:00 - 09:00",
      title: "Registration & Breakfast",
      description: "Check in, grab breakfast, and network with fellow attendees",
      type: "break",
    },
    {
      time: "09:00 - 09:30",
      title: "Opening Keynote",
      description: "Welcome to Festival of AI - Setting the stage for the day",
      speaker: "Matt Hughes",
      type: "keynote",
    },
    {
      time: "09:30 - 10:30",
      title: "Introduction to AI for Business",
      description: "A friendly, comprehensive overview to ensure everyone's on the same page",
      speaker: "Dr. Sarah Chen",
      type: "session",
    },
    {
      time: "10:30 - 11:00",
      title: "Coffee Break",
      description: "Network and recharge",
      type: "break",
    },
    {
      time: "11:00 - 12:00",
      title: "Real-World AI Implementation",
      description: "Case studies and practical strategies from successful businesses",
      speaker: "James Anderson",
      type: "session",
    },
    {
      time: "12:00 - 13:00",
      title: "Lunch & Networking",
      description: "Enjoy lunch while connecting with speakers and attendees",
      type: "break",
    },
    {
      time: "13:00 - 14:00",
      title: "Hands-On Workshop: AI Tools",
      description: "Interactive session with popular AI platforms you can use immediately",
      speaker: "Emily Rodriguez",
      type: "workshop",
    },
    {
      time: "14:00 - 15:00",
      title: "AI Strategy & Integration",
      description: "How to successfully integrate AI into your existing workflows",
      speaker: "Lisa Thompson",
      type: "session",
    },
    {
      time: "15:00 - 15:30",
      title: "Afternoon Break",
      description: "Refreshments and networking",
      type: "break",
    },
    {
      time: "15:30 - 16:30",
      title: "Future of AI Panel Discussion",
      description: "Industry leaders discuss upcoming trends and opportunities",
      speaker: "All Speakers",
      type: "panel",
    },
    {
      time: "16:30 - 17:00",
      title: "Closing Remarks & Q&A",
      description: "Final thoughts and open questions with our speakers",
      type: "closing",
    },
    {
      time: "17:00 - 18:00",
      title: "Networking Reception",
      description: "Continue conversations and build connections",
      type: "break",
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "keynote":
        return "border-accent bg-accent/10";
      case "workshop":
        return "border-primary bg-primary/10";
      case "panel":
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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Event <span className="text-accent">Schedule</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              October 16th, 2026 | National Space Center, Leicester
            </p>
          </div>

          {/* Schedule Timeline */}
          <div className="space-y-4">
            {schedule.map((item, index) => (
              <Card
                key={index}
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

          {/* Note */}
          <Card className="mt-12 bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Note:</strong> Schedule is subject to change. All times are in local UK time (BST).
                Detailed session descriptions and additional workshop information will be provided closer to the event date.
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
