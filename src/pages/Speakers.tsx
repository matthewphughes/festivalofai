import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Linkedin, Twitter, Globe } from "lucide-react";
import matthewHughesImage from "@/assets/speaker-matthew-hughes.jpg";

const Speakers = () => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<typeof speakers[0] | null>(null);

  const speakers = [
    {
      name: "Matthew Hughes",
      title: "Festival of AI Founder",
      bio: "Leading expert in practical AI implementation for businesses and founder of the Festival of AI.",
      image: matthewHughesImage,
      fullBio: "Matthew Hughes is the visionary founder of the Festival of AI, bringing together the brightest minds in artificial intelligence to share knowledge and inspire innovation. With years of experience in AI implementation and business transformation, Matthew is passionate about making AI accessible and practical for organizations of all sizes.",
      social: {
        linkedin: "https://linkedin.com/in/matthughes",
        twitter: "https://twitter.com/matthughes",
        website: "https://festivalofai.com"
      }
    },
    {
      name: "Dr. Sarah Chen",
      title: "Machine Learning Researcher",
      bio: "PhD in AI with focus on real-world business applications.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      fullBio: "Dr. Sarah Chen is a leading researcher in machine learning with a focus on practical business applications. Her work bridges the gap between cutting-edge research and real-world implementation.",
      social: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      }
    },
    {
      name: "James Anderson",
      title: "Tech Entrepreneur",
      bio: "Founder of multiple AI-powered startups and platforms.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      fullBio: "James Anderson is a serial entrepreneur who has founded multiple successful AI-powered startups, transforming industries through innovative technology solutions.",
      social: {
        linkedin: "https://linkedin.com",
        website: "https://jamesanderson.com"
      }
    },
    {
      name: "Emily Rodriguez",
      title: "Data Science Expert",
      bio: "Specializing in AI strategy and implementation for enterprises.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      fullBio: "Emily Rodriguez specializes in helping enterprises develop and execute AI strategies that drive real business value and competitive advantage.",
      social: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      }
    },
    {
      name: "Michael Park",
      title: "AI Product Designer",
      bio: "Creating user-friendly AI interfaces and experiences.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      fullBio: "Michael Park is dedicated to creating intuitive and accessible AI-powered interfaces that put users first while leveraging the power of artificial intelligence.",
      social: {
        linkedin: "https://linkedin.com",
        website: "https://michaelpark.design"
      }
    },
    {
      name: "Lisa Thompson",
      title: "Business AI Consultant",
      bio: "Helping companies transform their operations with AI.",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
      fullBio: "Lisa Thompson works with companies across industries to identify opportunities for AI-driven transformation and guide them through successful implementation.",
      social: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      }
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
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 hover:scale-105 group cursor-pointer"
                onClick={() => setSelectedSpeaker(speaker)}
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
                  <p className="text-muted-foreground mb-4">{speaker.bio}</p>
                  
                  {/* Social Icons */}
                  <div className="flex gap-3 mt-4">
                    {speaker.social.linkedin && (
                      <a
                        href={speaker.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {speaker.social.twitter && (
                      <a
                        href={speaker.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {speaker.social.website && (
                      <a
                        href={speaker.social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Speaker Profile Dialog */}
          <Dialog open={!!selectedSpeaker} onOpenChange={() => setSelectedSpeaker(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold mb-4">
                  {selectedSpeaker?.name}
                </DialogTitle>
              </DialogHeader>
              {selectedSpeaker && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={selectedSpeaker.image}
                      alt={selectedSpeaker.name}
                      className="w-full md:w-48 h-48 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-accent font-semibold text-xl mb-4">
                        {selectedSpeaker.title}
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedSpeaker.fullBio}
                      </p>
                    </div>
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex gap-4 pt-4 border-t border-border">
                    {selectedSpeaker.social.linkedin && (
                      <a
                        href={selectedSpeaker.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {selectedSpeaker.social.twitter && (
                      <a
                        href={selectedSpeaker.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                        <span>Twitter</span>
                      </a>
                    )}
                    {selectedSpeaker.social.website && (
                      <a
                        href={selectedSpeaker.social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

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
