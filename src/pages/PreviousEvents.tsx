import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, MapPin, Award } from "lucide-react";

const PreviousEvents = () => {
  const events = [
    {
      year: "2025",
      date: "October 24th, 2025",
      location: "Leicester, UK",
      attendees: "500+",
      highlights: [
        "Introduced practical AI workshops",
        "Featured 15+ industry speakers",
        "Hands-on tool demonstrations",
        "98% attendee satisfaction rate",
      ],
      testimonials: [
        {
          quote: "That was the most useful day I've ever spent on AI.",
          author: "Sarah M., Tech Entrepreneur",
        },
        {
          quote: "Finally, an AI event that focuses on what really matters - practical application.",
          author: "David K., Business Owner",
        },
      ],
    },
    {
      year: "2024",
      date: "November 15th, 2024",
      location: "Leicester, UK",
      attendees: "350+",
      highlights: [
        "Inaugural Festival of AI event",
        "10 expert speakers",
        "Real-world case studies",
        "Strong community foundation",
      ],
      testimonials: [
        {
          quote: "The first Festival of AI set the standard for practical, actionable AI events.",
          author: "James R., Marketing Director",
        },
      ],
    },
  ];

  const stats = [
    { icon: <Users />, label: "Total Attendees", value: "850+" },
    { icon: <Award />, label: "Speakers", value: "25+" },
    { icon: <Calendar />, label: "Events Held", value: "2" },
    { icon: <MapPin />, label: "Cities", value: "1" },
  ];

  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Previous <span className="text-accent">Events</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A journey through our past festivals and the impact we've made together
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all"
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-accent mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Events Timeline */}
          <div className="space-y-12">
            {events.map((event, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all"
              >
                <CardContent className="p-8 md:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Info */}
                    <div className="lg:col-span-1">
                      <div className="text-5xl font-black text-accent mb-4">{event.year}</div>
                      <div className="space-y-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-accent" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-accent" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-accent" />
                          <span>{event.attendees} Attendees</span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights & Testimonials */}
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-4">Highlights</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {event.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-accent text-xl">✓</span>
                              <span className="text-foreground/80">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold mb-4">What Attendees Said</h3>
                        <div className="space-y-4">
                          {event.testimonials.map((testimonial, idx) => (
                            <Card key={idx} className="bg-muted/50 border-border">
                              <CardContent className="p-4">
                                <p className="italic mb-2">"{testimonial.quote}"</p>
                                <p className="text-sm text-accent font-semibold">
                                  — {testimonial.author}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Looking Forward */}
          <Card className="mt-16 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Looking Forward to 2026</h2>
              <p className="text-xl mb-8 text-foreground/80 max-w-2xl mx-auto">
                Building on our success, Festival of AI 2026 will be our biggest and best event yet. 
                Join us on October 16th, 2026 at the National Space Center!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PreviousEvents;
