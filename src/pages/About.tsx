import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Heart, Sparkles } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About <span className="text-accent">Festival of AI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              More than just another AI conference - it's where practical knowledge meets real-world application.
            </p>
          </div>

          {/* Story Section */}
          <section className="mb-20">
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-foreground/80 text-lg">
                  <p>
                    Let's be honest, most AI events barely scratch the surface. You get the same "What is ChatGPT?" 
                    slide deck recycled for the hundredth time, followed by vague promises about the future.
                  </p>
                  <p className="font-semibold text-foreground">Not here.</p>
                  <p>
                    At Festival of AI, we start with a clear, friendly Introduction to AI, just to make sure everyone's 
                    on the same page. But from there, we shift gears fast, leaving no one behind.
                  </p>
                  <p>
                    The rest of the day is built around <strong>real-world strategy</strong>, <strong>tactical walkthroughs</strong>, 
                    and <strong>plug-and-play tools</strong> you can start using the next day in your business.
                  </p>
                  <p>
                    Whether you're a complete beginner or already testing the waters, you'll leave this event thinking:
                  </p>
                  <p className="text-2xl font-bold text-accent text-center my-8">
                    "That was the most useful day I've ever spent on AI."
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Values */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Practical Focus</h3>
                  <p className="text-muted-foreground">
                    Every session is designed to give you actionable insights you can implement immediately.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Inclusive Community</h3>
                  <p className="text-muted-foreground">
                    From beginners to experts, everyone finds value and feels welcome at Festival of AI.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Innovation First</h3>
                  <p className="text-muted-foreground">
                    We showcase the cutting edge of AI while keeping it grounded in real business needs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* What You'll Learn */}
          <section>
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-8 text-center">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-2xl">✓</span>
                    <p>How to implement AI tools that actually save time and money</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-2xl">✓</span>
                    <p>Real-world case studies from businesses using AI successfully</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-2xl">✓</span>
                    <p>Hands-on workshops with popular AI platforms and tools</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-2xl">✓</span>
                    <p>Networking opportunities with AI practitioners and innovators</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-2xl">✓</span>
                    <p>Strategy sessions on integrating AI into your workflow</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-2xl">✓</span>
                    <p>Future trends and how to stay ahead of the curve</p>
                  </div>
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

export default About;
