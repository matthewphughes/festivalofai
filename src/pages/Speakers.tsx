import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Twitter, Globe } from "lucide-react";
import matthewHughesImage from "@/assets/speaker-matthew-hughes.jpg";

const Speakers = () => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<typeof speakers[0] | null>(null);
  const [yearFilter, setYearFilter] = useState<"all" | "2025" | "2026">("all");

  const speakers = [
    {
      name: "Matthew Hughes",
      title: "Festival of AI Founder",
      bio: "Known online as The King of Video, seasoned YouTube strategist and video marketing mentor.",
      image: matthewHughesImage,
      fullBio: "Matt Hughes, known online as The King of Video, is a seasoned YouTube strategist and video marketing mentor helping entrepreneurs and business owners confidently grow their brand on YouTube. With over a decade in content creation and a flair for making things fun and simple, Matt helps clients launch channels, repurpose content like pros, and show up consistently without the overwhelm. He's the founder of Creator Events, Festival of AI and TubeFest.",
      years: [2025, 2026],
      social: {
        linkedin: "https://linkedin.com/in/matthughes",
        twitter: "https://twitter.com/matthughes",
        website: "https://festivalof.ai"
      }
    },
    {
      name: "Heather Murray",
      title: "Generative AI Expert & Founder of AI for Non-Techies",
      bio: "Top 5 MarTech influencer globally, international speaker and award-winning AI training expert.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/Heather-Murray.png",
      fullBio: "Heather is a generative AI expert, Top 5 MarTech influencer globally, international speaker and Founder of AI for Non-Techies (award-winning AI training and learning hub). Regularly featured in Forbes magazine, Heather brings energy and enthusiasm to the world of AI. Her accessible, jargon-free approach helps people overcome confusion, reluctance and fear when it comes to where to start. Heather has formed powerful working partnerships with the likes of Toyota, Mitsubishi and Salesforce, and drove $75m in client pipeline in 2023, all with the help of AI.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      }
    },
    {
      name: "Kristian Downer",
      title: "AI Trainer & Marketing Strategist",
      bio: "Founder of DowSocial, running practical AI workshops for business owners.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/KristianDowner.png",
      fullBio: "Kristian runs practical AI workshops and training sessions designed to help business owners cut through the hype and take action. He's a trainer for Enterprise Nation's Google Digital Garage programme, where he has supported thousands of UK SMEs. His jargon-free approach focuses on helping businesses define their real challenges and match them with the right AI tools, believing that asking better questions leads to better results.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com"
      }
    },
    {
      name: "Andrew George",
      title: "E-commerce Strategist & Automation Expert",
      bio: "Founder of APG Personalised and co-creator of Product Growth Lab.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/Andrew-George.png",
      fullBio: "Andrew George is an e-commerce strategist and automation expert who helps product-based business owners simplify their marketing, grow their audience, and sell more, without burning out. He's the founder of APG Personalised, a premium gift brand, and the co-creator of Product Growth Lab. With deep expertise in Klaviyo, Shopify, and AI tools like ChatGPT, Andrew is known for turning tech overwhelm into practical, real-world action.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com",
        website: "https://apgpersonalised.com"
      }
    },
    {
      name: "Chantelle Davison",
      title: "Six-Figure Copywriter & Messaging Expert",
      bio: "Teaching copywriters and business owners how to leverage AI as a creative partner.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/Chantelle-Davison.png",
      fullBio: "Chantelle Davison is a six-figure copywriter and messaging expert, trusted by some of the biggest 6- and 7-figure entrepreneurs in the online space. Today, Chantelle teaches copywriters and small business owners how to leverage AI not as their default setting, but as their competitive edge, uncovering deep psychological insights and emotional motivations in their audience.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      }
    },
    {
      name: "Gemma Went",
      title: "Multi-Award Winning Online Business Mentor",
      bio: "Founder of The Lighthouse®, blending corporate experience with innovative AI frameworks.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/Gemma-Went.png",
      fullBio: "Gemma Went is the Founder of The Lighthouse®, The Conscious Consultant Certification®, and The Conscious Energy Clearing Certification®. A multi-award winning Online Business Mentor, Strategist, Energy Practitioner and Certified Mindset Coach, she has 3 decades of experience. Gemma blends corporate, brand and agency experience with all she's learned from scaling two of her own businesses to create tried and tested frameworks that helped her clients get to six, multi-six and seven figures over the last twelve years in the online space.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com"
      }
    },
    {
      name: "Hayley Brown",
      title: "Founder & CEO, AllIn1.app",
      bio: "AI Strategist and Automation Architect specializing in AI-powered business automation.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/Hayley-Brown.png",
      fullBio: "Hayley Brown is the founder and CEO of AllIn1.app, a UK-based agency specialising in AI-powered business automation for growth-focused entrepreneurs and enterprises. With a reputation for simplifying the complex, Hayley helps businesses systemise operations, scale with fewer staff, and stay ahead in the age of intelligent automation. She's the creator of 'AI for the Tech Shy,' a growing community and knowledge hub empowering non-technical business owners to confidently adopt AI.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com",
        website: "https://allin1.app"
      }
    },
    {
      name: "Laura Goodsell",
      title: "Canva Creator & Canvassador",
      bio: "Helping small business owners use Canva with confidence for branding and marketing.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/Laura-Goodsell.png",
      fullBio: "I'm Laura —a Canva Creator, and Canvassador, I help small business owners use Canva with confidence—to create visuals that support their branding, marketing, and everyday content. Through my memberships, courses, and YouTube tutorials, I teach simple, effective design skills that help businesses save time, show up professionally, and connect with their audience in a more visual, impactful way.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com",
        website: "https://lauragoodsell.com"
      }
    },
    {
      name: "Rick Dubidat",
      title: "Business Growth Strategist & AI Consultant",
      bio: "Certified coach helping entrepreneurs build high-performance businesses with AI and automation.",
      image: "https://festivalof.ai/wp-content/uploads/2025/05/Rick-Dubidat-1.png",
      fullBio: "Rick Dubidat is a sought-after business coach and growth strategist who helps entrepreneurs build high-performance businesses without sacrificing their sanity, family time, or freedom. With decades of leadership experience and a powerful blend of coaching qualifications, AI expertise, and marketing strategy, Rick is the go-to mentor for small business owners ready to scale with confidence. A certified business coach trained under Tony Robbins' coaching methodologies, an AI consultant, and a 2x World Champion martial artist.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com"
      }
    },
    {
      name: "Chase Buckner",
      title: "Director of Product Marketing at HighLevel",
      bio: "Host of Release Radars, helping entrepreneurs use automation and AI to grow smarter.",
      image: "https://festivalof.ai/wp-content/uploads/2025/10/ChaseB.png",
      fullBio: "Chase Buckner is the Director of Product Marketing at HighLevel and host of Release Radars. Before joining HighLevel, he co-founded and scaled a seven-figure agency, which became one of HighLevel's first customers. Chase helps entrepreneurs and agencies use automation and AI to grow smarter, simplify processes, and achieve real results, bringing both product expertise and hands-on business experience to his presentations.",
      years: [2025],
      social: {
        linkedin: "https://linkedin.com",
        website: "https://gohighlevel.com"
      }
    },
  ];

  const filteredSpeakers = speakers.filter(speaker => {
    if (yearFilter === "all") return true;
    return speaker.years.includes(parseInt(yearFilter));
  });

  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Our <span className="text-accent">Speakers</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn from world-class AI practitioners, innovators, and thought leaders who are shaping 
              the future of artificial intelligence.
            </p>
          </div>

          {/* Year Filter */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex gap-2 p-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
              <Button
                onClick={() => setYearFilter("all")}
                variant={yearFilter === "all" ? "default" : "ghost"}
                className={yearFilter === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                All Speakers
              </Button>
              <Button
                onClick={() => setYearFilter("2025")}
                variant={yearFilter === "2025" ? "default" : "ghost"}
                className={yearFilter === "2025" ? "bg-primary text-primary-foreground" : ""}
              >
                2025 Speakers
              </Button>
              <Button
                onClick={() => setYearFilter("2026")}
                variant={yearFilter === "2026" ? "default" : "ghost"}
                className={yearFilter === "2026" ? "bg-primary text-primary-foreground" : ""}
              >
                2026 Speakers
              </Button>
            </div>
          </div>

          {/* Speakers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredSpeakers.map((speaker, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 hover:scale-105 group cursor-pointer"
                onClick={() => setSelectedSpeaker(speaker)}
              >
                <CardContent className="p-6">
                  {/* Year Badges */}
                  <div className="flex gap-2 mb-4">
                    {speaker.years.map((year) => (
                      <Badge
                        key={year}
                        variant={year === 2026 ? "default" : "secondary"}
                        className={year === 2026 ? "bg-accent text-accent-foreground" : ""}
                      >
                        {year}
                      </Badge>
                    ))}
                  </div>
                  
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
