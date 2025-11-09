import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import spaceBg from "@/assets/space-bg.jpg";
import eventSpeaker1 from "@/assets/event-speaker-1.jpg";
import eventSpeaker2 from "@/assets/event-speaker-2.jpg";
import eventSpeaker3 from "@/assets/event-speaker-3.jpg";
import eventAudience1 from "@/assets/event-audience-1.jpg";
import eventAudience2 from "@/assets/event-audience-2.jpg";
import eventNetworking1 from "@/assets/event-networking-1.jpg";
import eventNetworking2 from "@/assets/event-networking-2.jpg";
import eventAtmosphere from "@/assets/event-atmosphere-1.jpg";
import { Calendar, MapPin, Users, Lightbulb, Rocket, Zap, Play } from "lucide-react";

const Index = () => {
  const [api, setApi] = useState<CarouselApi>();
  
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api]);

  const galleryImages = [
    { src: eventSpeaker1, alt: "Speaker presenting at Festival of AI 2025", label: "Inspiring Speakers" },
    { src: eventAudience1, alt: "Engaged audience", label: "Engaged Learning" },
    { src: eventNetworking1, alt: "Networking opportunities", label: "Networking" },
    { src: eventSpeaker2, alt: "Expert presentations", label: "Expert Insights" },
    { src: eventAtmosphere, alt: "Festival atmosphere", label: "Amazing Atmosphere" },
    { src: eventAudience2, alt: "Full venue", label: "Packed Sessions" },
    { src: eventNetworking2, alt: "Community connections", label: "Build Connections" },
    { src: eventSpeaker3, alt: "Industry leaders", label: "Industry Leaders" },
  ];

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

  const faqs = [
    {
      question: "Is this a pitchfest?",
      answer: "At the Festival of AI we are committed to making sure you get the best tips, tricks and strategies for growing your business using AI. This event is not a pitch fest, we're not trying to sell you onto a mastermind, a high ticket programme or something else, instead the speakers will provide true value."
    },
    {
      question: "What is the refund policy?",
      answer: "We're big believers in being good humans and so, if you need a refund before June 30th, you can drop us an email and we will issue a full refund with no questions asked. However, you can sell / transfer your ticket to another person free of charge at any time."
    },
    {
      question: "Will I have access to the speakers?",
      answer: "Our speakers are some of the most friendly people I've ever met. You will find them hanging around at the breaks, lunch and at the happy hour."
    },
    {
      question: "What are the best hotels?",
      answer: "Please check out the accommodation page for more information on hotels. We have a limited amount of spaces at the conference hotel so contact us for more information."
    },
    {
      question: "Are the sessions recorded?",
      answer: "Yes all sessions are recorded and every attendee will receive lifetime access to them via our online portal."
    },
    {
      question: "Is the venue accessible?",
      answer: "Yes the venue is on the second floor with lifts and wheelchair access and all rooms are accessible, we are doing our upmost to make the event accessible and inclusive, please contact us if you have any specific requirements that you feel we may have missed."
    },
    {
      question: "What are the closest transport links?",
      answer: "Please check out our travel and accommodation page for more information."
    },
    {
      question: "What if the event gets cancelled?",
      answer: "We are confident that the event will go ahead, however, if for any reason the event gets cancelled we will issue a full refund."
    }
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
        <div className="container mx-auto px-4 relative z-10 text-center py-20 md:py-32">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FESTIVAL OF AI
            </span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6 text-xl md:text-2xl font-semibold">
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
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-foreground/90">
            Discover practical AI that actually moves the needle for your business
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
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
              <Link to="/buy-replays">Buy 2025 Replays</Link>
            </Button>
          </div>
          
          {/* Carousel Gallery Highlights from 2025 */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">Highlights from 2025</h3>
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {galleryImages.map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="overflow-hidden border-2 border-border/50 hover:border-accent transition-colors">
                        <CardContent className="p-0">
                          <div className="relative aspect-video overflow-hidden group">
                            <img 
                              src={image.src} 
                              alt={image.alt} 
                              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                              <p className="text-base font-semibold">{image.label}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
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

      {/* FAQ Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Frequently Asked <span className="text-accent">Questions</span>
          </h2>
          <p className="text-xl text-center mb-12 text-muted-foreground">
            Everything you need to know about Festival of AI
          </p>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-accent">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
