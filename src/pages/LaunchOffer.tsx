import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import MinimalFooter from "@/components/MinimalFooter";
import DiscountBanner from "@/components/DiscountBanner";
import StarField from "@/components/StarField";
import CountdownTimer from "@/components/CountdownTimer";
import VideoTestimonialCard from "@/components/VideoTestimonialCard";
import FAQItem from "@/components/FAQItem";
import { ImageLightbox } from "@/components/ImageLightbox";
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
  Loader2,
  Clock,
  AlertCircle,
  CreditCard,
  Lock
} from "lucide-react";
import { trackButtonClick, trackPageView } from "@/lib/analytics";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

import logoWhite from "@/assets/logo-white.png";
import venueExterior from "@/assets/venue-exterior.jpg";
import venueRockets from "@/assets/venue-rockets.jpg";
import venuePlanetarium from "@/assets/venue-planetarium.jpg";
import venueEventSpace from "@/assets/venue-event-space.jpg";
import eventAtmosphere from "@/assets/event-atmosphere-1.jpg";
import eventAudience1 from "@/assets/event-audience-1.jpg";
import eventAudience2 from "@/assets/event-audience-2.jpg";
import eventNetworking1 from "@/assets/event-networking-1.jpg";
import eventNetworking2 from "@/assets/event-networking-2.jpg";
import eventSpeaker1 from "@/assets/event-speaker-1.jpg";
import eventSpeaker2 from "@/assets/event-speaker-2.jpg";
import eventSpeaker3 from "@/assets/event-speaker-3.jpg";
import event2025_101 from "@/assets/event-2025-101.jpg";
import event2025_115 from "@/assets/event-2025-115.jpg";
import event2025_125 from "@/assets/event-2025-125.jpg";
import event2025_189 from "@/assets/event-2025-189.jpg";
import event2025_194 from "@/assets/event-2025-194.jpg";
import event2025_202 from "@/assets/event-2025-202.jpg";
import event2025_204 from "@/assets/event-2025-204.jpg";
import event2025_210 from "@/assets/event-2025-210.jpg";
import event2025_213 from "@/assets/event-2025-213.jpg";

interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  image_url: string;
  years: number[];
}

const LaunchOffer = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbTestimonials, setDbTestimonials] = useState<any[]>([]);
  
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
    fetchProducts();
    checkAdminStatus();
    fetchTestimonials();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("stripe_products")
      .select("*")
      .eq("active", true)
      .eq("product_type", "ticket")
      .eq("event_year", 2026);

    if (error) {
      console.error("Failed to load products", error);
    } else {
      setProducts(data || []);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setDbTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
  };

  const fetchSpeakers = async () => {
    try {
      // Fetch the specific speakers by name
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .in("name", ["Heather Murray", "Rick Dubidat", "Matthew Hughes", "Laura Goodsell"])
        .order("name", { ascending: true });

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
    "Choose your path: Beginner or Advanced stage",
    "Two simultaneous stages with curated content for your level",
    "Access to all keynote sessions",
    "Lifetime access to session replays from both stages",
    "Exclusive networking opportunities with 200+ attendees",
    "Hands-on AI tool demonstrations",
    "Lunch, refreshments, and evening reception",
    "Free parking at the National Space Centre",
    "Early access to 2027 tickets"
  ];

  const galleryImages = [
    { src: event2025_101, alt: "Speaker presenting at Festival of AI 2025", aspectRatio: "aspect-[3/4]" },
    { src: eventNetworking1, alt: "Networking at Festival of AI 2025", aspectRatio: "aspect-square" },
    { src: event2025_194, alt: "Workshop session at Festival of AI 2025", aspectRatio: "aspect-[3/4]" },
    { src: eventAudience1, alt: "Engaged audience at Festival of AI 2025", aspectRatio: "aspect-square" },
    { src: event2025_115, alt: "Festival of AI 2025 atmosphere", aspectRatio: "aspect-[3/4]" },
    { src: event2025_202, alt: "Interactive demo at Festival of AI 2025", aspectRatio: "aspect-square" },
    { src: eventSpeaker2, alt: "Keynote speaker at Festival of AI 2025", aspectRatio: "aspect-[3/4]" },
    { src: event2025_125, alt: "Panel discussion at Festival of AI 2025", aspectRatio: "aspect-square" },
    { src: event2025_204, alt: "Networking break at Festival of AI 2025", aspectRatio: "aspect-[4/3]" },
    { src: eventNetworking2, alt: "Professional networking at Festival of AI 2025", aspectRatio: "aspect-square" },
    { src: event2025_189, alt: "Expert session at Festival of AI 2025", aspectRatio: "aspect-[3/4]" },
    { src: event2025_210, alt: "Audience engagement at Festival of AI 2025", aspectRatio: "aspect-square" },
    { src: eventSpeaker3, alt: "Technical presentation at Festival of AI 2025", aspectRatio: "aspect-[3/4]" },
    { src: event2025_213, alt: "Collaborative learning at Festival of AI 2025", aspectRatio: "aspect-square" },
    { src: eventAtmosphere, alt: "Festival of AI 2025 venue", aspectRatio: "aspect-[4/3]" }
  ];

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const faqs = [
    {
      question: "What's your refund policy?",
      answer: "We offer a full refund up until June 30th, 2026. No questions asked. After that date, tickets are non-refundable but can be transferred to another person free of charge."
    },
    {
      question: "Can I transfer my ticket to someone else?",
      answer: "Absolutely! You can transfer your ticket to anyone at any time, completely free of charge. Just email us the details of the new attendee and we'll update our records."
    },
    {
      question: "Is this event suitable for beginners?",
      answer: "Absolutely! In 2026, we're running two simultaneous stages - a Beginner Stage and an Advanced Stage. You can choose which stage to attend based on your skill level. Both stages run throughout the day on October 16th, and if you have a workshop ticket, you can also choose between beginner or advanced workshops on October 15th. Everyone finds value regardless of their AI experience!"
    },
    {
      question: "What makes this different from other AI conferences?",
      answer: "Unlike theory-heavy conferences, Festival of AI focuses on practical, actionable insights you can implement immediately. Plus, we're at the National Space Centre - an inspiring venue that enhances the forward-thinking atmosphere."
    },
    {
      question: "Will session recordings be available?",
      answer: "Yes! All ticket holders get lifetime access to session replays. You'll be able to rewatch any session and share access with your team."
    },
    {
      question: "What's included in the Workshop ticket vs Standard?",
      answer: "Workshop tickets include a second full day (October 15th, 2026) dedicated to hands-on workshops. On both days you can choose your track: Beginner or Advanced. October 15th offers workshop tracks, and October 16th features two simultaneous stages. You'll get everything in the Standard ticket plus an exclusive workshop day with expert-led sessions, advanced tool demonstrations, priority seating, and all workshop materials."
    },
    {
      question: "Is there parking available?",
      answer: "Yes, the National Space Centre offers free on-site parking for all attendees. The venue is also easily accessible by public transport."
    },
    {
      question: "When will the 2026 speaker lineup be announced?",
      answer: "We'll be announcing speakers throughout spring 2026. Early bird ticket holders will get exclusive first access to speaker announcements and session details."
    }
  ];

  const venueFeatures = [
    { icon: <Rocket className="w-6 h-6" />, text: "UK's Largest Space Attraction" },
    { icon: <Users className="w-6 h-6" />, text: "State-of-the-art Conference Facilities" },
    { icon: <Sparkles className="w-6 h-6" />, text: "Immersive Learning Environment" },
    { icon: <MapPin className="w-6 h-6" />, text: "Free On-site Parking" }
  ];

  const ticketTypes = [
    {
      name: "Festival of AI 2026",
      date: "October 16th, 2026",
      stripe_product_id: "prod_TOJtOyxypO8VCB",
      price: "£197",
      regularPrice: "£497",
      savings: "£300",
      discount: "60%",
      features: [
        "Access all sessions",
        "Beginner Stage OR Advanced Stage sessions",
        "All sessions Recorded",
        "Networking reception",
        "Gift bag",
        "Workbook",
        "12 months access to Practical AI"
      ]
    },
    {
      name: "Festival of AI 2026 + Workshop",
      date: "October 15th-16th, 2026",
      stripe_product_id: "prod_TOJs4TpP9zprD9",
      price: "£297",
      regularPrice: "£697",
      savings: "£400",
      discount: "57%",
      popular: true,
      features: [
        "Additional Workshop Day Oct 15th",
        "Access all sessions",
        "Beginner Stage OR Advanced Stage sessions",
        "All sessions Recorded",
        "Networking reception",
        "Gift bag",
        "Workbook",
        "12 months access to Practical AI"
      ]
    }
  ];

  const handleTicketPurchase = async (stripeProductId: string, ticketName: string) => {
    setCheckoutLoading(stripeProductId);
    trackButtonClick(`Purchase ${ticketName}`, 'launch-offer');
    
    try {
      const product = products.find(p => p.stripe_product_id === stripeProductId);

      if (!product) {
        console.error("Product not found. Looking for:", stripeProductId, "Available products:", products);
        toast.error("This ticket is not available yet. Please contact support.");
        setCheckoutLoading(null);
        return;
      }

      // Add to cart and navigate to checkout
      await addToCart(product.id);
      navigate("/checkout");
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Helmet>
        <title>Launch Offer - Festival of AI 2026 | Limited Early Bird Tickets</title>
        <meta name="description" content="Don't miss out on Festival of AI 2026! Limited early bird tickets available. Join 200+ AI innovators at the National Space Centre, Leicester." />
      </Helmet>
      
      <StarField />
      
      {/* Simple centered header with logo - improved for mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center py-3 sm:py-4">
            <Link to="/" className="flex-shrink-0">
              <img 
                src={logoWhite} 
                alt="Festival of AI" 
                className="h-10 sm:h-12 md:h-14 w-auto transition-transform hover:scale-105" 
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          
          {/* Hero Section */}
          <section className="text-center mb-16 sm:mb-20">
            <Badge variant="secondary" className="mb-4 sm:mb-6 bg-accent/20 text-accent border-accent/50 text-sm sm:text-base md:text-lg px-4 sm:px-6 py-1.5 sm:py-2">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
              Limited Time Launch Offer
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 px-4">
              Don't Miss Out: <br className="hidden sm:block" />
              <span className="text-accent">Festival of AI 2026</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Join 200+ AI innovators at the UK's most inspiring venue. Limited super early bird tickets available!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-10 px-4">
              <div className="flex items-center gap-2 text-sm sm:text-base text-foreground/80">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="font-semibold">October 16th, 2026</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base text-foreground/80">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="font-semibold">National Space Centre, Leicester</span>
              </div>
            </div>

            {/* Scarcity Indicator */}
            <div className="mb-6 sm:mb-8">
              <Card className="inline-block bg-destructive/10 border-destructive/50 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-bold text-sm sm:text-base">22 Super Early Bird Tickets remaining!</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Countdown Timer */}
            <div className="mb-8 sm:mb-10 px-4">
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                <p className="text-base sm:text-lg text-accent font-semibold">Super Early Bird Offer Ends:</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Friday at 5PM</p>
              <div className="max-w-2xl mx-auto">
                <CountdownTimer targetDate={offerEndDate} />
              </div>
            </div>

            {/* Ticket Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 max-w-5xl mx-auto mb-6 sm:mb-8 px-4">
              {ticketTypes.map((ticket) => (
                <Card 
                  key={ticket.stripe_product_id} 
                  className={`bg-card/50 backdrop-blur-sm ${ticket.popular ? 'border-accent shadow-lg shadow-accent/20 scale-105 md:scale-110' : 'border-border'} hover:border-primary transition-all relative`}
                >
                  {ticket.popular && (
                    <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-accent text-accent-foreground font-bold text-xs sm:text-sm px-3 py-1">
                        MOST POPULAR
                      </Badge>
                    </div>
                  )}
                   <CardContent className="p-4 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{ticket.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 p-3 bg-accent/10 rounded-lg border border-accent/30">
                      <Calendar className="w-5 h-5 text-accent" />
                      <span className="font-bold text-base sm:text-lg text-accent">{ticket.date}</span>
                    </div>
                    <div className="mb-3 sm:mb-4">
                      <div className="text-muted-foreground line-through text-base sm:text-lg mb-1">
                        {ticket.regularPrice}
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-accent mb-1">
                        {ticket.price}
                      </div>
                      <div className="text-xs sm:text-sm text-accent font-semibold flex items-center gap-1">
                        <span>Save {ticket.savings}</span>
                        <span className="bg-accent/20 px-2 py-0.5 rounded text-xs font-bold">{ticket.discount}</span>
                      </div>
                    </div>
                    <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                      {ticket.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      size="lg" 
                      className={`w-full text-sm sm:text-base ${ticket.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'}`}
                      onClick={() => handleTicketPurchase(ticket.stripe_product_id, ticket.name)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === ticket.stripe_product_id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Buy Now
                        </>
                      )}
                    </Button>
                    
                    {/* Trust Badges & Security Seals */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-accent" />
                          <span>SSL Encrypted</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-accent" />
                          <span>Secure Checkout</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          <span>Money-Back Guarantee</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* NEW FOR 2026 Section */}
            <div className="max-w-4xl mx-auto mt-12 sm:mt-16 mb-16 sm:mb-20 px-4">
              <div className="text-center mb-6 sm:mb-8">
                <Badge variant="outline" className="mb-4 text-accent border-accent">
                  NEW FOR 2026
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  Two Stages, <span className="text-accent">Beginner and Advanced</span>
                </h2>
              </div>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardContent className="p-6 sm:p-8">
                  <p className="text-base sm:text-lg text-center text-foreground/90 leading-relaxed">
                    Choose between the two stages, switch at any time during the day, all sessions recorded so you can catch up on both stages
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent fill-accent flex-shrink-0" />
                <span className="text-foreground/70">200+ Attended 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <span className="text-foreground/70">Money-Back Guarantee</span>
              </div>
            </div>
          </section>

          {/* Video Testimonials Section */}
          {(isAdmin || dbTestimonials.length > 0) && (
            <section className="mb-16 sm:mb-24">
              <div className="text-center mb-8 sm:mb-12 px-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                  Don't Just Take <span className="text-accent">Our Word</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Hear from past attendees about their transformative experience
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
                {dbTestimonials.length > 0 ? (
                  dbTestimonials.map((testimonial) => (
                    <VideoTestimonialCard
                      key={testimonial.id}
                      quote={testimonial.quote}
                      author={testimonial.author}
                      year={testimonial.year}
                      thumbnailUrl={testimonial.thumbnail_url}
                      videoUrl={testimonial.video_url}
                    />
                  ))
                ) : (
                  videoTestimonials.map((testimonial, index) => (
                    <VideoTestimonialCard
                      key={index}
                      quote={testimonial.quote}
                      author={testimonial.author}
                      year={testimonial.year}
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {/* Previous Speakers Showcase */}
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Previous <span className="text-accent">Speakers</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Join the caliber of experts who've shared their insights at Festival of AI
              </p>
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground px-4">Loading speakers...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4">
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
                      <div className="p-3 sm:p-4">
                        <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1 line-clamp-1">{speaker.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 line-clamp-2">{speaker.title}</p>
                        <p className="text-xs text-accent font-semibold line-clamp-1">{speaker.company}</p>
                        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
                          {speaker.years.map((year) => (
                            <Badge key={year} variant="outline" className="text-xs px-1.5 py-0.5">
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

            <div className="text-center px-4">
              <p className="text-base sm:text-lg text-accent font-semibold">
                And many more world-class speakers confirmed for 2026! 🚀
              </p>
            </div>
          </section>

          {/* Value Stack Section */}
          <section className="mb-16 sm:mb-24">
            <Card className="bg-gradient-to-br from-primary/20 via-card/50 to-secondary/20 backdrop-blur-sm border-primary mx-4">
              <CardContent className="p-6 sm:p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
                  <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                      What You <span className="text-accent">Get</span>
                    </h2>
                    <ul className="space-y-2 sm:space-y-4">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm sm:text-base md:text-lg">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-center lg:text-left">
                  <div className="space-y-3 sm:space-y-4">
                      <p className="text-lg sm:text-xl font-semibold text-accent mb-3 sm:mb-4">Choose Your Ticket:</p>
                      {ticketTypes.map((ticket) => (
                        <div key={ticket.stripe_product_id} className="bg-background/90 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                            <h3 className="text-lg sm:text-xl font-bold">{ticket.name}</h3>
                            {ticket.popular && (
                              <Badge className="bg-accent text-accent-foreground self-start sm:self-auto">Popular</Badge>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2 sm:gap-3 mb-3">
                            <span className="text-2xl sm:text-3xl font-black text-accent">{ticket.price}</span>
                            <span className="text-sm sm:text-base text-muted-foreground line-through">{ticket.regularPrice}</span>
                            <span className="text-xs sm:text-sm text-accent font-semibold bg-accent/20 px-2 py-1 rounded">{ticket.discount}</span>
                          </div>
                          <Button 
                            size="lg" 
                            className={`w-full text-sm sm:text-base ${ticket.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'}`}
                            onClick={() => handleTicketPurchase(ticket.stripe_product_id, ticket.name)}
                            disabled={checkoutLoading !== null}
                          >
                            {checkoutLoading === ticket.stripe_product_id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Buy Now
                              </>
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
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                An Inspiring <span className="text-accent">Location</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8">
                The National Space Centre isn't just a venue—it's a statement. As the UK's largest planetarium and space attraction, it embodies the spirit of exploration and innovation that defines Festival of AI. Where better to explore the future of artificial intelligence than at a location dedicated to pushing the boundaries of human knowledge and achievement?
              </p>
            </div>

            {/* Venue Gallery - 4 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={venueExterior} 
                  alt="National Space Centre Exterior"
                  className="w-full h-48 sm:h-56 md:h-64 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={venueRockets} 
                  alt="Rockets Display"
                  className="w-full h-48 sm:h-56 md:h-64 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={venuePlanetarium} 
                  alt="Planetarium"
                  className="w-full h-48 sm:h-56 md:h-64 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={venueEventSpace} 
                  alt="Event Space"
                  className="w-full h-48 sm:h-56 md:h-64 object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Venue Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
              {venueFeatures.map((feature, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-border">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 text-accent mb-2 sm:mb-3">
                      {feature.icon}
                    </div>
                    <p className="font-semibold text-sm sm:text-base">{feature.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Event Gallery Section */}
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Festival of AI <span className="text-accent">2025 Highlights</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the energy, innovation, and connections from our 2025 event
              </p>
            </div>

            <div className="px-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                {galleryImages.map((image, index) => (
                  <div 
                    key={index}
                    className={`${image.aspectRatio} overflow-hidden rounded-lg cursor-pointer group`}
                    onClick={() => handleImageClick(index)}
                  >
                    <img 
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <ImageLightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            images={galleryImages}
            currentIndex={lightboxIndex}
            onNavigate={setLightboxIndex}
          />

          {/* FAQ Section */}
          <section className="mb-16 sm:mb-24">
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Frequently Asked <span className="text-accent">Questions</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about Festival of AI 2026
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 px-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </section>

          {/* Risk Reversal Section */}
          <section className="mb-16 sm:mb-24 px-4">
            <Card className="bg-card/50 backdrop-blur-sm border-accent/50">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-accent mx-auto mb-4 sm:mb-6" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  Risk-Free <span className="text-accent">Guarantee</span>
                </h2>
                <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto mb-3 sm:mb-4">
                  Full refund before June 30th, 2026. No questions asked.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Transfer your ticket anytime, free of charge. Your satisfaction is guaranteed.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Final CTA Section */}
          <section className="text-center px-4">
            <Card className="bg-gradient-to-r from-primary/30 to-secondary/30 backdrop-blur-sm border-primary mx-4">
              <CardContent className="p-6 sm:p-8 md:p-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                  Join 200+ AI Innovators <span className="text-accent">in 2026</span>
                </h2>
                
                <ul className="max-w-2xl mx-auto mb-6 sm:mb-8 space-y-1.5 sm:space-y-2 text-left">
                  <li className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent flex-shrink-0" />
                    World-class speakers and cutting-edge insights
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent flex-shrink-0" />
                    Hands-on workshops and practical AI applications
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent flex-shrink-0" />
                    Exclusive networking with industry leaders
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent flex-shrink-0" />
                    Lifetime access to all session replays
                  </li>
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto mb-4 sm:mb-6">
                  {ticketTypes.map((ticket) => (
                    <Button 
                      key={ticket.stripe_product_id}
                      size="lg" 
                      className={`${ticket.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-6 h-auto`}
                      onClick={() => handleTicketPurchase(ticket.stripe_product_id, ticket.name)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === ticket.stripe_product_id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          {ticket.name} - {ticket.price}
                        </>
                      )}
                    </Button>
                  ))}
                </div>

                <div className="text-xs sm:text-sm text-muted-foreground">
                  Questions? <Link to="/contact" className="text-accent hover:underline font-semibold">Contact us</Link>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </main>

      <MinimalFooter />
      
      {/* Discount Banner */}
      <DiscountBanner />
    </div>
  );
};

export default LaunchOffer;
