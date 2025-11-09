import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Mail, Download } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import CheckoutProgress from "@/components/checkout/CheckoutProgress";

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // If no session_id in URL, redirect to tickets page
    if (!sessionId) {
      navigate("/tickets");
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Indicator */}
          <div className="mb-12">
            <CheckoutProgress currentStep="confirmation" isGuest={false} />
          </div>
          
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Thank You for Your <span className="text-accent">Purchase!</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Your ticket to Festival of AI 2026 has been confirmed
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">What Happens Next?</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Check Your Email</h3>
                    <p className="text-muted-foreground">
                      You'll receive a confirmation email with your ticket details and receipt within the next few minutes. 
                      Please check your spam folder if you don't see it.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Download className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Download Your Ticket</h3>
                    <p className="text-muted-foreground">
                      Your digital ticket will be available in your email and dashboard. 
                      You can also access it anytime from your account.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Save the Date</h3>
                    <p className="text-muted-foreground">
                      Festival of AI 2026 will take place on <strong>October 16th, 2026</strong> at the 
                      National Space Center, Leicester. Add it to your calendar now!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details Reminder */}
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Event Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">Date & Time</p>
                  <p className="text-muted-foreground">October 16th, 2026</p>
                  <p className="text-muted-foreground">9:00 AM - 6:00 PM</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Venue</p>
                  <p className="text-muted-foreground">National Space Center</p>
                  <p className="text-muted-foreground">Exploration Drive, Leicester, LE4 5NS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Included Reminder */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Your Ticket Includes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🎓</span>
                  <div>
                    <p className="font-bold">Full Day Access</p>
                    <p className="text-sm text-muted-foreground">All keynotes and sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🤝</span>
                  <div>
                    <p className="font-bold">Networking Reception</p>
                    <p className="text-sm text-muted-foreground">Evening event with peers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">🎁</span>
                  <div>
                    <p className="font-bold">Gift Bag</p>
                    <p className="text-sm text-muted-foreground">Event merchandise & goodies</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">📚</span>
                  <div>
                    <p className="font-bold">12 Months Practical AI</p>
                    <p className="text-sm text-muted-foreground">Worth £297 - included free</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/dashboard")}
              className="bg-accent hover:bg-accent/90"
            >
              View Your Dashboard
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/")}
            >
              Return to Home
            </Button>
          </div>

          {/* Support Section */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-2">
              Questions about your ticket?
            </p>
            <p className="text-sm">
              Contact us at{" "}
              <a 
                href="mailto:tickets@festivalofai.com" 
                className="text-accent hover:underline"
              >
                tickets@festivalofai.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;
