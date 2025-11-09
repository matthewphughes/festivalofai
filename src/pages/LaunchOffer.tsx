import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import CountdownTimer from "@/components/CountdownTimer";
import VideoTestimonialCard from "@/components/VideoTestimonialCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  Shield, 
  Users, 
  Sparkles, 
  MapPin, 
  Calendar,
  Gift,
  Star,
  Rocket
} from "lucide-react";
import { trackButtonClick, trackPageView } from "@/lib/analytics";

import venueExterior from "@/assets/venue-exterior.jpg";
import venueRockets from "@/assets/venue-rockets.jpg";
import venuePlanetarium from "@/assets/venue-planetarium.jpg";
import venueEventSpace from "@/assets/venue-event-space.jpg";

interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  image_url: string;
  years: number[];
}

const LaunchOffer = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Countdown to offer end (example: 7 days from now)
  const offerEndDate = new Date();
  offerEndDate.setDate(offerEndDate.getDate() + 7);

  useEffect(() => {
    trackPageView('/launch-offer');
    fetchSpeakers();
  }, []);

  const fetchSpeakers = async () => {
    try {
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .contains("years", [2024])
        .order("display_order", { ascending: true })
        .limit(8);

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error("Error fetching speakers:", error);
    } finally {
      setLoading(false);
    }
  };

  const videoTestimonials = [
    {
      quote: "That was the most useful day I've ever spent on AI.",
      author: "Sarah M., Tech Entrepreneur",
      year: "2025"
    },
    {
      quote: "Finally, an AI event that focuses on what really matters - practical application.",
      author: "David K., Business Owner",
      year: "2025"
    },
    {
      quote: "The first Festival of AI set the standard for practical, actionable AI events.",
      author: "James R., Marketing Director",
      year: "2024"
    },
    {
      quote: "Incredible networking opportunities and insights I can actually use.",
      author: "Emma L., Product Manager",
      year: "2025"
    },
    {
      quote: "Best investment in my AI education. The speakers were world-class.",
      author: "Michael T., Developer",
      year: "2024"
    },
    {
      quote: "I left with actionable strategies that I implemented the very next week.",
      author: "Rachel S., Marketing Lead",
      year: "2025"
    }
  ];

  const benefits = [
    "Access to all keynote sessions and workshops",
    "Lifetime access to session replays",
    "Exclusive networking opportunities with 500+ attendees",
    "Hands-on AI tool demonstrations",
    "Lunch, refreshments, and evening reception",
    "Certificate of attendance",
    "Free parking at the National Space Centre",
    "Early access to 2027 tickets"
  ];

  const venueFeatures = [
    { icon: <Rocket className="w-6 h-6" />, text: "UK's Largest Space Attraction" },
    { icon: <Users className="w-6 h-6" />, text: "State-of-the-art Conference Facilities" },
    { icon: <Sparkles className="w-6 h-6" />, text: "Immersive Learning Environment" },
    { icon: <MapPin className="w-6 h-6" />, text: "Free On-site Parking" }
  ];

  const handleCtaClick = (location: string) => {
    trackButtonClick('Get Early Bird Ticket', location);
  };

  return (
    <div className="min-h-screen relative">
      <Helmet>
        <title>Launch Offer - Festival of AI 2026 | Limited Early Bird Tickets</title>
        <meta name="description" content="Don't miss out on Festival of AI 2026! Limited early bird tickets available. Join 500+ AI innovators at the National Space Centre, Leicester." />
      </Helmet>
      
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          
          {/* Hero Section */}
          <section className="text-center mb-20">
            <Badge variant="secondary" className="mb-6 bg-accent/20 text-accent border-accent/50 text-lg px-6 py-2">
              <Gift className="w-5 h-5 mr-2 inline" />
              Limited Time Launch Offer
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              Don't Miss Out: <br />
              <span className="text-accent">Festival of AI 2026</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join 500+ AI innovators at the UK's most inspiring venue. Limited early bird tickets available!
            </p>

            <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
              <div className="flex items-center gap-2 text-foreground/80">
                <Calendar className="w-5 h-5 text-accent" />
                <span className="font-semibold">October 16th, 2026</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-semibold">National Space Centre, Leicester</span>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="mb-10">
              <p className="text-lg text-accent font-semibold mb-4">Early Bird Offer Ends In:</p>
              <CountdownTimer targetDate={offerEndDate} />
            </div>

            {/* Primary CTA */}
            <Button 
              asChild 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-xl px-10 py-7 h-auto mb-4"
              onClick={() => handleCtaClick('hero')}
            >
              <Link to="/tickets">
                Claim Your Early Bird Ticket Now
              </Link>
            </Button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mt-6 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent fill-accent" />
                <span className="text-foreground/70">500+ Attended 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span className="text-foreground/70">98% Satisfaction Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-foreground/70">Money-Back Guarantee</span>
              </div>
            </div>
          </section>

          {/* Video Testimonials Section */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Don't Just Take <span className="text-accent">Our Word</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Hear from past attendees about their transformative experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTestimonials.map((testimonial, index) => (
                <VideoTestimonialCard
                  key={index}
                  quote={testimonial.quote}
                  author={testimonial.author}
                  year={testimonial.year}
                />
              ))}
            </div>
          </section>

          {/* Past Speakers Showcase */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Learn from <span className="text-accent">the Best</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Previous speakers from 2024-2025 who've shared their expertise
              </p>
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground">Loading speakers...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {speakers.map((speaker) => (
                  <Card 
                    key={speaker.id} 
                    className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all group overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square overflow-hidden bg-muted/30">
                        <img 
                          src={speaker.image_url || "/placeholder.svg"} 
                          alt={speaker.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{speaker.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{speaker.title}</p>
                        <p className="text-xs text-accent font-semibold">{speaker.company}</p>
                        <div className="mt-3">
                          {speaker.years.map((year) => (
                            <Badge key={year} variant="outline" className="mr-1 text-xs">
                              {year}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center">
              <p className="text-lg text-accent font-semibold">
                And many more world-class speakers confirmed for 2026! 🚀
              </p>
            </div>
          </section>

          {/* Value Stack Section */}
          <section className="mb-24">
            <Card className="bg-gradient-to-br from-primary/20 via-card/50 to-secondary/20 backdrop-blur-sm border-primary">
              <CardContent className="p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                      What You <span className="text-accent">Get</span>
                    </h2>
                    <ul className="space-y-4">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-lg">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-center lg:text-left">
                    <div className="inline-block bg-background/90 backdrop-blur-sm rounded-lg p-8 mb-6">
                      <div className="text-muted-foreground line-through text-2xl mb-2">
                        Regular Price: £299
                      </div>
                      <div className="text-5xl md:text-6xl font-black text-accent mb-2">
                        £199
                      </div>
                      <div className="text-lg text-foreground/80">
                        Early Bird Price
                      </div>
                      <div className="text-sm text-accent font-semibold mt-2">
                        Save £100 - Limited Time Only!
                      </div>
                    </div>
                    
                    <Button 
                      asChild 
                      size="lg" 
                      className="bg-accent text-accent-foreground hover:bg-accent/90 text-xl px-8 py-6 h-auto w-full lg:w-auto"
                      onClick={() => handleCtaClick('value-stack')}
                    >
                      <Link to="/tickets">
                        Secure Your Ticket Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Venue Section */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                An Inspiring <span className="text-accent">Location</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Experience the future of AI at the UK's premier space attraction
              </p>
            </div>

            {/* Hero Venue Image */}
            <div className="mb-8 rounded-lg overflow-hidden">
              <img 
                src={venueExterior} 
                alt="National Space Centre Exterior"
                className="w-full h-[400px] object-cover"
              />
            </div>

            {/* Venue Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={venueRockets} 
                  alt="Rockets Display"
                  className="w-full h-64 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={venuePlanetarium} 
                  alt="Planetarium"
                  className="w-full h-64 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={venueEventSpace} 
                  alt="Event Space"
                  className="w-full h-64 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Venue Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {venueFeatures.map((feature, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 text-accent mb-3">
                      {feature.icon}
                    </div>
                    <p className="font-semibold">{feature.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Risk Reversal Section */}
          <section className="mb-24">
            <Card className="bg-card/50 backdrop-blur-sm border-accent/50">
              <CardContent className="p-8 md:p-12 text-center">
                <Shield className="w-16 h-16 text-accent mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Risk-Free <span className="text-accent">Guarantee</span>
                </h2>
                <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-4">
                  Full refund before June 30th, 2026. No questions asked.
                </p>
                <p className="text-lg text-muted-foreground">
                  Transfer your ticket anytime, free of charge. Your satisfaction is guaranteed.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Final CTA Section */}
          <section className="text-center">
            <Card className="bg-gradient-to-r from-primary/30 to-secondary/30 backdrop-blur-sm border-primary">
              <CardContent className="p-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Join 500+ AI Innovators <span className="text-accent">in 2026</span>
                </h2>
                
                <ul className="max-w-2xl mx-auto mb-8 space-y-2 text-left">
                  <li className="flex items-center gap-3 text-lg">
                    <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
                    World-class speakers and cutting-edge insights
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
                    Hands-on workshops and practical AI applications
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
                    Exclusive networking with industry leaders
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
                    Lifetime access to all session replays
                  </li>
                </ul>

                <Button 
                  asChild 
                  size="lg" 
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-2xl px-12 py-8 h-auto mb-6"
                  onClick={() => handleCtaClick('final')}
                >
                  <Link to="/tickets">
                    Get Your Early Bird Ticket - Save £100
                  </Link>
                </Button>

                <div className="text-sm text-muted-foreground">
                  Questions? <Link to="/contact" className="text-accent hover:underline">Contact us</Link>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LaunchOffer;
