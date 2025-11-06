import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import CountdownTimer from "@/components/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Calendar } from "lucide-react";
import { addDays, nextMonday, set } from "date-fns";

const Tickets = () => {
  // Calculate next Monday at 12:00 PM (lunchtime)
  const getNextMondayLunchtime = () => {
    const now = new Date();
    const monday = nextMonday(now);
    return set(monday, { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
  };

  const superEarlyBirdEndDate = getNextMondayLunchtime();
  const ticketTiers = [
    {
      name: "Standard",
      price: "£147",
      originalPrice: "£497",
      discount: "70%",
      description: "In-person access to Festival of AI 2026",
      features: [
        "Full day access to all sessions",
        "Networking reception",
        "Gift bag",
        "Workbook",
      ],
      highlighted: false,
    },
    {
      name: "Virtual",
      price: "£147",
      originalPrice: "£297",
      discount: "50%",
      description: "Join us online from anywhere",
      features: [
        "Full day virtual access to all sessions",
        "Digital gift bag",
        "Digital workbook",
      ],
      highlighted: false,
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
              Secure your spot at Festival of AI 2026 - October 16th at the National Space Center, Leicester
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
                    className={`w-full mb-3 ${
                      tier.highlighted
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-primary hover:bg-primary/90"
                    }`}
                    size="lg"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay in Full
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full ${
                      tier.highlighted
                        ? "border-accent text-accent hover:bg-accent/10"
                        : "border-primary text-primary hover:bg-primary/10"
                    }`}
                    size="lg"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Pay Monthly
                  </Button>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Tickets;
