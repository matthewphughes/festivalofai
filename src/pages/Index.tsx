import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import spaceBg from "@/assets/space-bg.jpg";
import eventSpeaker1 from "@/assets/event-speaker-1.jpg";
import eventSpeaker3 from "@/assets/event-speaker-3.jpg";
import eventAudience1 from "@/assets/event-audience-1.jpg";
import eventNetworking1 from "@/assets/event-networking-1.jpg";
import { Calendar, MapPin, Users, Lightbulb, Rocket, Zap, Play } from "lucide-react";

const Index = () => {
  const highlights = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "World-Class Speakers",
      description: "Learn from AI leaders and innovators shaping the future of technology and business.",
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Practical Insights",
      description: "Real-world strategies and tactical walkthroughs you can implement immediately.",
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Network & Collaborate",
      description: "Connect with fellow innovators, entrepreneurs, and AI enthusiasts.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Hands-On Workshops",
      description: "Interactive sessions to get you started with AI tools and technologies.",
    },
  ];

  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${spaceBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-background/40" />
        <div className="container mx-auto px-4 relative z-10 text-center py-32">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FESTIVAL OF AI
            </span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 text-xl md:text-2xl font-semibold">
            <div className="flex items-center gap-2">
              <Calendar className="text-accent" />
              <span>October 16th, 2026</span>
            </div>
            <div className="hidden md:block text-accent">|</div>
            <div className="flex items-center gap-2">
              <MapPin className="text-accent" />
              <span>National Space Center, Leicester UK</span>
            </div>
          </div>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-foreground/90">
            Discover practical AI that actually moves the needle for your business
          </p>
          
          {/* Video Highlights from Last Year */}
          <div className="mb-12 max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-accent/50 shadow-2xl bg-background/20 backdrop-blur-sm group cursor-pointer hover:border-accent transition-all duration-300">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/90 text-accent-foreground mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-10 h-10 ml-1" />
                  </div>
                  <p className="text-xl font-semibold">2025 Festival Highlights</p>
                  <p className="text-sm text-muted-foreground mt-2">Click to watch the video</p>
                </div>
              </div>
              {/* Placeholder - replace with actual video embed when URL is provided */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 animate-pulse-glow"
            >
              <Link to="/tickets">Get Your 2026 Ticket</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Attend Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Why Attend <span className="text-accent">Festival of AI?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((highlight, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                    {highlight.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{highlight.title}</h3>
                  <p className="text-muted-foreground">{highlight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="py-20 relative z-10 bg-background/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Experience <span className="text-accent">Festival of AI</span>
          </h2>
          <p className="text-xl text-center mb-12 text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of innovators, entrepreneurs, and AI enthusiasts at the UK's premier AI event
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-lg aspect-video group">
              <img 
                src={eventSpeaker1} 
                alt="Speaker presenting at Festival of AI" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="relative overflow-hidden rounded-lg aspect-video group">
              <img 
                src={eventAudience1} 
                alt="Engaged audience at Festival of AI" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="relative overflow-hidden rounded-lg aspect-video group">
              <img 
                src={eventNetworking1} 
                alt="Networking at Festival of AI" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="relative overflow-hidden rounded-lg aspect-video group">
              <img 
                src={eventSpeaker3} 
                alt="Industry experts sharing insights at Festival of AI" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Business with AI?
              </h2>
              <p className="text-xl mb-8 text-foreground/80 max-w-2xl mx-auto">
                Join us on October 16th, 2026 at the National Space Center in Leicester for a day of 
                practical AI insights, networking, and innovation.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6"
              >
                <Link to="/tickets">Secure Your Spot Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
