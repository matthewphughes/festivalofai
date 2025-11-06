import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Speakers = () => {
  const speakers = [
    {
      name: "Matt Hughes",
      title: "AI Innovation Leader",
      bio: "Leading expert in practical AI implementation for businesses.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    },
    {
      name: "Dr. Sarah Chen",
      title: "Machine Learning Researcher",
      bio: "PhD in AI with focus on real-world business applications.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    },
    {
      name: "James Anderson",
      title: "Tech Entrepreneur",
      bio: "Founder of multiple AI-powered startups and platforms.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    },
    {
      name: "Emily Rodriguez",
      title: "Data Science Expert",
      bio: "Specializing in AI strategy and implementation for enterprises.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    },
    {
      name: "Michael Park",
      title: "AI Product Designer",
      bio: "Creating user-friendly AI interfaces and experiences.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    },
    {
      name: "Lisa Thompson",
      title: "Business AI Consultant",
      bio: "Helping companies transform their operations with AI.",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    },
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
              Our <span className="text-accent">Speakers</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn from world-class AI practitioners, innovators, and thought leaders who are shaping 
              the future of artificial intelligence.
            </p>
          </div>

          {/* Speakers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {speakers.map((speaker, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 hover:scale-105 group"
              >
                <CardContent className="p-6">
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{speaker.name}</h3>
                  <p className="text-accent font-semibold mb-3">{speaker.title}</p>
                  <p className="text-muted-foreground">{speaker.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>

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
