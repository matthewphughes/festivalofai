import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Mic, Users, Trophy, Video, Network, MapPin, Calendar,
  ArrowRight, Star, Clock
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const BecomeASpeaker = () => {
  const navigate = useNavigate();
  const deadline = new Date('2026-08-01T17:00:00');

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);

  const benefits = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Reach 300+ Live Attendees",
      description: "Share your AI expertise with an engaged audience of business leaders and innovators at the National Space Centre."
    },
    {
      icon: <Network className="h-8 w-8 text-primary" />,
      title: "Build Your Network",
      description: "Connect with fellow speakers, industry leaders, and potential collaborators in the AI and business space."
    },
    {
      icon: <Video className="h-8 w-8 text-primary" />,
      title: "Professional Recording",
      description: "Your session will be professionally recorded and can be used for your portfolio and marketing materials."
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Establish Authority",
      description: "Position yourself as a thought leader in practical AI applications for business."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Become a Speaker | Festival of AI</title>
        <meta name="description" content="Apply to speak at the Festival of AI. Share your AI expertise with 300+ attendees at the National Space Centre, Leicester." />
      </Helmet>
      <Navigation />

      {/* Countdown */}
      <div className="bg-primary/10 border-b border-primary/20 pt-28 pb-4 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">Applications close 1st August 2026</span>
            </div>
            <div className="flex items-center gap-3">
              {[
                { val: timeLeft.days, label: "days" },
                { val: timeLeft.hours, label: "hrs" },
                { val: timeLeft.minutes, label: "min" },
                { val: timeLeft.seconds, label: "sec" },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-primary font-bold">:</span>}
                  <div className="flex items-center gap-1 bg-background/50 rounded-lg px-3 py-2">
                    <span className="text-2xl font-bold text-primary tabular-nums">{String(t.val).padStart(2, '0')}</span>
                    <span className="text-xs text-muted-foreground">{t.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-16 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Applications Now Open</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
            Become a <span className="text-primary">Festival of AI</span> Speaker
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Share your expertise with 300+ live attendees at the UK's premier practical AI conference.
            Inspire, educate, and connect with an audience ready to transform their businesses with AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => navigate('/call-for-speakers')} className="text-lg">
              Apply to Speak
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/speakers')}>
              Meet Our Speakers
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-left">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="font-semibold text-foreground">October 16th, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold text-foreground">National Space Centre, Leicester</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Expected Attendees</p>
                <p className="font-semibold text-foreground">300+ Live</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
            Why Speak at <span className="text-primary">Festival of AI?</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Speaking at Festival of AI offers unique opportunities to grow your brand, expand your network, and establish yourself as a thought leader.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all">
                <CardContent className="p-6">
                  <div className="mb-4">{b.icon}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-muted-foreground">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What We're Looking For */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-12">
            What We're <span className="text-primary">Looking For</span>
          </h2>
          <div className="space-y-6">
            {[
              {
                title: "Main Stage Talk",
                desc: "We're seeking AI experts and business leaders who can deliver inspiring talks on practical AI applications. Share real-world case studies, strategies, and insights that attendees can implement immediately."
              },
              {
                title: "Full-Day Workshop",
                desc: "Lead a full-day, hands-on workshop where attendees learn by doing. Ideal for deep-dive tool demonstrations, workflow tutorials, and guided AI implementation exercises."
              },
              {
                title: "Pre-Event Webinar",
                desc: "All speakers run a promotional webinar ahead of the event to build excitement and showcase their expertise. This helps drive ticket sales and gives attendees a preview of your session."
              },
              {
                title: "Bring Your Audience",
                desc: "We ask speakers to bring at least 10 attendees from their own audience. We'll pay up to £1,000 per speaker on an affiliate basis for every ticket sold through your network."
              },
            ].map((item, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
            Speaker <span className="text-primary">FAQs</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Common questions about speaking at Festival of AI
          </p>
          <Accordion type="single" collapsible className="space-y-4">
            {[
              { q: "How do I choose the right track for my session?", a: "Choose Main Stage for keynote-style talks or a Full-Day Workshop for hands-on interactive sessions. If you're unsure, describe your session and we'll help place you." },
              { q: "Do I need to be a professional speaker?", a: "Not at all! We welcome first-time speakers alongside seasoned professionals. What matters is your expertise and passion for the subject." },
              { q: "What's the session format?", a: "Main Stage talks are typically 30-40 minutes plus Q&A. Workshops run for a full day. All sessions are professionally recorded." },
              { q: "What's the pre-event webinar requirement?", a: "All speakers are asked to host a promotional webinar before the event. This helps build excitement, showcases your expertise, and drives ticket sales. We'll support you with promotion and logistics." },
              { q: "How does the affiliate programme work?", a: "We ask speakers to bring at least 10 attendees from their audience. For every ticket sold through your unique referral link, you'll earn an affiliate commission — up to £1,000 per speaker." },
              { q: "Is travel and accommodation covered?", a: "We work with speakers on a case-by-case basis. Let us know your requirements in your application and we'll do our best to accommodate." },
              { q: "When will I hear back about my application?", a: "We review applications on a rolling basis and aim to respond within 2-3 weeks of submission. You'll receive email updates about your application status." },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 bg-card/50 backdrop-blur-sm rounded-lg px-6">
                <AccordionTrigger className="text-left text-foreground hover:text-primary">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to <span className="text-primary">Apply?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our lineup of exceptional speakers and share your AI expertise with the Festival of AI community.
          </p>
          <Button size="lg" onClick={() => navigate('/call-for-speakers')} className="text-lg">
            Start Your Application
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomeASpeaker;
