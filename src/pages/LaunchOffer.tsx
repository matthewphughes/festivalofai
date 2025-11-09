import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
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
  Rocket,
  Loader2
} from "lucide-react";
import { trackButtonClick, trackPageView } from "@/lib/analytics";
import { toast } from "sonner";

import logoWhite from "@/assets/logo-white.png";
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
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  
  // Countdown to Friday at 5PM
  const getNextFriday5PM = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + (daysUntilFriday || 7));
    nextFriday.setHours(17, 0, 0, 0);
    return nextFriday;
  };
  
  const offerEndDate = getNextFriday5PM();

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

  const ticketTypes = [
    {
      name: "Standard Early Bird",
      priceId: "price_1SRXFSEFw97UKMysqEKXSBiL", // FAI26 - Festival of AI 2026
      price: "£199",
      regularPrice: "£299",
      savings: "£100",
      features: [
        "Access to all keynote sessions",
        "Lifetime access to session replays",
        "Networking opportunities",
        "Lunch and refreshments",
        "Certificate of attendance",
        "Free parking"
      ]
    },
    {
      name: "Workshop Early Bird",
      priceId: "price_1SRXEKEFw97UKMysbZfR0Frk", // FAI26 - Festival of AI 2026 + Workshop
      price: "£299",
      regularPrice: "£399",
      savings: "£100",
      popular: true,
      features: [
        "Everything in Standard",
        "Exclusive hands-on workshops",
        "Masterclasses with experts",
        "Advanced AI tool demonstrations",
        "Priority seating",
        "Workshop materials & resources"
      ]
    }
  ];

  const handleTicketPurchase = async (priceId: string, ticketName: string) => {
    setCheckoutLoading(priceId);
    trackButtonClick(`Purchase ${ticketName}`, 'launch-offer');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Helmet>
        <title>Launch Offer - Festival of AI 2026 | Limited Early Bird Tickets</title>
        <meta name="description" content="Don't miss out on Festival of AI 2026! Limited early bird tickets available. Join 500+ AI innovators at the National Space Centre, Leicester." />
      </Helmet>
      
      <StarField />
      
      {/* Simple centered header with logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-6 flex justify-center">
          <Link to="/">
            <img 
              src={logoWhite} 
              alt="Festival of AI" 
              className="h-12 md:h-16 w-auto transition-transform hover:scale-105" 
            />
          </Link>
        </div>
      </header>

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
              Join 200+ AI innovators at the UK's most inspiring venue. Limited super early bird tickets available!
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
              <p className="text-lg text-accent font-semibold mb-4">Super Early Bird Offer Ends:</p>
              <p className="text-2xl font-bold mb-4">Friday at 5PM</p>
              <CountdownTimer targetDate={offerEndDate} />
            </div>

            {/* Ticket Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
              {ticketTypes.map((ticket) => (
                <Card 
                  key={ticket.priceId} 
                  className={`bg-card/50 backdrop-blur-sm ${ticket.popular ? 'border-accent shadow-lg shadow-accent/20' : 'border-border'} hover:border-primary transition-all relative`}
                >
                  {ticket.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-accent-foreground font-bold">
                        MOST POPULAR
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-4">{ticket.name}</h3>
                    <div className="mb-4">
                      <div className="text-muted-foreground line-through text-lg mb-1">
                        {ticket.regularPrice}
                      </div>
                      <div className="text-4xl font-black text-accent mb-1">
                        {ticket.price}
                      </div>
                      <div className="text-sm text-accent font-semibold">
                        Save {ticket.savings}
                      </div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {ticket.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      size="lg" 
                      className={`w-full ${ticket.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'}`}
                      onClick={() => handleTicketPurchase(ticket.priceId, ticket.name)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === ticket.priceId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Get ${ticket.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

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
                  <div className="space-y-4">
                      <p className="text-xl font-semibold text-accent mb-4">Choose Your Ticket:</p>
                      {ticketTypes.map((ticket) => (
                        <div key={ticket.priceId} className="bg-background/90 backdrop-blur-sm rounded-lg p-6">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold">{ticket.name}</h3>
                            {ticket.popular && (
                              <Badge className="bg-accent text-accent-foreground">Popular</Badge>
                            )}
                          </div>
                          <div className="flex items-baseline gap-3 mb-3">
                            <span className="text-3xl font-black text-accent">{ticket.price}</span>
                            <span className="text-muted-foreground line-through">{ticket.regularPrice}</span>
                            <span className="text-sm text-accent font-semibold">Save {ticket.savings}</span>
                          </div>
                          <Button 
                            size="lg" 
                            className={`w-full ${ticket.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'}`}
                            onClick={() => handleTicketPurchase(ticket.priceId, ticket.name)}
                            disabled={checkoutLoading !== null}
                          >
                            {checkoutLoading === ticket.priceId ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              `Get ${ticket.name}`
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
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
                  Join 200+ AI Innovators <span className="text-accent">in 2026</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-6">
                  {ticketTypes.map((ticket) => (
                    <Button 
                      key={ticket.priceId}
                      size="lg" 
                      className={`${ticket.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-xl px-8 py-6 h-auto`}
                      onClick={() => handleTicketPurchase(ticket.priceId, ticket.name)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === ticket.priceId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {ticket.name} - {ticket.price}
                          <span className="ml-2 text-sm opacity-90">(Save {ticket.savings})</span>
                        </>
                      )}
                    </Button>
                  ))}
                </div>

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
