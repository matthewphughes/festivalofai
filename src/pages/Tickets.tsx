import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Tickets = () => {
  const ticketTiers = [
    {
      name: "Early Bird",
      price: "£199",
      originalPrice: "£299",
      description: "Limited availability - book now to save!",
      features: [
        "Full day access to all sessions",
        "Breakfast, lunch & refreshments",
        "Access to all workshops",
        "Networking reception",
        "Event materials & resources",
        "Certificate of attendance",
      ],
      highlighted: true,
    },
    {
      name: "Standard",
      price: "£249",
      originalPrice: null,
      description: "Best value for individual attendees",
      features: [
        "Full day access to all sessions",
        "Breakfast, lunch & refreshments",
        "Access to all workshops",
        "Networking reception",
        "Event materials & resources",
        "Certificate of attendance",
      ],
      highlighted: false,
    },
    {
      name: "VIP",
      price: "£399",
      originalPrice: null,
      description: "Premium experience with exclusive benefits",
      features: [
        "Everything in Standard, plus:",
        "VIP seating in all sessions",
        "Private meet & greet with speakers",
        "Exclusive VIP lunch",
        "Premium swag bag",
        "1-year access to event recordings",
        "Priority Q&A opportunities",
      ],
      highlighted: false,
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
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Secure your spot at Festival of AI 2026 - October 16th at the National Space Center, Leicester
            </p>
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
                      BEST VALUE
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-accent">{tier.price}</span>
                      {tier.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          {tier.originalPrice}
                        </span>
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
                  >
                    Book Now
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🎓</span>
                  <div>
                    <h3 className="font-bold mb-1">Educational Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Full access to all keynotes, workshops, and panel discussions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🍽️</span>
                  <div>
                    <h3 className="font-bold mb-1">Catering</h3>
                    <p className="text-sm text-muted-foreground">
                      Breakfast, lunch, and refreshments throughout the day
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
                  <span className="text-accent text-2xl">📚</span>
                  <div>
                    <h3 className="font-bold mb-1">Resources</h3>
                    <p className="text-sm text-muted-foreground">
                      Digital materials, slides, and exclusive content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🎁</span>
                  <div>
                    <h3 className="font-bold mb-1">Swag Bag</h3>
                    <p className="text-sm text-muted-foreground">
                      Event merchandise and sponsor goodies
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">📜</span>
                  <div>
                    <h3 className="font-bold mb-1">Certificate</h3>
                    <p className="text-sm text-muted-foreground">
                      Official certificate of attendance
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
