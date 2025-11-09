import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, CreditCard, Calendar } from "lucide-react";
import { addDays, nextMonday, set } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

const Tickets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [loadingTicket, setLoadingTicket] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Calculate next Monday at 12:00 PM (lunchtime)
  const getNextMondayLunchtime = () => {
    const now = new Date();
    const monday = nextMonday(now);
    return set(monday, { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
  };

  const superEarlyBirdEndDate = getNextMondayLunchtime();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("stripe_products")
      .select("*")
      .eq("active", true)
      .eq("product_type", "ticket");

    if (error) {
      console.error("Failed to load products", error);
    } else {
      setProducts(data || []);
    }
  };

  const handleBuyNow = async (ticketName: string) => {
    setLoadingTicket(ticketName);
    
    try {
      const product = products.find(p => 
        p.product_name.toLowerCase().includes(ticketName.toLowerCase())
      );

      if (!product) {
        toast({
          title: "Product Not Found",
          description: "This ticket is not available yet. Please contact support.",
          variant: "destructive",
        });
        setLoadingTicket(null);
        return;
      }

      // Add to cart and navigate to checkout
      await addToCart(product.id);
      navigate("/checkout");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTicket(null);
    }
  };

  const ticketTiers = [
    {
      name: "Festival of AI 2026",
      price: "£497",
      originalPrice: null,
      discount: null,
      description: "In-person access to Festival of AI 2026",
      features: [
        "Full day access to all sessions",
        "Networking reception",
        "Gift bag",
        "Workbook",
        "12 months access to Practical AI",
      ],
      highlighted: false,
      footerNote: "Switch between virtual and in-person at any time",
    },
    {
      name: "Workshop",
      price: "£197",
      originalPrice: "£697",
      discount: "72%",
      description: "Full access including exclusive workshops",
      features: [
        "Full day access to all sessions",
        "Access to all workshops",
        "Networking reception",
        "Gift bag",
        "Workbook",
        "12 months access to Practical AI",
      ],
      highlighted: true,
    },
  ];

  const groupOptions = [
    {
      size: "3-5 people",
      discount: "10% off",
      description: "Perfect for small teams",
    },
    {
      size: "6-10 people",
      discount: "15% off",
      description: "Great for departments",
    },
    {
      size: "10+ people",
      discount: "20% off",
      description: "Ideal for companies",
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
              Get Your <span className="text-accent">Tickets</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Secure your spot at Festival of AI 2026 - October 16th at the National Space Centre, Leicester
            </p>
            
            {/* Countdown Timer */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="inline-block bg-accent/20 text-accent border border-accent/50 px-4 py-2 rounded-full text-sm font-bold mb-4">
                    🎉 SUPER EARLY BIRD PRICING - Limited Time Only!
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Offer Ends In:</h3>
                  <p className="text-sm text-muted-foreground">Monday at Lunchtime</p>
                </div>
                <CountdownTimer targetDate={superEarlyBirdEndDate} />
              </div>
            </div>
          </div>

          {/* Ticket Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
            {ticketTiers.map((tier, index) => (
              <Card
                key={index}
                className={`backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  tier.highlighted
                    ? "border-accent bg-accent/10 ring-2 ring-accent"
                    : "bg-card/50 border-border hover:border-primary"
                }`}
              >
                <CardContent className="p-8">
                  {tier.highlighted && (
                    <div className="bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                      SUPER EARLY BIRD
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-black text-accent">{tier.price}</span>
                      {tier.originalPrice && (
                        <>
                          <span className="text-lg text-muted-foreground line-through">
                            {tier.originalPrice}
                          </span>
                          <span className="text-sm font-bold text-accent bg-accent/20 px-2 py-1 rounded">
                            SAVE {tier.discount}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">per person</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      tier.highlighted
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-primary hover:bg-primary/90"
                    }`}
                    size="lg"
                    onClick={() => handleBuyNow(tier.name)}
                    disabled={loadingTicket === tier.name}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {loadingTicket === tier.name ? "Processing..." : "Buy Now"}
                  </Button>
                  {tier.footerNote && (
                    <p className="text-xs text-muted-foreground text-center mt-3 italic">
                      {tier.footerNote}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Group Discounts */}
          <Card className="mb-16 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8 text-center">Group Discounts Available</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {groupOptions.map((option, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-accent mb-2">{option.discount}</div>
                    <div className="text-xl font-semibold mb-1">{option.size}</div>
                    <div className="text-muted-foreground text-sm">{option.description}</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  Contact Us for Group Bookings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What's Included */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8 text-center">What's Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🎓</span>
                  <div>
                    <h3 className="font-bold mb-1">Educational Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Full day access to keynotes and panel discussions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🤝</span>
                  <div>
                    <h3 className="font-bold mb-1">Networking</h3>
                    <p className="text-sm text-muted-foreground">
                      Evening reception and multiple networking breaks
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🎁</span>
                  <div>
                    <h3 className="font-bold mb-1">Gift Bag</h3>
                    <p className="text-sm text-muted-foreground">
                      Event merchandise and sponsor goodies
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">📚</span>
                  <div>
                    <h3 className="font-bold mb-1">Workbook</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive event workbook and materials
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practical AI Section */}
          <Card className="mt-16 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-primary">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Included: <span className="text-accent">12 Months of Practical AI</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Your learning doesn't end when the event does
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
                  <div className="text-accent text-3xl mb-4">🎓</div>
                  <h3 className="text-xl font-bold mb-3">What is Practical AI?</h3>
                  <p className="text-muted-foreground">
                    Practical AI is an exclusive private community where Festival of AI attendees continue their learning journey throughout the year. Connect with fellow AI enthusiasts, share insights, and stay at the cutting edge of AI innovation.
                  </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
                  <div className="text-accent text-3xl mb-4">✨</div>
                  <h3 className="text-xl font-bold mb-3">What's Included?</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span>Monthly expert-led webinars and workshops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span>Private discussion forums and channels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span>Exclusive resources and case studies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span>Networking with peers and industry leaders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span>Early access to 2027 tickets and content</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-accent mb-2">
                  Worth £297 - Included FREE with Every Ticket
                </p>
                <p className="text-sm text-muted-foreground">
                  Continue learning and growing long after the event ends
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="mt-16 bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    What is the difference between "Pay in Full" and "Pay Monthly"?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <strong>Pay in Full:</strong> Pay the complete ticket price upfront and secure your Super Early Bird discount immediately. This is the most cost-effective option.
                    <br /><br />
                    <strong>Pay Monthly:</strong> Spread your payment over installments leading up to the event. The total amount remains the same, but you can manage your budget more flexibly. Monthly payment plans must be completed before the event date.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    What happens when Super Early Bird pricing ends?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    When the Super Early Bird period ends on Monday at lunchtime, ticket prices will increase to the next pricing phase. Standard and Virtual tickets will move from £147 to a higher price point, and Workshop tickets will increase from £197. We recommend booking now to lock in the maximum discount of up to 72% off regular prices.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    What is your refund policy?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We offer a full, no-questions-asked refund if you cancel up to 3 months before the event (by July 16, 2026). After this date, we cannot offer refunds. We encourage you to book with confidence knowing you have plenty of time to adjust your plans if needed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    Can I upgrade my ticket after purchase?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! You can upgrade from Standard to Workshop or from Virtual to either Standard or Workshop at any time before the event. Simply pay the difference between your current ticket and the upgraded ticket at the then-current pricing. Contact our support team to process your upgrade.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    Are group discounts available?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely! We offer group discounts for teams and organizations. Groups of 3-5 people receive 10% off, 6-10 people get 15% off, and groups of 10+ people receive 20% off the total ticket price. Group discounts can be combined with current pricing phases for maximum savings. Contact us using the button above to arrange your group booking.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">
                    What is included in the gift bag and workbook?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Every attendee receives a curated gift bag containing event merchandise, sponsor goodies, and exclusive items from our partners. The comprehensive workbook includes session notes, speaker insights, resources, and space for your own notes throughout the day. Virtual attendees receive digital versions of both the gift bag contents and the workbook.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left">
                    Can I transfer my ticket to someone else?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, tickets are transferable. You can transfer your ticket to another person at no additional cost by contacting our support team with the new attendee's details at least 7 days before the event. The new attendee will receive all the same benefits and materials included with your original ticket purchase.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Tickets;
